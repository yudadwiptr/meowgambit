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
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {
  ActiveEmote,
  EmoteKey,
  GameConfig,
  GameOutcome,
  MoveRecord,
  OnlineConnectionStatus,
  OnlineMessage,
  OnlineRole,
  PendingPromotion,
  RematchState,
  SkillVfxEvent,
  TimeControl,
} from './types/game';
import {
  getInitialLanguage,
  TRANSLATIONS,
  type Language,
  type TranslationPack,
} from './i18n/translations';
import { getPieceMeta, PIECE_VALUES, TIME_CONTROL_SECONDS } from './data/roster';
import { computeBotMove } from './engine/chessAI';
import { MultiplayerManager, normalizeRoomCode } from './engine/multiplayer';
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

const MAX_ARMY_POINTS = 39;

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

  // Online Multiplayer (PeerJS P2P) State
  const mpRef = useRef<MultiplayerManager>(new MultiplayerManager());
  const [onlineTab, setOnlineTab] = useState<'create' | 'join'>('create');
  const [onlineRole, setOnlineRole] = useState<OnlineRole | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<OnlineConnectionStatus>('idle');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [onlineDisconnected, setOnlineDisconnected] = useState<boolean>(false);
  const [rematchState, setRematchState] = useState<RematchState>('none');

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

  const [clocks, setClocks] = useState<{ w: number | null; b: number | null }>({
    w: 600_000,
    b: 600_000,
  });
  const clocksRef = useRef(clocks);
  clocksRef.current = clocks;

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

  // Ref for latest config/t/callbacks inside PeerJS listeners (prevents stale closures)
  const configRef = useRef(config);
  configRef.current = config;
  const tRef = useRef(t);
  tRef.current = t;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const onlineRoleRef = useRef(onlineRole);
  onlineRoleRef.current = onlineRole;

  const myOnlineColor: Color = onlineRole === 'guest' ? 'b' : 'w';
  const isOnlineMatch = config.mode === 'online' && onlineRole !== null;

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

  const triggerEmoteForColor = useCallback((color: Color, emote: EmoteKey) => {
    const id = ++emoteIdRef.current;
    soundEngine.playEmote(emote);
    setActiveEmotes((prev) => ({
      ...prev,
      [color]: {
        id,
        color,
        emote,
        text: tRef.current.emotes[emote].bubble,
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
  }, []);

  const startNewMatch = useCallback(
    (nextConfig: GameConfig = config, forcedOnlineRole?: OnlineRole | null) => {
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
      setRematchState('none');
      setOnlineDisconnected(false);
      setLastSkillLog(tRef.current.startLog);

      const baseSec = TIME_CONTROL_SECONDS[nextConfig.timeControl];
      const baseMs = baseSec !== null ? baseSec * 1000 : null;
      setClocks({ w: baseMs, b: baseMs });

      const activeRole = forcedOnlineRole !== undefined ? forcedOnlineRole : onlineRoleRef.current;
      if (nextConfig.mode === 'online') {
        // Host = Cat Kingdom (White, bottom), Guest = Dog Guard (Black, flipped to bottom!)
        setManualFlipped(activeRole === 'guest');
      } else if (nextConfig.mode === 'bot') {
        setManualFlipped(nextConfig.playerColor === 'b');
      } else {
        setManualFlipped(false);
      }

      setScreen('game');
      soundEngine.playSelect();
    },
    [clearPendingTimers, config]
  );

  const executeMove = useCallback(
    (
      from: Square,
      to: Square,
      promotion?: 'q' | 'r' | 'b' | 'n',
      opts?: { isRemote?: boolean; expectedFen?: string; syncedClocks?: { w: number | null; b: number | null } }
    ) => {
      const c = chessRef.current;
      const wasInCheckBefore = c.inCheck();

      let applied: Move | null = null;
      try {
        applied = c.move({ from, to, promotion });
      } catch {
        // Fallback FEN sync if remote move desynced
        if (opts?.isRemote && opts.expectedFen) {
          c.load(opts.expectedFen);
          setFen(c.fen());
          return true;
        }
        return false;
      }
      if (!applied) return false;

      if (opts?.isRemote && opts.expectedFen && c.fen() !== opts.expectedFen) {
        c.load(opts.expectedFen);
      }
      if (opts?.isRemote && opts.syncedClocks) {
        setClocks(opts.syncedClocks);
      }

      const newFen = c.fen();
      setFen(newFen);
      setSelectedSquare(null);
      setHintMove(null);
      setPendingPromotion(null);
      setLastMove({ from: applied.from, to: applied.to });

      // Broadcast local move to opponent in Online Mabar mode
      if (configRef.current.mode === 'online' && !opts?.isRemote) {
        mpRef.current.send({
          type: 'move',
          from: applied.from,
          to: applied.to,
          promotion: applied.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
          fen: newFen,
          clocks: clocksRef.current,
        });
      }

      const isCapture = Boolean(applied.captured) || applied.flags.includes('e');
      const isCastle = applied.flags.includes('k') || applied.flags.includes('q');
      const nowInCheck = c.inCheck();
      const nowCheckmate = c.isCheckmate();
      const isKingAction = applied.piece === 'k' && (wasInCheckBefore || isCastle || !isCapture);

      const curT = tRef.current;
      const meta = getPieceMeta(applied.color, applied.piece);
      const localizedPiece = curT.pieces[`${applied.color}-${applied.piece}`];

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
          checkLabel: curT.vfxCheck,
          checkmateLabel: curT.vfxCheckmate,
          bonkLabel: curT.vfxBonk,
          accentColor: meta.accentColor,
          triggersShake: shouldShake,
          timestamp: Date.now(),
        };

        setVfxEvent(event);
        const suffix = nowCheckmate
          ? ` — ${curT.vfxCheckmate}`
          : nowInCheck
            ? ` — ${curT.checkBadge}`
            : '';
        setLastSkillLog(
          curT.usedSkillLog(
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
      const gameOutcome = evaluateGameOutcome(c, curT);
      if (gameOutcome) {
        setOutcome(gameOutcome);
        const myColor: Color | null =
          configRef.current.mode === 'bot'
            ? configRef.current.playerColor
            : configRef.current.mode === 'online'
              ? onlineRoleRef.current === 'guest'
                ? 'b'
                : 'w'
              : null;
        if (gameOutcome.winner === 'draw' || (myColor && gameOutcome.winner !== myColor)) {
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
        configRef.current.mode === 'bot' &&
        applied.color !== configRef.current.playerColor &&
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
    [triggerEmoteForColor]
  );

  // Incoming PeerJS message handler (kept always fresh via ref)
  const handleOnlineMessage = useCallback(
    (msg: OnlineMessage) => {
      const curT = tRef.current;
      if (msg.type === 'hello') {
        // Host receives Guest hello -> send agreed timeControl and launch arena!
        const nextCfg: GameConfig = { ...configRef.current, mode: 'online' };
        setConfig(nextCfg);
        mpRef.current.send({ type: 'start', timeControl: nextCfg.timeControl });
        setOnlineStatus('connected');
        startNewMatch(nextCfg, 'host');
      } else if (msg.type === 'start') {
        // Guest receives start packet with Host's timeControl -> launch arena flipped to Black!
        const nextCfg: GameConfig = {
          ...configRef.current,
          mode: 'online',
          timeControl: msg.timeControl as TimeControl,
        };
        setConfig(nextCfg);
        setOnlineStatus('connected');
        startNewMatch(nextCfg, 'guest');
      } else if (msg.type === 'move') {
        executeMove(msg.from, msg.to, msg.promotion, {
          isRemote: true,
          expectedFen: msg.fen,
          syncedClocks: msg.clocks,
        });
      } else if (msg.type === 'emote') {
        triggerEmoteForColor(msg.color, msg.emote);
      } else if (msg.type === 'surrender') {
        const winner: Color = msg.loserColor === 'w' ? 'b' : 'w';
        setOutcome({
          winner,
          reason: 'resign',
          headline: curT.surrenderHeadline,
          subline: curT.surrenderSub(winner),
        });
        soundEngine.playVictory();
      } else if (msg.type === 'timeout') {
        const winner: Color = msg.loserColor === 'w' ? 'b' : 'w';
        setOutcome({
          winner,
          reason: 'timeout',
          headline: curT.timeoutHeadline,
          subline: curT.timeoutSub(winner),
        });
        const myColor: Color = onlineRoleRef.current === 'guest' ? 'b' : 'w';
        if (winner === myColor) soundEngine.playVictory();
        else soundEngine.playDefeat();
      } else if (msg.type === 'rematch_offer') {
        setRematchState('offered_by_opponent');
        soundEngine.playSelect();
      } else if (msg.type === 'rematch_accept') {
        startNewMatch({ ...configRef.current, mode: 'online' }, onlineRoleRef.current);
      }
    },
    [executeMove, startNewMatch, triggerEmoteForColor]
  );

  const handleOnlineMessageRef = useRef(handleOnlineMessage);
  handleOnlineMessageRef.current = handleOnlineMessage;

  const cleanupOnline = useCallback(() => {
    mpRef.current.destroy();
    setOnlineStatus('idle');
    setOnlineRole(null);
    setRoomCode('');
    setOnlineError(null);
    setOnlineDisconnected(false);
    setRematchState('none');
  }, []);

  const handleCreateOnlineRoom = useCallback(() => {
    setOnlineError(null);
    setOnlineDisconnected(false);
    setOnlineRole('host');
    setOnlineStatus('creating');
    setRoomCode('');

    mpRef.current.createRoom({
      onRoomReady: (code) => {
        setRoomCode(code);
        setOnlineStatus('waiting');
      },
      onConnected: () => {
        setOnlineStatus('connected');
      },
      onMessage: (msg) => handleOnlineMessageRef.current(msg),
      onDisconnect: () => {
        setOnlineStatus('disconnected');
        if (screenRef.current === 'game') {
          setOnlineDisconnected(true);
          soundEngine.playDefeat();
        }
      },
      onError: (code) => {
        setOnlineStatus('error');
        const curT = tRef.current;
        setOnlineError(
          code === 'not-found'
            ? curT.onlineErrorNotFound
            : code === 'timeout'
              ? curT.onlineErrorTimeout
              : curT.onlineErrorNetwork
        );
      },
    });
  }, []);

  const handleJoinOnlineRoom = useCallback((rawCode: string) => {
    const clean = normalizeRoomCode(rawCode);
    setJoinCode(clean);
    if (clean.length < 4) {
      setOnlineError(tRef.current.onlineErrorNotFound);
      return;
    }

    setOnlineError(null);
    setOnlineDisconnected(false);
    setOnlineRole('guest');
    setRoomCode(clean);
    setOnlineStatus('joining');

    mpRef.current.joinRoom(clean, {
      onConnected: () => {
        setOnlineStatus('connected');
        mpRef.current.send({ type: 'hello' });
      },
      onMessage: (msg) => handleOnlineMessageRef.current(msg),
      onDisconnect: () => {
        setOnlineStatus('disconnected');
        if (screenRef.current === 'game') {
          setOnlineDisconnected(true);
          soundEngine.playDefeat();
        }
      },
      onError: (code) => {
        setOnlineStatus('error');
        const curT = tRef.current;
        setOnlineError(
          code === 'not-found'
            ? curT.onlineErrorNotFound
            : code === 'timeout'
              ? curT.onlineErrorTimeout
              : curT.onlineErrorNetwork
        );
      },
    });
  }, []);

  // Auto-detect ?room=CODE invite URL on initial load!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const invited = params.get('room');
    if (invited) {
      const clean = normalizeRoomCode(invited);
      if (clean.length >= 4) {
        setConfig((prev) => ({ ...prev, mode: 'online' }));
        setOnlineTab('join');
        setJoinCode(clean);
        handleJoinOnlineRoom(clean);
      }
    }
  }, [handleJoinOnlineRoom]);

  // Auto-create room when entering Online -> Create Room tab in Main Menu
  useEffect(() => {
    if (screen !== 'menu') return;
    if (config.mode !== 'online') {
      if (onlineStatus !== 'idle') {
        cleanupOnline();
      }
      return;
    }
    if (onlineTab === 'create' && onlineStatus === 'idle') {
      handleCreateOnlineRoom();
    }
  }, [screen, config.mode, onlineTab, onlineStatus, cleanupOnline, handleCreateOnlineRoom]);

  // Cleanup WebRTC Peer on unmount
  useEffect(() => {
    return () => {
      mpRef.current.destroy();
    };
  }, []);

  const handleChangeOnlineTab = useCallback(
    (tab: 'create' | 'join') => {
      if (tab === onlineTab) return;
      soundEngine.playSelect();
      cleanupOnline();
      setOnlineTab(tab);
      if (tab === 'create') {
        handleCreateOnlineRoom();
      }
    },
    [onlineTab, cleanupOnline, handleCreateOnlineRoom]
  );

  // Active Match Countdown Timer (100ms precision)
  useEffect(() => {
    if (screen !== 'game' || outcome || pendingPromotion || onlineDisconnected) return;
    if (config.timeControl === 'unlimited') return;

    const interval = window.setInterval(() => {
      const activeColor = chessRef.current.turn();
      setClocks((prev) => {
        const curMs = prev[activeColor];
        if (curMs === null) return prev;
        const nextMs = Math.max(0, curMs - 100);

        if (nextMs === 0) {
          const winner: Color = activeColor === 'w' ? 'b' : 'w';
          const curT = tRef.current;
          setOutcome({
            winner,
            reason: 'timeout',
            headline: curT.timeoutHeadline,
            subline: curT.timeoutSub(winner),
          });
          if (configRef.current.mode === 'online') {
            mpRef.current.send({ type: 'timeout', loserColor: activeColor });
          }
          const myColor: Color | null =
            configRef.current.mode === 'bot'
              ? configRef.current.playerColor
              : configRef.current.mode === 'online'
                ? onlineRoleRef.current === 'guest'
                  ? 'b'
                  : 'w'
                : null;
          if (myColor && winner !== myColor) {
            soundEngine.playDefeat();
          } else {
            soundEngine.playVictory();
          }
        }

        return { ...prev, [activeColor]: nextMs };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [screen, outcome, pendingPromotion, onlineDisconnected, config.timeControl]);

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

  const isWaitingForOnlineOpponent = isOnlineMatch && currentTurn !== myOnlineColor;

  const isPlayerInteractionBlocked =
    Boolean(outcome) ||
    Boolean(pendingPromotion) ||
    onlineDisconnected ||
    (config.mode === 'bot' && currentTurn !== config.playerColor) ||
    isWaitingForOnlineOpponent;

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
    if (outcome || config.mode === 'online') return;
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
    const loser: Color =
      config.mode === 'online'
        ? myOnlineColor
        : config.mode === 'bot'
          ? config.playerColor
          : currentTurn;
    const winner: Color = loser === 'w' ? 'b' : 'w';

    if (config.mode === 'online') {
      mpRef.current.send({ type: 'surrender', loserColor: loser });
    }

    setOutcome({
      winner,
      reason: 'resign',
      headline: t.surrenderHeadline,
      subline: t.surrenderSub(winner),
    });
    soundEngine.playDefeat();
  }, [config.mode, config.playerColor, currentTurn, myOnlineColor, outcome, t]);

  const handleRematch = useCallback(() => {
    if (!isOnlineMatch) {
      startNewMatch(config);
      return;
    }
    if (onlineDisconnected) return;

    if (rematchState === 'offered_by_opponent') {
      mpRef.current.send({ type: 'rematch_accept' });
      startNewMatch(config, onlineRole);
    } else if (rematchState === 'none') {
      mpRef.current.send({ type: 'rematch_offer' });
      setRematchState('offered_by_me');
      soundEngine.playSelect();
    }
  }, [isOnlineMatch, onlineDisconnected, rematchState, config, onlineRole, startNewMatch]);

  const handleBackToMenu = useCallback(() => {
    clearPendingTimers();
    if (config.mode === 'online') {
      cleanupOnline();
      if (typeof window !== 'undefined' && window.location.search.includes('room=')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    setScreen('menu');
  }, [clearPendingTimers, config.mode, cleanupOnline]);

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
      const targetColor: Color =
        config.mode === 'online'
          ? myOnlineColor
          : config.mode === 'bot'
            ? config.playerColor
            : currentTurn;
      triggerEmoteForColor(targetColor, emote);
      if (config.mode === 'online') {
        mpRef.current.send({ type: 'emote', emote, color: targetColor });
      }
    },
    [config.mode, config.playerColor, currentTurn, myOnlineColor, triggerEmoteForColor]
  );

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
          onlineTab={onlineTab}
          onlineStatus={onlineStatus}
          roomCode={roomCode}
          joinCode={joinCode}
          onlineError={onlineError}
          onChangeOnlineTab={handleChangeOnlineTab}
          onChangeJoinCode={(code) => {
            setOnlineError(null);
            setJoinCode(code);
          }}
          onCreateRoom={handleCreateOnlineRoom}
          onJoinRoom={handleJoinOnlineRoom}
          onCancelOnline={cleanupOnline}
          onChangeConfig={(next) => {
            if (next.mode !== config.mode) {
              soundEngine.playSelect();
            }
            setConfig(next);
          }}
          onStartGame={() => startNewMatch(config, null)}
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

      {/* === COMPACT FLOATING TOP HUD BAR === */}
      <header className="absolute top-0 inset-x-0 z-20 w-full px-2.5 pt-2 sm:px-4 sm:pt-2.5 flex items-start justify-between gap-2 pointer-events-none">
        {/* Left: Player 1 (Cat Kingdom / White) */}
        <div className="pointer-events-auto">
          <PlayerHud
            color="w"
            align="left"
            label={t.catKingdom}
            sublabel={
              isOnlineMatch
                ? myOnlineColor === 'w'
                  ? t.youLabel
                  : t.opponentLabel
                : config.mode === 'bot'
                  ? config.playerColor === 'w'
                    ? t.youLabel
                    : `${t.botPrefix} • ${t.difficultyLabels[config.difficulty].label}`
                  : t.p1Label
            }
            isActive={!outcome && currentTurn === 'w'}
            isThinking={
              (config.mode === 'bot' && config.playerColor !== 'w' && isBotThinking) ||
              (isOnlineMatch && myOnlineColor !== 'w' && currentTurn === 'w' && !outcome)
            }
            isInCheck={!outcome && isInCheck && currentTurn === 'w'}
            hpPercent={armyStats.whiteHp}
            energyPercent={armyStats.whiteEnergy}
            score={armyStats.whiteScore}
            capturedPieces={armyStats.capturedByWhite}
            t={t}
          />
        </div>

        {/* Center: Compact Single-Row Match Timer + Utility Strip */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-[#1C2E24]/85 backdrop-blur-[2px] px-2 py-1 rounded-full border-2 border-[#132018] shadow-lg">
            {isOnlineMatch && roomCode && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2488D8] text-white font-display text-[10px] tracking-wider">
                <Wifi className="w-3 h-3" />
                {roomCode}
              </span>
            )}

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
              {!isOnlineMatch && (
                <button
                  type="button"
                  onClick={() => startNewMatch(config)}
                  className="casual-btn casual-btn-dark p-1"
                  title={t.resetBtn}
                  aria-label={t.resetBtn}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#FFFDF5]" />
                </button>
              )}
              <button
                type="button"
                onClick={handleBackToMenu}
                className="casual-btn casual-btn-dark p-1"
                title={t.menuBtn}
                aria-label={t.menuBtn}
              >
                <Home className="w-3.5 h-3.5 text-[#FFE259]" />
              </button>
            </div>
          </div>

          {/* Online Turn Status Pill ("GILIRAN LAWAN..." / "GILIRANMU!") */}
          {isOnlineMatch && !outcome && !onlineDisconnected && (
            <div
              className={`px-3 py-0.5 rounded-full border border-black/70 font-display text-[10px] uppercase shadow-md ${
                isWaitingForOnlineOpponent
                  ? 'bg-[#FFE259] text-[#3A2204]'
                  : 'bg-[#44AD26] text-white cartoon-text-shadow'
              }`}
            >
              {isWaitingForOnlineOpponent ? t.opponentTurnBadge : t.yourTurnBadge}
            </div>
          )}
        </div>

        {/* Right: Player 2 (Dog Guard / Black) */}
        <div className="pointer-events-auto">
          <PlayerHud
            color="b"
            align="right"
            label={t.dogGuard}
            sublabel={
              isOnlineMatch
                ? myOnlineColor === 'b'
                  ? t.youLabel
                  : t.opponentLabel
                : config.mode === 'bot'
                  ? config.playerColor === 'b'
                    ? t.youLabel
                    : `${t.botPrefix} • ${t.difficultyLabels[config.difficulty].label}`
                  : t.p2Label
            }
            isActive={!outcome && currentTurn === 'b'}
            isThinking={
              (config.mode === 'bot' && config.playerColor !== 'b' && isBotThinking) ||
              (isOnlineMatch && myOnlineColor !== 'b' && currentTurn === 'b' && !outcome)
            }
            isInCheck={!outcome && isInCheck && currentTurn === 'b'}
            hpPercent={armyStats.blackHp}
            energyPercent={armyStats.blackEnergy}
            score={armyStats.blackScore}
            capturedPieces={armyStats.capturedByBlack}
            t={t}
          />
        </div>
      </header>

      {/* === FLOATING BOTTOM BAR === */}
      <footer className="absolute bottom-0 inset-x-0 z-20 w-full px-2.5 pb-2.5 sm:px-5 sm:pb-3.5 flex items-end justify-between gap-3 pointer-events-none">
        {/* Bottom-Left: Widened Skill Feed Pill */}
        <div className="pointer-events-auto hidden md:flex flex-col gap-1.5 max-w-[460px]">
          <div className="casual-panel-dark px-3.5 py-2 flex items-center gap-2 text-[#FFF7D6]">
            <Sparkles className="w-4 h-4 text-[#FFE259] shrink-0" />
            <span className="font-display text-xs uppercase leading-snug">
              {isWaitingForOnlineOpponent && !outcome ? t.opponentTurnBadge : lastSkillLog}
            </span>
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

        <div className="flex-1 md:hidden" />

        {/* Bottom-Right: Casual Game Action Cluster */}
        <div className="pointer-events-auto">
          <ActionCluster
            t={t}
            canUndo={moveRecords.length > 0 && !isOnlineMatch}
            hideUndo={isOnlineMatch}
            disabled={Boolean(outcome) || onlineDisconnected}
            hasSkillReady={
              !isWaitingForOnlineOpponent &&
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

      {/* === ONLINE DISCONNECT OVERLAY (If opponent drops mid-match) === */}
      {isOnlineMatch && onlineDisconnected && !outcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="casual-panel w-full max-w-sm p-5 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#C63527] border-2 border-[#3B1410] flex items-center justify-center text-white shadow-lg">
              <WifiOff className="w-7 h-7" />
            </div>
            <h2 className="font-display text-xl uppercase text-[#2F2217]">
              {t.opponentDisconnectedTitle}
            </h2>
            <p className="text-xs font-bold text-[#6B543E]">{t.opponentDisconnectedDesc}</p>
            <button
              type="button"
              onClick={handleBackToMenu}
              className="casual-btn casual-btn-amber w-full py-2.5 font-display text-sm uppercase flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              {t.menuBtn}
            </button>
          </div>
        </div>
      )}

      {/* === MODALS === */}
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
          isOnline={isOnlineMatch}
          onlineDisconnected={onlineDisconnected}
          rematchState={rematchState}
          onRematch={handleRematch}
          onMainMenu={handleBackToMenu}
        />
      )}

      {showRoster && <RosterModal t={t} onClose={() => setShowRoster(false)} />}
    </div>
  );
}
