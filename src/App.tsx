import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import {
  Box,
  Clock,
  FlipVertical2,
  Globe,
  Grid2x2,
  Home,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  ActiveEmote,
  EmoteKey,
  GameConfig,
  GameOutcome,
  MoveRecord,
  PendingPromotion,
  SkillVfxEvent,
} from './types/game';
import {
  getInitialLanguage,
  TRANSLATIONS,
  type Language,
  type TranslationPack,
} from './i18n/translations';
import { getPieceMeta, PIECE_VALUES, TIME_CONTROL_SECONDS } from './data/roster';
import { computeBotMove } from './engine/chessAI';
import { soundEngine } from './engine/soundEngine';
import { ChessBoard } from './components/board/ChessBoard';
import type { BoardView } from './components/board/isometric';
import { PlayerHud } from './components/hud/PlayerHud';
import { ActionCluster } from './components/hud/ActionCluster';
import { PromotionModal } from './components/modals/PromotionModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { RosterModal } from './components/modals/RosterModal';
import { MainMenu } from './components/screens/MainMenu';

const DEFAULT_CONFIG: GameConfig = {
  mode: 'bot',
  difficulty: 'medium',
  timeControl: 'rapid',
  playerColor: 'w',
  autoFlipLocal: false,
};

const MAX_ARMY_POINTS = 39; // 8P + 2N + 2B + 2R + 1Q

function formatClock(ms: number | null): string {
  if (ms === null) return '∞';
  const clamped = Math.max(0, ms);
  const totalSec = Math.ceil(clamped / 1000);
  if (clamped < 20000 && clamped > 0) {
    const sec = Math.floor(clamped / 1000);
    const tenths = Math.floor((clamped % 1000) / 100);
    return `0:${sec.toString().padStart(2, '0')}.${tenths}`;
  }
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function computeArmyStats(chess: Chess, history: Move[]) {
  const capturedByWhite: PieceSymbol[] = [];
  const capturedByBlack: PieceSymbol[] = [];

  for (const m of history) {
    if (m.captured) {
      if (m.color === 'w') capturedByWhite.push(m.captured);
      else capturedByBlack.push(m.captured);
    }
  }

  const order: Record<PieceSymbol, number> = { q: 0, r: 1, b: 2, n: 3, p: 4, k: 5 };
  capturedByWhite.sort((a, b) => order[a] - order[b]);
  capturedByBlack.sort((a, b) => order[a] - order[b]);

  const whiteScore = capturedByWhite.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  const blackScore = capturedByBlack.reduce((sum, p) => sum + PIECE_VALUES[p], 0);

  // Remaining material HP % directly from live board
  let whiteMaterial = 0;
  let blackMaterial = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq || sq.type === 'k') continue;
      if (sq.color === 'w') whiteMaterial += PIECE_VALUES[sq.type];
      else blackMaterial += PIECE_VALUES[sq.type];
    }
  }

  const whiteHp = Math.min(100, Math.round((whiteMaterial / MAX_ARMY_POINTS) * 100));
  const blackHp = Math.min(100, Math.round((blackMaterial / MAX_ARMY_POINTS) * 100));

  // Energy bar fills naturally with moves & captures
  const whiteMoves = history.filter((m) => m.color === 'w').length;
  const blackMoves = history.filter((m) => m.color === 'b').length;
  const whiteEnergy = Math.min(100, 30 + whiteMoves * 12 + whiteScore * 5);
  const blackEnergy = Math.min(100, 30 + blackMoves * 12 + blackScore * 5);

  return {
    capturedByWhite,
    capturedByBlack,
    whiteScore,
    blackScore,
    whiteHp,
    blackHp,
    whiteEnergy,
    blackEnergy,
  };
}

function evaluateGameOutcome(chess: Chess, t: TranslationPack): GameOutcome | null {
  if (!chess.isGameOver()) return null;

  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === 'w' ? 'b' : 'w';
    return {
      winner,
      reason: 'checkmate',
      headline: t.checkmateHeadline,
      subline: t.checkmateSub(winner),
    };
  }
  if (chess.isStalemate()) {
    return {
      winner: 'draw',
      reason: 'stalemate',
      headline: t.stalemateHeadline,
      subline: t.stalemateSub,
    };
  }
  if (chess.isThreefoldRepetition()) {
    return {
      winner: 'draw',
      reason: 'threefold',
      headline: t.threefoldHeadline,
      subline: t.threefoldSub,
    };
  }
  if (chess.isInsufficientMaterial()) {
    return {
      winner: 'draw',
      reason: 'insufficient',
      headline: t.insufficientHeadline,
      subline: t.insufficientSub,
    };
  }
  return {
    winner: 'draw',
    reason: 'draw',
    headline: t.drawHeadline,
    subline: t.drawSub,
  };
}

