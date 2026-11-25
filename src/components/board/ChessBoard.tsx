import React, { useEffect, useMemo, useState } from 'react';
import type { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import type { ActiveEmote, SkillVfxEvent } from '../../types/game';
import { AnimalPiece } from '../pieces/AnimalPiece';
import { SkillVfxCanvas } from '../vfx/SkillVfxCanvas';
import {
  boardGridCenter,
  boardTilePoints,
  getStageMetrics,
  squareToBoardPoint,
  type BoardView,
} from './isometric';

interface ChessBoardProps {
  chess: Chess;
  fen: string;
  flipped: boolean;
  boardView: BoardView;
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: { from: Square; to: Square } | null;
  vfxEvent: SkillVfxEvent | null;
  isShaking: boolean;
  activeEmotes: Partial<Record<Color, ActiveEmote>>;
  disabled: boolean;
  tapToAttackLabel: string;
  hintMove?: { from: Square; to: Square } | null;
  capturedByWhite: PieceSymbol[];
  capturedByBlack: PieceSymbol[];
  onSquareClick: (sq: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/** Helper to build a clean glowing arrow polygon along the board grass surface */
function buildSurfaceArrow(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return null;
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;

  const startOffset = 14;
  const endOffset = 12;
  const sx = from.x + ux * startOffset;
  const sy = from.y + uy * startOffset;
  const ex = to.x - ux * endOffset;
  const ey = to.y - uy * endOffset;

  const headLen = Math.min(20, dist * 0.34);
  const shaftW = 5.5;
  const headW = 13;

  const bx = ex - ux * headLen;
  const by = ey - uy * headLen;

  return [
    `${sx + px * shaftW},${sy + py * shaftW}`,
    `${bx + px * shaftW},${by + py * shaftW}`,
    `${bx + px * headW},${by + py * headW}`,
    `${ex},${ey}`,
    `${bx - px * headW},${by - py * headW}`,
    `${bx - px * shaftW},${by - py * shaftW}`,
    `${sx - px * shaftW},${sy - py * shaftW}`,
  ].join(' ');
}

/**
 * Unified Fixed-Aspect Arena Stage for BOTH 2.5D (/arena-bg.png) and RATA (/arena-bg-flat.png):
 * - Zero blur, zero manual CSS board — uses the authentic grass tiles of both PNG assets directly!
 * - Background image, 4-corner bilinear SVG <polygon> overlay, foot-anchored standing chibi
 *   pieces, captured benches, emotes, and Canvas VFX all live inside ONE exact aspect-locked
 *   stage container so (x%, y%) NEVER drifts at any screen size!
 */
export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  fen,
  flipped,
  boardView,
  selectedSquare,
  legalMoves,
  lastMove,
  vfxEvent,
  isShaking,
  activeEmotes,
  disabled,
  tapToAttackLabel,
  hintMove,
  capturedByWhite,
  capturedByBlack,
  onSquareClick,
}) => {
  const isFlat = boardView === 'flat';
  const stage = useMemo(() => getStageMetrics(boardView), [boardView]);

  const computeStageDims = (vw: number, vh: number, view: BoardView) => {
    const m = getStageMetrics(view);
    const ratio = m.nativeRatio;
    if (vw / vh >= 1.2) {
      // Full-bleed centered cover on desktop & landscape (zero black bars!)
      const w = Math.max(vw, vh * ratio);
      return { w, h: w / ratio };
    }
    // On mobile portrait, zoom the fixed-aspect stage so the grass chessboard fills ~94% screen width
    // (Iso board occupies ~52% of image width; Flat board occupies ~33% of image width)
    const targetZoomW = view === 'flat' ? vw * 2.72 : vw * 1.84;
    const w = Math.min(targetZoomW, vh * ratio);
    return { w, h: w / ratio };
  };

  const [stageDims, setStageDims] = useState<{ w: number; h: number }>(() => {
    if (typeof window === 'undefined') return { w: stage.w, h: stage.h };
    return computeStageDims(window.innerWidth, window.innerHeight, boardView);
  });

  useEffect(() => {
    const onResize = () => {
      setStageDims(computeStageDims(window.innerWidth, window.innerHeight, boardView));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [boardView]);

  const boardMatrix = useMemo(() => {
    void fen;
    return chess.board();
  }, [chess, fen]);

  const inCheck = chess.inCheck();
  const currentTurn = chess.turn();

  const legalTargetMap = useMemo(() => {
    const map = new Map<Square, { isCapture: boolean; move: Move }>();
    for (const m of legalMoves) {
      const isCapture = Boolean(m.captured) || m.flags.includes('e');
      map.set(m.to, { isCapture, move: m });
    }
    return map;
  }, [legalMoves]);

  // Painter's Algorithm Z-sorted standing chibi pieces
  const sortedPieces = useMemo(() => {
    const items: Array<{
      sq: Square;
      color: Color;
      type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
      vr: number;
      vc: number;
      x: number;
      y: number;
      xPct: number;
      yPct: number;
    }> = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardMatrix[r][c];
        if (!piece) continue;
        const sq = `${FILES[c]}${RANKS[r]}` as Square;
        const pos = squareToBoardPoint(sq, flipped, boardView);
        items.push({
          sq,
          color: piece.color,
          type: piece.type,
          ...pos,
        });
      }
    }

    if (isFlat) {
      items.sort((a, b) => a.vr - b.vr || a.vc - b.vc);
    } else {
      items.sort((a, b) => a.vr + a.vc - (b.vr + b.vc) || a.x - b.x);
    }
    return items;
  }, [boardMatrix, flipped, boardView, isFlat]);

  const checkedKingSquare = useMemo(() => {
    if (!inCheck) return undefined;
    const found = sortedPieces.find((p) => p.type === 'k' && p.color === currentTurn);
    return found?.sq;
  }, [inCheck, sortedPieces, currentTurn]);

  const firstCaptureTarget = useMemo(() => {
    for (const [sq, info] of legalTargetMap.entries()) {
      if (info.isCapture) return sq;
    }
    return null;
  }, [legalTargetMap]);

  const attackJumpInfo = useMemo(() => {
    if (!vfxEvent || (!vfxEvent.isCapture && !vfxEvent.isCheck)) return null;
    const f = squareToBoardPoint(vfxEvent.from, flipped, boardView);
    const t = squareToBoardPoint(vfxEvent.to, flipped, boardView);
    const scaleX = stageDims.w / stage.w;
    const scaleY = stageDims.h / stage.h;
    return {
      targetSq: vfxEvent.to,
      dx: (f.x - t.x) * scaleX,
      dy: (f.y - t.y) * scaleY,
      id: vfxEvent.id,
    };
  }, [vfxEvent, flipped, boardView, stageDims.w, stageDims.h, stage.w, stage.h]);

  const surfaceArrows = useMemo(() => {
    if (!selectedSquare) return [];
    const origin = squareToBoardPoint(selectedSquare, flipped, boardView);
    const arrows: Array<{ id: string; points: string; isCapture: boolean }> = [];

    const captures: Move[] = [];
    const quiets: Move[] = [];
    for (const m of legalMoves) {
      if (m.captured || m.flags.includes('e')) captures.push(m);
      else quiets.push(m);
    }

    for (const m of captures) {
      const target = squareToBoardPoint(m.to, flipped, boardView);
      const pts = buildSurfaceArrow(origin, target);
      if (pts) arrows.push({ id: `cap-${m.to}`, points: pts, isCapture: true });
    }

    for (const m of quiets.slice(0, 6)) {
      const target = squareToBoardPoint(m.to, flipped, boardView);
      const pts = buildSurfaceArrow(origin, target);
      if (pts) arrows.push({ id: `q-${m.to}`, points: pts, isCapture: false });
    }

    return arrows;
  }, [selectedSquare, legalMoves, flipped, boardView]);

  // Captured pieces sideline benches positioned neatly on the outer lawns of each PNG!
  const leftBenchCoords = useMemo(
    () =>
      capturedByWhite.slice(0, 12).map((pieceType, idx) => {
        if (isFlat) {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          return {
            pieceType,
            xPct: 26.8 - col * 4.4,
            yPct: 30 + row * 8.6,
            key: `capw-${idx}-${pieceType}`,
          };
        }
        const row = Math.floor(idx / 5);
        const col = idx % 5;
        return {
          pieceType,
          xPct: ((280 - row * 48 + col * 52) / stage.w) * 100,
          yPct: ((472 + row * 34 + col * 30) / stage.h) * 100,
          key: `capw-${idx}-${pieceType}`,
        };
      }),
    [capturedByWhite, isFlat, stage.w, stage.h]
  );

  const rightBenchCoords = useMemo(
    () =>
      capturedByBlack.slice(0, 12).map((pieceType, idx) => {
        if (isFlat) {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          return {
            pieceType,
            xPct: 73.2 + col * 4.4,
            yPct: 30 + row * 8.6,
            key: `capb-${idx}-${pieceType}`,
          };
        }
        const row = Math.floor(idx / 5);
        const col = idx % 5;
        return {
          pieceType,
          xPct: ((1175 + row * 48 - col * 52) / stage.w) * 100,
          yPct: ((472 + row * 34 + col * 30) / stage.h) * 100,
          key: `capb-${idx}-${pieceType}`,
        };
      }),
    [capturedByBlack, isFlat, stage.w, stage.h]
  );

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#23422D] select-none">
      {/* =================================================================
          SINGLE FIXED-ASPECT STAGE CONTAINER (Matches native image ratio!)
          Background PNG + 4-Corner Bilinear SVG <polygon> Grid +
          Foot-Anchored Chibi Pieces + Canvas VFX — ZERO DRIFT ON RESIZE!
         ================================================================= */}
      <div
        className={`relative shrink-0 ${isShaking ? 'animate-board-shake' : ''}`}
        style={{
          width: `${stageDims.w}px`,
          height: `${stageDims.h}px`,
        }}
      >
        {/* 1. Authentic Arena Artwork (/arena-bg.png or /arena-bg-flat.png — crisp, zero blur!) */}
        <img
          src={stage.imageUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none block"
        />

        {/* 2. Transparent 8x8 Bilinear SVG <polygon> Interactive Overlay */}
        <svg
          viewBox={`0 0 ${stage.w} ${stage.h}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full block z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow-yellow" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="5.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-blue" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="6.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="yellow-neon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF78A" />
              <stop offset="100%" stopColor="#FFD83B" />
            </linearGradient>
            <linearGradient id="blue-neon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7CF2FF" />
              <stop offset="100%" stopColor="#1EC8FF" />
            </linearGradient>
          </defs>

          <g>
            {Array.from({ length: 8 }, (_, vr) =>
              Array.from({ length: 8 }, (_, vc) => {
                const boardRow = flipped ? 7 - vr : vr;
                const boardCol = flipped ? 7 - vc : vc;
                const sq = `${FILES[boardCol]}${RANKS[boardRow]}` as Square;
                const points = boardTilePoints(vr, vc, boardView);
                const center = boardGridCenter(vr, vc, boardView);

                const isSelected = selectedSquare === sq;
                const legalInfo = legalTargetMap.get(sq);
                const isCheckedKing = checkedKingSquare === sq;
                const isLastFrom = lastMove?.from === sq;
                const isLastTo = lastMove?.to === sq;
                const isHintSquare = hintMove?.from === sq || hintMove?.to === sq;

                return (
                  <g
                    key={sq}
                    data-square={sq}
                    onClick={() => !disabled && onSquareClick(sq)}
                    className={disabled ? 'cursor-default' : 'cursor-pointer'}
                  >
                    {/* Transparent exact-fit bilinear polygon directly over PNG grass tile */}
                    <polygon
                      points={points}
                      fill="transparent"
                      className="hover:fill-white/15 transition-colors"
                    />

                    {/* Last Move Subtle Warm Highlight */}
                    {(isLastFrom || isLastTo) && !isSelected && !legalInfo && (
                      <polygon
                        points={points}
                        fill="rgba(255, 241, 130, 0.28)"
                        stroke="rgba(255, 236, 110, 0.85)"
                        strokeWidth="2.2"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Skill Hint Blue Glow */}
                    {isHintSquare && !isSelected && (
                      <polygon
                        points={points}
                        fill="rgba(116, 242, 255, 0.42)"
                        stroke="#38E8FF"
                        strokeWidth="3"
                        filter="url(#glow-blue)"
                        className="pointer-events-none animate-tile-glow"
                      />
                    )}

                    {/* Selected Tile: Glowing Neon Yellow Polygon */}
                    {isSelected && (
                      <polygon
                        points={points}
                        fill="url(#yellow-neon)"
                        fillOpacity="0.68"
                        stroke="#FFFCE0"
                        strokeWidth="3.2"
                        filter="url(#glow-yellow)"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Legal Quiet Move: Glowing Yellow Polygon + Center Dot */}
                    {legalInfo && !legalInfo.isCapture && (
                      <g className="pointer-events-none animate-tile-glow">
                        <polygon
                          points={points}
                          fill="url(#yellow-neon)"
                          fillOpacity="0.48"
                          stroke="#FFF48C"
                          strokeWidth="2.4"
                          filter="url(#glow-yellow)"
                        />
                        {isFlat ? (
                          <circle
                            cx={center.x}
                            cy={center.y}
                            r="9"
                            fill="#FFFCE6"
                            stroke="#D99B00"
                            strokeWidth="2"
                          />
                        ) : (
                          <ellipse
                            cx={center.x}
                            cy={center.y}
                            rx="11"
                            ry="6.5"
                            fill="#FFFCE6"
                            stroke="#D99B00"
                            strokeWidth="2"
                          />
                        )}
                      </g>
                    )}

                    {/* Legal Capture Target: Glowing Neon Blue Polygon + Ring */}
                    {legalInfo && legalInfo.isCapture && (
                      <g className="pointer-events-none animate-tile-glow">
                        <polygon
                          points={points}
                          fill="url(#blue-neon)"
                          fillOpacity="0.62"
                          stroke="#DDFBFF"
                          strokeWidth="3.2"
                          filter="url(#glow-blue)"
                        />
                        {isFlat ? (
                          <circle
                            cx={center.x}
                            cy={center.y}
                            r="20"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                            strokeDasharray="6 4"
                          />
                        ) : (
                          <ellipse
                            cx={center.x}
                            cy={center.y}
                            rx="23"
                            ry="13"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="2.6"
                            strokeDasharray="6 4"
                          />
                        )}
                      </g>
                    )}

                    {/* Checked King Alert */}
                    {isCheckedKing && (
                      <polygon
                        points={points}
                        fill="rgba(239, 68, 68, 0.65)"
                        stroke="#FFE066"
                        strokeWidth="3.2"
                        className="pointer-events-none animate-tile-glow"
                      />
                    )}

                    {/* Edge Rank & File Coordinates */}
                    {isFlat ? (
                      <>
                        {vc === 0 && (
                          <text
                            x={center.x - 24}
                            y={center.y - 14}
                            fontSize="11.5"
                            fontFamily="'Archivo Black', sans-serif"
                            fill="rgba(255, 252, 232, 0.92)"
                            stroke="#1E3520"
                            strokeWidth="2.4"
                            paintOrder="stroke"
                            className="pointer-events-none"
                          >
                            {RANKS[boardRow]}
                          </text>
                        )}
                        {vr === 7 && (
                          <text
                            x={center.x + 17}
                            y={center.y + 24}
                            fontSize="11.5"
                            fontFamily="'Archivo Black', sans-serif"
                            fill="rgba(255, 252, 232, 0.92)"
                            stroke="#1E3520"
                            strokeWidth="2.4"
                            paintOrder="stroke"
                            className="pointer-events-none"
                          >
                            {FILES[boardCol]}
                          </text>
                        )}
                      </>
                    ) : (
                      <>
                        {vr === 7 && (
                          <text
                            x={center.x - 16}
                            y={center.y + 18}
                            fontSize="12"
                            fontFamily="'Archivo Black', sans-serif"
                            fill="rgba(255, 252, 232, 0.9)"
                            stroke="#1E3520"
                            strokeWidth="2.6"
                            paintOrder="stroke"
                            className="pointer-events-none"
                          >
                            {FILES[boardCol]}
                          </text>
                        )}
                        {vc === 7 && (
                          <text
                            x={center.x + 12}
                            y={center.y + 18}
                            fontSize="12"
                            fontFamily="'Archivo Black', sans-serif"
                            fill="rgba(255, 252, 232, 0.9)"
                            stroke="#1E3520"
                            strokeWidth="2.6"
                            paintOrder="stroke"
                            className="pointer-events-none"
                          >
                            {RANKS[boardRow]}
                          </text>
                        )}
                      </>
                    )}
                  </g>
                );
              })
            )}
          </g>

          {/* Glowing Surface Direction Arrows */}
          {surfaceArrows.length > 0 && (
            <g className="pointer-events-none">
              {surfaceArrows.map((arr) => (
                <polygon
                  key={arr.id}
                  points={arr.points}
                  fill={arr.isCapture ? 'url(#blue-neon)' : 'url(#yellow-neon)'}
                  fillOpacity="0.9"
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                  filter={arr.isCapture ? 'url(#glow-blue)' : 'url(#glow-yellow)'}
                />
              ))}
            </g>
          )}

          {/* Floating "TAP UNTUK SERANG!" Speech Callout */}
          {firstCaptureTarget && !disabled && (
            (() => {
              const pt = squareToBoardPoint(firstCaptureTarget, flipped, boardView);
              const bx = Math.max(150, Math.min(stage.w - 150, pt.x));
              const by = Math.max(66, pt.y - 78);
              return (
                <g className="pointer-events-none animate-tile-glow">
                  <rect
                    x={bx - 80}
                    y={by - 21}
                    width="160"
                    height="32"
                    rx="16"
                    fill="#FFFDF5"
                    stroke="#1E1A16"
                    strokeWidth="2.8"
                  />
                  <polygon
                    points={`${bx - 7},${by + 10} ${bx + 7},${by + 10} ${bx},${by + 20}`}
                    fill="#FFFDF5"
                    stroke="#1E1A16"
                    strokeWidth="2.4"
                  />
                  <rect x={bx - 8} y={by + 6} width="16" height="6" fill="#FFFDF5" />
                  <text
                    x={bx}
                    y={by - 1}
                    textAnchor="middle"
                    fontSize="12"
                    fontFamily="'Archivo Black', sans-serif"
                    fill="#C4302B"
                  >
                    {tapToAttackLabel}
                  </text>
                </g>
              );
            })()
          )}
        </svg>

        {/* 3. FOOT-ANCHORED STANDING CHIBI PIECES AT EXACT TILE CENTERS (row + 0.5, col + 0.5) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {sortedPieces.map((p, idx) => {
            const isSelected = selectedSquare === p.sq;
            const isLastTo = lastMove?.to === p.sq;
            const isJumpingAttacker = attackJumpInfo?.targetSq === p.sq;
            const depthScale = isFlat ? 1 : 0.9 + ((p.vr + p.vc) / 14) * 0.16;
            const widthPct = ((isFlat ? 58 : 76) * depthScale * 100) / stage.w;
            const heightPct = ((isFlat ? 68 : 88) * depthScale * 100) / stage.h;
            const idleDelay = `${(((p.vr * 7 + p.vc * 3) % 9) * 0.24).toFixed(2)}s`;

            const animClass = isJumpingAttacker
              ? 'animate-attack-jump'
              : isSelected
                ? 'animate-piece-float'
                : isLastTo
                  ? 'animate-piece-hop'
                  : 'animate-piece-idle';

            const kingEmote = p.type === 'k' ? activeEmotes[p.color] : undefined;

            return (
              <div
                key={`${p.sq}-${p.color}-${p.type}-${isJumpingAttacker ? attackJumpInfo?.id : 0}`}
                className="absolute"
                style={{
                  left: `${p.xPct}%`,
                  top: `${p.yPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  transform: isFlat ? 'translate(-50%, -82%)' : 'translate(-50%, -85%)',
                  zIndex: idx + 1,
                }}
              >
                <div
                  className={`w-full h-full ${animClass}`}
                  style={
                    isJumpingAttacker && attackJumpInfo
                      ? ({
                          '--jump-dx': `${attackJumpInfo.dx}px`,
                          '--jump-dy': `${attackJumpInfo.dy}px`,
                        } as React.CSSProperties)
                      : !isSelected && !isLastTo
                        ? { animationDelay: idleDelay }
                        : undefined
                  }
                >
                  <AnimalPiece
                    color={p.color}
                    type={p.type}
                    showBadge={isSelected}
                    showShadow
                  />
                </div>

                {/* Comic Emote Speech Bubble floating above King */}
                {kingEmote && (
                  <div
                    key={kingEmote.id}
                    className="absolute left-1/2 -top-7 px-3 py-1 rounded-full bg-[#FFF9DB] border-2 border-[#1F1A17] shadow-md font-display text-xs text-[#241C14] whitespace-nowrap animate-emote-pop z-40"
                  >
                    {kingEmote.text}
                  </div>
                )}
              </div>
            );
          })}

          {/* Captured Enemy Pieces along Left & Right Outer Lawns */}
          {leftBenchCoords.map((item, idx) => (
            <div
              key={item.key}
              className="absolute"
              style={{
                left: `${item.xPct}%`,
                top: `${item.yPct}%`,
                width: `${((isFlat ? 48 : 52) / stage.w) * 100}%`,
                height: `${((isFlat ? 56 : 60) / stage.h) * 100}%`,
                transform: isFlat ? 'translate(-50%, -82%)' : 'translate(-50%, -85%)',
              }}
            >
              <div
                className="w-full h-full animate-piece-idle"
                style={{ animationDelay: `${(idx * 0.3).toFixed(2)}s` }}
              >
                <AnimalPiece color="b" type={item.pieceType} showBadge={false} showShadow />
              </div>
            </div>
          ))}

          {rightBenchCoords.map((item, idx) => (
            <div
              key={item.key}
              className="absolute"
              style={{
                left: `${item.xPct}%`,
                top: `${item.yPct}%`,
                width: `${((isFlat ? 48 : 52) / stage.w) * 100}%`,
                height: `${((isFlat ? 56 : 60) / stage.h) * 100}%`,
                transform: isFlat ? 'translate(-50%, -82%)' : 'translate(-50%, -85%)',
              }}
            >
              <div
                className="w-full h-full animate-piece-idle"
                style={{ animationDelay: `${(idx * 0.33).toFixed(2)}s` }}
              >
                <AnimalPiece color="w" type={item.pieceType} showBadge={false} showShadow />
              </div>
            </div>
          ))}
        </div>

        {/* 4. Pixel-Locked HTML5 Canvas 1.2s SLASH! Energy VFX Overlay */}
        <SkillVfxCanvas event={vfxEvent} flipped={flipped} boardView={boardView} />
      </div>
    </div>
  );
};