export default function App() {
  const [lang, setLang] = useState<Language>(getInitialLanguage);
  const t = TRANSLATIONS[lang];

  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [muted, setMuted] = useState<boolean>(false);
  const [showRoster, setShowRoster] = useState<boolean>(false);

  // Core chess.js instance kept in ref, synced via FEN state
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [hintMove, setHintMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [manualFlipped, setManualFlipped] = useState<boolean>(false);
  const [boardView, setBoardView] = useState<BoardView>(() => {
    if (typeof window === 'undefined') return 'iso';
    return window.localStorage.getItem('meowgambit_view') === 'flat' ? 'flat' : 'iso';
  });
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  // Timers (in milliseconds, null if Unlimited)
  const [clocks, setClocks] = useState<{ w: number | null; b: number | null }>({
    w: 600_000,
    b: 600_000,
  });

  // Cinematic VFX & Emotes
  const [vfxEvent, setVfxEvent] = useState<SkillVfxEvent | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [lastSkillLog, setLastSkillLog] = useState<string>(
    () => TRANSLATIONS[getInitialLanguage()].readyLog
  );
  const [activeEmotes, setActiveEmotes] = useState<Partial<Record<Color, ActiveEmote>>>({});

  const vfxIdRef = useRef(0);
  const emoteIdRef = useRef(0);
  const vfxTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const botTimerRef = useRef<number | null>(null);
  const botWorkerRef = useRef<Worker | null>(null);
  const botReqIdRef = useRef<number>(0);

  const handleToggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Language = prev === 'id' ? 'en' : 'id';
      try {
        window.localStorage.setItem('meowgambit_lang', next);
      } catch {
        // ignore
      }
      if (chessRef.current.history().length === 0) {
        setLastSkillLog(TRANSLATIONS[next].startLog);
      }
      return next;
    });
    soundEngine.playSelect();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const chess = chessRef.current;
  const currentTurn = chess.turn();
  const isInCheck = chess.inCheck();

  const historyVerbose = useMemo(() => {
    void fen;
    return chess.history({ verbose: true });
  }, [chess, fen]);

  const moveRecords: MoveRecord[] = useMemo(
    () =>
      historyVerbose.map((m, idx) => ({
        san: m.san,
        color: m.color,
        from: m.from,
        to: m.to,
        piece: m.piece,
        captured: m.captured,
        moveNumber: Math.floor(idx / 2) + 1,
      })),
    [historyVerbose]
  );

  const armyStats = useMemo(() => {
    void fen;
    return computeArmyStats(chess, historyVerbose);
  }, [chess, fen, historyVerbose]);

  const legalMovesForSelected: Move[] = useMemo(() => {
    void fen;
    if (!selectedSquare) return [];
    return chess.moves({ square: selectedSquare, verbose: true });
  }, [chess, fen, selectedSquare]);

  const effectiveFlipped = useMemo(() => {
    if (config.mode === 'local' && config.autoFlipLocal) {
      return currentTurn === 'b';
    }
    return manualFlipped;
  }, [config.mode, config.autoFlipLocal, currentTurn, manualFlipped]);

  const clearPendingTimers = useCallback(() => {
    if (botTimerRef.current) {
      window.clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    if (vfxTimerRef.current) {
      window.clearTimeout(vfxTimerRef.current);
      vfxTimerRef.current = null;
    }
    if (shakeTimerRef.current) {
      window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
  }, []);

  const triggerEmoteForColor = useCallback(
    (color: Color, emote: EmoteKey) => {
      const id = ++emoteIdRef.current;
      soundEngine.playEmote(emote);
      setActiveEmotes((prev) => ({
        ...prev,
        [color]: {
          id,
          color,
          emote,
          text: t.emotes[emote].bubble,
          timestamp: Date.now(),
        },
      }));

      window.setTimeout(() => {
        setActiveEmotes((prev) => {
          if (prev[color]?.id !== id) return prev;
          const copy = { ...prev };
          delete copy[color];
          return copy;
        });
      }, 2150);
    },
    [t]
  );

  const startNewMatch = useCallback(
    (nextConfig: GameConfig = config) => {
      clearPendingTimers();
      const fresh = new Chess();
      chessRef.current = fresh;
      setFen(fresh.fen());
      setSelectedSquare(null);
      setLastMove(null);
      setHintMove(null);
      setPendingPromotion(null);
      setOutcome(null);
      setVfxEvent(null);
      setIsShaking(false);
      setIsBotThinking(false);
      setActiveEmotes({});
      setLastSkillLog(t.startLog);

      const baseSec = TIME_CONTROL_SECONDS[nextConfig.timeControl];
      const baseMs = baseSec !== null ? baseSec * 1000 : null;
      setClocks({ w: baseMs, b: baseMs });

      setManualFlipped(nextConfig.mode === 'bot' ? nextConfig.playerColor === 'b' : false);
      setScreen('game');
      soundEngine.playSelect();
    },
    [clearPendingTimers, config, t.startLog]
  );

  const executeMove = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
      const c = chessRef.current;
      const wasInCheckBefore = c.inCheck();

      let applied: Move | null = null;
      try {
        applied = c.move({ from, to, promotion });
      } catch {
        return false;
      }
      if (!applied) return false;

      setFen(c.fen());
      setSelectedSquare(null);
      setHintMove(null);
      setPendingPromotion(null);
      setLastMove({ from: applied.from, to: applied.to });

      const isCapture = Boolean(applied.captured) || applied.flags.includes('e');
      const isCastle = applied.flags.includes('k') || applied.flags.includes('q');
      const nowInCheck = c.inCheck();
      const nowCheckmate = c.isCheckmate();
      const isKingAction = applied.piece === 'k' && (wasInCheckBefore || isCastle || !isCapture);

      const meta = getPieceMeta(applied.color, applied.piece);
      const localizedPiece = t.pieces[`${applied.color}-${applied.piece}`];

      // Trigger 1.2s non-blocking SLASH! & Skill VFX on capture, check, checkmate, or King Roar/Bastion
      if (isCapture || nowInCheck || nowCheckmate || isKingAction) {
        const nextId = ++vfxIdRef.current;
        const shouldShake =
          nowCheckmate || (isCapture && meta.triggersShake) || (nowInCheck && applied.piece === 'q');

        const event: SkillVfxEvent = {
          id: nextId,
          pieceColor: applied.color,
          pieceType: applied.piece,
          from: applied.from,
          to: applied.to,
          isCapture,
          isCheck: nowInCheck,
          isCheckmate: nowCheckmate,
          isKingEscapeOrMove: isKingAction && !isCapture && !nowInCheck,
          skillName: localizedPiece.skillName,
          callout: localizedPiece.callout,
          checkLabel: t.vfxCheck,
          checkmateLabel: t.vfxCheckmate,
          bonkLabel: t.vfxBonk,
          accentColor: meta.accentColor,
          triggersShake: shouldShake,
          timestamp: Date.now(),
        };

        setVfxEvent(event);
        const suffix = nowCheckmate
          ? ` — ${t.vfxCheckmate}`
          : nowInCheck
            ? ` — ${t.checkBadge}`
            : '';
        setLastSkillLog(
          t.usedSkillLog(
            localizedPiece.name.toUpperCase(),
            localizedPiece.skillName.toUpperCase(),
            suffix
          )
        );

        if (vfxTimerRef.current) window.clearTimeout(vfxTimerRef.current);
        vfxTimerRef.current = window.setTimeout(() => {
          setVfxEvent((cur) => (cur?.id === nextId ? null : cur));
        }, 1250);

        if (shouldShake) {
          setIsShaking(true);
          if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
          shakeTimerRef.current = window.setTimeout(() => setIsShaking(false), 360);
        }
      } else {
        setLastSkillLog(`${localizedPiece.name.toUpperCase()} → ${applied.san}`);
      }

      // Procedural Audio Feedback
      const gameOutcome = evaluateGameOutcome(c, t);
      if (gameOutcome) {
        setOutcome(gameOutcome);
        if (
          gameOutcome.winner === 'draw' ||
          (config.mode === 'bot' && gameOutcome.winner !== config.playerColor)
        ) {
          soundEngine.playDefeat();
        } else {
          soundEngine.playVictory();
        }
      } else if (nowInCheck) {
        if (isCapture) soundEngine.playSkillCapture(applied.piece);
        window.setTimeout(() => soundEngine.playCheck(), isCapture ? 140 : 0);
      } else if (isCapture) {
        soundEngine.playSkillCapture(applied.piece);
      } else if (isCastle) {
        soundEngine.playCastle();
      } else if (isKingAction) {
        soundEngine.playKingAura();
      } else {
        soundEngine.playMove();
      }

      // Playful Bot Emote reaction on big plays
      if (
        config.mode === 'bot' &&
        applied.color !== config.playerColor &&
        !gameOutcome &&
        (nowInCheck || (isCapture && Math.random() < 0.45))
      ) {
        const botEmote: EmoteKey =
          applied.color === 'b'
            ? nowInCheck
              ? 'woof'
              : 'gg'
            : nowInCheck
              ? 'hiss'
              : 'meow';
        window.setTimeout(() => triggerEmoteForColor(applied!.color, botEmote), 260);
      }

      return true;
    },
    [config.mode, config.playerColor, t, triggerEmoteForColor]
  );

  // Active Match Countdown Timer (100ms precision)
  useEffect(() => {
    if (screen !== 'game' || outcome || pendingPromotion) return;
    if (config.timeControl === 'unlimited') return;

    const interval = window.setInterval(() => {
      const activeColor = chessRef.current.turn();
      setClocks((prev) => {
        const curMs = prev[activeColor];
        if (curMs === null) return prev;
        const nextMs = Math.max(0, curMs - 100);

        if (nextMs === 0) {
          const winner: Color = activeColor === 'w' ? 'b' : 'w';
          setOutcome({
            winner,
            reason: 'timeout',
            headline: t.timeoutHeadline,
            subline: t.timeoutSub(winner),
          });
          if (config.mode === 'bot' && winner !== config.playerColor) {
            soundEngine.playDefeat();
          } else {
            soundEngine.playVictory();
          }
        }

        return { ...prev, [activeColor]: nextMs };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [screen, outcome, pendingPromotion, config.timeControl, config.mode, config.playerColor, t]);

  // Bot AI Turn Driver (Web Worker)
  useEffect(() => {
    if (screen !== 'game' || config.mode !== 'bot' || outcome || pendingPromotion) return;
    const c = chessRef.current;
    if (c.turn() === config.playerColor || c.isGameOver()) return;

    setIsBotThinking(true);
    const reqId = ++botReqIdRef.current;
    const delay = config.difficulty === 'easy' ? 420 : config.difficulty === 'medium' ? 460 : 480;
    const currentFen = c.fen();

    botTimerRef.current = window.setTimeout(() => {
      try {
        if (!botWorkerRef.current) {
          botWorkerRef.current = new Worker(
            new URL('./engine/botWorker.ts', import.meta.url),
            { type: 'module' }
          );
        }
        const worker = botWorkerRef.current;
        worker.onmessage = (
          e: MessageEvent<{
            id: number;
            move: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | null;
          }>
        ) => {
          if (e.data.id !== botReqIdRef.current) return;
          setIsBotThinking(false);
          if (e.data.move) {
            executeMove(e.data.move.from, e.data.move.to, e.data.move.promotion);
          }
        };
        worker.postMessage({ id: reqId, fen: currentFen, difficulty: config.difficulty });
      } catch {
        const best = computeBotMove(currentFen, config.difficulty);
        if (reqId !== botReqIdRef.current) return;
        setIsBotThinking(false);
        if (best) {
          executeMove(
            best.from,
            best.to,
            best.promotion as 'q' | 'r' | 'b' | 'n' | undefined
          );
        }
      }
    }, delay);

    return () => {
      botReqIdRef.current += 1;
      if (botTimerRef.current) {
        window.clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
      setIsBotThinking(false);
    };
  }, [fen, screen, config.mode, config.playerColor, config.difficulty, outcome, pendingPromotion, executeMove]);

  useEffect(() => {
    return () => {
      botWorkerRef.current?.terminate();
      botWorkerRef.current = null;
    };
  }, []);

  const isPlayerInteractionBlocked =
    Boolean(outcome) ||
    Boolean(pendingPromotion) ||
    (config.mode === 'bot' && currentTurn !== config.playerColor);

  const handleSquareClick = useCallback(
    (sq: Square) => {
      if (isPlayerInteractionBlocked) return;
      const c = chessRef.current;

      if (selectedSquare) {
        if (selectedSquare === sq) {
          setSelectedSquare(null);
          return;
        }

        const matchingMoves = legalMovesForSelected.filter((m) => m.to === sq);
        if (matchingMoves.length > 0) {
          if (matchingMoves.some((m) => Boolean(m.promotion))) {
            setPendingPromotion({
              from: selectedSquare,
              to: sq,
              color: c.turn(),
            });
            soundEngine.playSelect();
            return;
          }
          executeMove(selectedSquare, sq);
          return;
        }
      }

      const clickedPiece = c.get(sq);
      if (clickedPiece && clickedPiece.color === c.turn()) {
        setSelectedSquare(sq);
        soundEngine.playSelect();
      } else {
        setSelectedSquare(null);
      }
    },
    [isPlayerInteractionBlocked, selectedSquare, legalMovesForSelected, executeMove]
  );

  const handleUndo = useCallback(() => {
    if (outcome) return;
    const c = chessRef.current;
    if (c.history().length === 0) return;

    if (botTimerRef.current) {
      window.clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
      setIsBotThinking(false);
    }

    if (config.mode === 'bot') {
      if (c.turn() === config.playerColor && c.history().length >= 2) {
        c.undo();
        c.undo();
      } else {
        c.undo();
      }
    } else {
      c.undo();
    }

    const hist = c.history({ verbose: true });
    const prevLast = hist[hist.length - 1];
    setFen(c.fen());
    setSelectedSquare(null);
    setHintMove(null);
    setPendingPromotion(null);
    setVfxEvent(null);
    setLastMove(prevLast ? { from: prevLast.from, to: prevLast.to } : null);
    setLastSkillLog(t.moveUndone);
    soundEngine.playSelect();
  }, [config.mode, config.playerColor, outcome, t.moveUndone]);

  const handleSurrender = useCallback(() => {
    if (outcome) return;
    const loser: Color = config.mode === 'bot' ? config.playerColor : currentTurn;
    const winner: Color = loser === 'w' ? 'b' : 'w';
    setOutcome({
      winner,
      reason: 'resign',
      headline: t.surrenderHeadline,
      subline: t.surrenderSub(winner),
    });
    soundEngine.playDefeat();
  }, [config.mode, config.playerColor, currentTurn, outcome, t]);

  // SKILL button triggers a tactical move hint highlight on the grass diorama!
  const handleTriggerSkillHint = useCallback(() => {
    if (isPlayerInteractionBlocked) return;
    const best = computeBotMove(chessRef.current.fen(), 'medium');
    if (!best) return;
    setHintMove({ from: best.from, to: best.to });
    setSelectedSquare(best.from);
    setLastSkillLog(t.skillHintReady(best.san));
    soundEngine.playKingAura();
  }, [isPlayerInteractionBlocked, t]);

  const handleToggleBoardView = useCallback(() => {
    setBoardView((prev) => {
      const next: BoardView = prev === 'iso' ? 'flat' : 'iso';
      try {
        window.localStorage.setItem('meowgambit_view', next);
      } catch {
        // ignore
      }
      return next;
    });
    soundEngine.playSelect();
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleEmoteClick = useCallback(
    (emote: EmoteKey) => {
      const targetColor: Color = config.mode === 'bot' ? config.playerColor : currentTurn;
      triggerEmoteForColor(targetColor, emote);
    },
    [config.mode, config.playerColor, currentTurn, triggerEmoteForColor]
  );

  // Active clock shown in center-top timer pill (like reference 08:45)
  const activeClockMs = clocks[currentTurn];
  const isClockLow = activeClockMs !== null && activeClockMs <= 20000;

  if (screen === 'menu') {
    return (
      <>
        <MainMenu
          config={config}
          muted={muted}
          lang={lang}
          t={t}
          onChangeConfig={setConfig}
          onStartGame={() => startNewMatch(config)}
          onOpenRoster={() => {
            soundEngine.playSelect();
            setShowRoster(true);
          }}
          onToggleMute={handleToggleMute}
          onToggleLang={handleToggleLang}
        />
        {showRoster && <RosterModal t={t} onClose={() => setShowRoster(false)} />}
      </>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#24442E] overflow-hidden relative">
      {/* === FULL-VIEWPORT AUTHENTIC /arena-bg.png + PIXEL-LOCKED 8x8 INTERACTIVE CHESS LAYER === */}
      <main className="absolute inset-0 z-10 w-full h-full">
        <ChessBoard
          chess={chess}
          fen={fen}
          flipped={effectiveFlipped}
          boardView={boardView}
          selectedSquare={selectedSquare}
          legalMoves={legalMovesForSelected}
          lastMove={lastMove}
          vfxEvent={vfxEvent}
          isShaking={isShaking}
          activeEmotes={activeEmotes}
          disabled={isPlayerInteractionBlocked}
          tapToAttackLabel={t.tapToAttack}
          hintMove={hintMove}
          capturedByWhite={armyStats.capturedByWhite}
          capturedByBlack={armyStats.capturedByBlack}
          onSquareClick={handleSquareClick}
        />
      </main>

      {/* === COMPACT FLOATING TOP HUD BAR (Clear of the /arena-bg.png board apex!) === */}
      <header className="absolute top-0 inset-x-0 z-20 w-full px-2.5 pt-2 sm:px-4 sm:pt-2.5 flex items-start justify-between gap-2 pointer-events-none">
        {/* Left: Player 1 (Cat Kingdom / White) */}
        <div className="pointer-events-auto">
          <PlayerHud
            color="w"
            align="left"
            label={t.catKingdom}
            sublabel={
              config.mode === 'bot'
                ? config.playerColor === 'w'
                  ? t.youLabel
                  : `${t.botPrefix} • ${t.difficultyLabels[config.difficulty].label}`
                : t.p1Label
            }
            isActive={!outcome && currentTurn === 'w'}
            isThinking={config.mode === 'bot' && config.playerColor !== 'w' && isBotThinking}
            isInCheck={!outcome && isInCheck && currentTurn === 'w'}
            hpPercent={armyStats.whiteHp}
            energyPercent={armyStats.whiteEnergy}
            score={armyStats.whiteScore}
            capturedPieces={armyStats.capturedByWhite}
            t={t}
          />
        </div>

        {/* Center: Ultra-Compact Single-Row Match Timer + Utility Strip so top board apex is never covered! */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 bg-[#1C2E24]/82 backdrop-blur-[2px] px-2 py-1 rounded-full border-2 border-[#132018] shadow-lg">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-colors ${
              isClockLow
                ? 'bg-[#C63527] text-white animate-pulse'
                : 'bg-[#121F18]/90 text-[#FFFDF5]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#FFE259] shrink-0" />
            <span className="font-display text-xs sm:text-sm tabular-nums tracking-wide leading-none">
              {formatClock(activeClockMs)}
            </span>
            <span
              className={`w-2 h-2 rounded-full border border-black/70 ${
                currentTurn === 'w' ? 'bg-[#6CC8FF]' : 'bg-[#EF6351]'
              }`}
              title={currentTurn === 'w' ? t.catKingdom : t.dogGuard}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleBoardView}
              className={`casual-btn px-2 py-0.5 text-[10px] font-display flex items-center gap-1 ${
                boardView === 'flat' ? 'casual-btn-green text-white' : 'casual-btn-amber'
              }`}
              title={t.viewToggleTitle}
              aria-label={t.viewToggleTitle}
            >
              {boardView === 'flat' ? (
                <>
                  <Grid2x2 className="w-3 h-3" />
                  <span className="cartoon-text-shadow-bold">{t.viewFlatLabel}</span>
                </>
              ) : (
                <>
                  <Box className="w-3 h-3" />
                  <span>{t.viewIsoLabel}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleToggleLang}
              className="casual-btn casual-btn-dark px-1.5 py-0.5 text-[10px] font-display flex items-center gap-0.5"
              title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <Globe className="w-3 h-3 text-[#78F0FF]" />
              {t.langLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                if (config.mode === 'local' && config.autoFlipLocal) {
                  setConfig((prev) => ({ ...prev, autoFlipLocal: false }));
                }
                setManualFlipped((f) => !f);
                soundEngine.playSelect();
              }}
              className="casual-btn casual-btn-dark p-1"
              title={t.flipBtn}
              aria-label={t.flipBtn}
            >
              <FlipVertical2 className="w-3.5 h-3.5 text-[#FFE259]" />
            </button>
            <button
              type="button"
              onClick={handleToggleMute}
              className="casual-btn casual-btn-dark p-1"
              title={muted ? 'Unmute' : 'Mute'}
              aria-label="Toggle Sound"
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#EF6351]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#86E34F]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => startNewMatch(config)}
              className="casual-btn casual-btn-dark p-1"
              title={t.resetBtn}
              aria-label={t.resetBtn}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FFFDF5]" />
            </button>
            <button
              type="button"
              onClick={() => {
                clearPendingTimers();
                setScreen('menu');
              }}
              className="casual-btn casual-btn-dark p-1"
              title={t.menuBtn}
              aria-label={t.menuBtn}
            >
              <Home className="w-3.5 h-3.5 text-[#FFE259]" />
            </button>
          </div>
        </div>

        {/* Right: Player 2 (Dog Guard / Black) */}
        <div className="pointer-events-auto">
          <PlayerHud
            color="b"
            align="right"
            label={t.dogGuard}
            sublabel={
              config.mode === 'bot'
                ? config.playerColor === 'b'
                  ? t.youLabel
                  : `${t.botPrefix} • ${t.difficultyLabels[config.difficulty].label}`
                : t.p2Label
            }
            isActive={!outcome && currentTurn === 'b'}
            isThinking={config.mode === 'bot' && config.playerColor !== 'b' && isBotThinking}
            isInCheck={!outcome && isInCheck && currentTurn === 'b'}
            hpPercent={armyStats.blackHp}
            energyPercent={armyStats.blackEnergy}
            score={armyStats.blackScore}
            capturedPieces={armyStats.capturedByBlack}
            t={t}
          />
        </div>
      </header>

      {/* === FLOATING BOTTOM BAR: Full-Width Skill Instruction Pill (Left) & Action Cluster (Right) === */}
      <footer className="absolute bottom-0 inset-x-0 z-20 w-full px-2.5 pb-2.5 sm:px-5 sm:pb-3.5 flex items-end justify-between gap-3 pointer-events-none">
        {/* Bottom-Left: Widened Skill Feed Pill (Full text, zero ellipsis truncation!) */}
        <div className="pointer-events-auto hidden md:flex flex-col gap-1.5 max-w-[460px]">
          <div className="casual-panel-dark px-3.5 py-2 flex items-center gap-2 text-[#FFF7D6]">
            <Sparkles className="w-4 h-4 text-[#FFE259] shrink-0" />
            <span className="font-display text-xs uppercase leading-snug">{lastSkillLog}</span>
          </div>
          {moveRecords.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap px-1">
              {moveRecords.slice(-6).map((rec, i) => (
                <span
                  key={`${rec.moveNumber}-${rec.color}-${i}`}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-display border border-black/40 ${
                    rec.captured
                      ? 'bg-[#FFE259] text-[#2F1D04]'
                      : rec.color === 'w'
                        ? 'bg-[#E5F2FF] text-[#1A3552]'
                        : 'bg-[#F5DFD8] text-[#4F1C18]'
                  }`}
                >
                  {rec.color === 'w' ? `${rec.moveNumber}.` : `${rec.moveNumber}...`} {rec.san}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Spacer on mobile so ActionCluster stays cleanly anchored bottom-right */}
        <div className="flex-1 md:hidden" />

        {/* Bottom-Right: Casual Game Action Cluster */}
        <div className="pointer-events-auto">
          <ActionCluster
            t={t}
            canUndo={moveRecords.length > 0}
            disabled={Boolean(outcome)}
            hasSkillReady={
              (currentTurn === 'w' ? armyStats.whiteEnergy : armyStats.blackEnergy) >= 60
            }
            onUndo={handleUndo}
            onSurrender={handleSurrender}
            onOpenCodex={() => {
              soundEngine.playSelect();
              setShowRoster(true);
            }}
            onTriggerSkillHint={handleTriggerSkillHint}
            onTriggerEmote={handleEmoteClick}
          />
        </div>
      </footer>

      {/* === CASUAL GAME MODALS === */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          t={t}
          onSelect={(piece) => executeMove(pendingPromotion.from, pendingPromotion.to, piece)}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {outcome && (
        <GameOverModal
          outcome={outcome}
          totalMoves={moveRecords.length}
          t={t}
          onRematch={() => startNewMatch(config)}
          onMainMenu={() => {
            clearPendingTimers();
            setScreen('menu');
          }}
        />
      )}

      {showRoster && <RosterModal t={t} onClose={() => setShowRoster(false)} />}
    </div>
  );
}
