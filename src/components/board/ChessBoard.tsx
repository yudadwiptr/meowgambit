import React, { useEffect, useMemo, useState } from 'react';
import type { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import type { ActiveEmote, SkillVfxEvent } from '../../types/game';
import { AnimalPiece } from '../pieces/AnimalPiece';
import { SkillVfxCanvas } from '../vfx/SkillVfxCanvas';
import {
  ARENA_H,
  ARENA_W,
  FLAT_ORIGIN_X,
  FLAT_ORIGIN_Y,
  FLAT_TILE,
  flatGridCenter,
  isoGridCenter,
  isoTilePoints,
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

  const startOffset = 15;
  const endOffset = 13;
  const sx = from.x + ux * startOffset;
  const sy = from.y + uy * startOffset;
  const ex = to.x - ux * endOffset;
  const ey = to.y - uy * endOffset;

  const headLen = Math.min(22, dist * 0.34);
  const shaftW = 6;
  const headW = 14;

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
 * Full-Viewport Arena Board locked pixel-perfectly onto public/arena-bg.png!
 * - In 'iso' mode: hides the old manual SVG board & overlays transparent 8x8 interactive
 *   polygons directly on top of the 8x8 grass tiles of /arena-bg.png using identical
 *   cover/slice projection math so pieces, glows, arrows, and VFX never drift.
 * - In 'flat' mode: keeps /arena-bg.png softly blurred behind a crisp straight 8x8 grass board.
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

  // Use xMidYMid slice (exact `background-size: cover`) on desktop/landscape,
  // and gracefully switch to xMidYMid meet on very narrow mobile portrait so all 8x8 tiles stay tappable!
  const [isNarrowPortrait, setIsNarrowPortrait] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth / window.innerHeight < 1.15 : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsNarrowPortrait(window.innerWidth / window.innerHeight < 1.15);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const svgPreserveAspect = !isFlat && !isNarrowPortrait ? 'xMidYMid slice' : 'xMidYMid meet';

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
          vr: pos.vr,
          vc: pos.vc,
          x: pos.x,
          y: pos.y,
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
    return {
      targetSq: vfxEvent.to,
      dx: f.x - t.x,
      dy: f.y - t.y,
      id: vfxEvent.id,
    };
  }, [vfxEvent, flipped, boardView]);

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

  const flatW = FLAT_TILE * 8;
  const flatH = FLAT_TILE * 8;

  // Captured pieces sideline benches sitting neatly on the outer grass lawns of arena-bg.png!
  const leftBenchCoords = useMemo(
    () =>
      capturedByWhite.slice(0, 12).map((pieceType, idx) => {
        if (isFlat) {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          return {
            pieceType,
            x: FLAT_ORIGIN_X - 66 - col * 52,
            y: FLAT_ORIGIN_Y + 95 + row * 72,
            key: `capw-${idx}-${pieceType}`,
          };
        }
        // Left outer lawn along the stone cliff of arena-bg.png
        const row = Math.floor(idx / 5);
        const col = idx % 5;
        return {
          pieceType,
          x: 280 - row * 48 + col * 52,
          y: 472 + row * 34 + col * 30,
          key: `capw-${idx}-${pieceType}`,
        };
      }),
    [capturedByWhite, isFlat]
  );

  const rightBenchCoords = useMemo(
    () =>
      capturedByBlack.slice(0, 12).map((pieceType, idx) => {
        if (isFlat) {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          return {
            pieceType,
            x: FLAT_ORIGIN_X + flatW + 66 + col * 52,
            y: FLAT_ORIGIN_Y + 95 + row * 72,
            key: `capb-${idx}-${pieceType}`,
          };
        }
        // Right outer lawn along the stone cliff of arena-bg.png
        const row = Math.floor(idx / 5);
        const col = idx % 5;
        return {
          pieceType,
          x: 1175 + row * 48 - col * 52,
          y: 472 + row * 34 + col * 30,
          key: `capb-${idx}-${pieceType}`,
        };
      }),
    [capturedByBlack, isFlat, flatW]
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${
        isShaking ? 'animate-board-shake' : ''
      }`}
      style={{
        backgroundImage: "url('/arena-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* In Flat mode, apply a soft dim/blur backdrop over arena-bg.png so straight board pops cleanly */}
      {isFlat && (
        <div className="absolute inset-0 bg-[#183022]/55 backdrop-blur-[3px] pointer-events-none" />
      )}

      <svg
        viewBox={`0 0 ${ARENA_W} ${ARENA_H}`}
        preserveAspectRatio={svgPreserveAspect}
        className="absolute inset-0 w-full h-full block"
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
          <linearGradient id="tile-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9FE866" />
            <stop offset="100%" stopColor="#82CE4F" />
          </linearGradient>
          <linearGradient id="tile-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5AAE5D" />
            <stop offset="100%" stopColor="#468F4A" />
          </linearGradient>
          <linearGradient id="yellow-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF78A" />
            <stop offset="100%" stopColor="#FFD83B" />
          </linearGradient>
          <linearGradient id="blue-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7CF2FF" />
            <stop offset="100%" stopColor="#1EC8FF" />
          </linearGradient>
        </defs>

        {/* === ISO MODE: Authentic /arena-bg.png rendered inside the exact same SVG coordinate space === */}
        {!isFlat && (
          <image
            href="/arena-bg.png"
            x="0"
            y="0"
            width={ARENA_W}
            height={ARENA_H}
            preserveAspectRatio="none"
          />
        )}

        {/* ================================================================
            BRANCH A: STRAIGHT / FLAT 2D BOARD (OPTIONAL ACCESSIBILITY TOGGLE)
           ================================================================ */}
        {isFlat ? (
          <g>
            {/* Warm Wood/Stone Frame around Straight Board */}
            <rect
              x={FLAT_ORIGIN_X - 18}
              y={FLAT_ORIGIN_Y - 18}
              width={flatW + 36}
              height={flatH + 46}
              rx="24"
              fill="#5C4432"
              stroke="#1E1813"
              strokeWidth="3.5"
            />
            <rect
              x={FLAT_ORIGIN_X - 14}
              y={FLAT_ORIGIN_Y - 14}
              width={flatW + 28}
              height={flatH + 28}
              rx="18"
              fill="#97A1A4"
              stroke="#1E1813"
              strokeWidth="3"
            />
            <rect
              x={FLAT_ORIGIN_X - 5}
              y={FLAT_ORIGIN_Y - 5}
              width={flatW + 10}
              height={flatH + 10}
              rx="9"
              fill="#4B9443"
              stroke="#1C331A"
              strokeWidth="2"
            />

            {Array.from({ length: 8 }, (_, vr) =>
              Array.from({ length: 8 }, (_, vc) => {
                const boardRow = flipped ? 7 - vr : vr;
                const boardCol = flipped ? 7 - vc : vc;
                const sq = `${FILES[boardCol]}${RANKS[boardRow]}` as Square;
                const isLight = (boardRow + boardCol) % 2 === 0;
                const x = FLAT_ORIGIN_X + vc * FLAT_TILE;
                const y = FLAT_ORIGIN_Y + vr * FLAT_TILE;
                const center = flatGridCenter(vr, vc);

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
                    <rect
                      x={x}
                      y={y}
                      width={FLAT_TILE}
                      height={FLAT_TILE}
                      fill={isLight ? 'url(#tile-light)' : 'url(#tile-dark)'}
                      stroke="#3B7A3E"
                      strokeWidth="1"
                    />
                    {(isLastFrom || isLastTo) && !isSelected && !legalInfo && (
                      <rect
                        x={x + 1}
                        y={y + 1}
                        width={FLAT_TILE - 2}
                        height={FLAT_TILE - 2}
                        fill="rgba(255, 241, 130, 0.34)"
                        stroke="rgba(255, 232, 95, 0.8)"
                        strokeWidth="1.8"
                        className="pointer-events-none"
                      />
                    )}
                    {isHintSquare && !isSelected && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={FLAT_TILE - 4}
                        height={FLAT_TILE - 4}
                        rx="6"
                        fill="rgba(116, 242, 255, 0.44)"
                        stroke="#38E8FF"
                        strokeWidth="2.8"
                        filter="url(#glow-blue)"
                        className="pointer-events-none animate-tile-glow"
                      />
                    )}
                    {isSelected && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={FLAT_TILE - 4}
                        height={FLAT_TILE - 4}
                        rx="6"
                        fill="url(#yellow-neon)"
                        fillOpacity="0.78"
                        stroke="#FFFCE0"
                        strokeWidth="3"
                        filter="url(#glow-yellow)"
                        className="pointer-events-none"
                      />
                    )}
                    {legalInfo && !legalInfo.isCapture && (
                      <g className="pointer-events-none animate-tile-glow">
                        <rect
                          x={x + 2}
                          y={y + 2}
                          width={FLAT_TILE - 4}
                          height={FLAT_TILE - 4}
                          rx="6"
                          fill="url(#yellow-neon)"
                          fillOpacity="0.54"
                          stroke="#FFF48C"
                          strokeWidth="2.4"
                          filter="url(#glow-yellow)"
                        />
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r="10"
                          fill="#FFFCE6"
                          stroke="#D99B00"
                          strokeWidth="2"
                        />
                      </g>
                    )}
                    {legalInfo && legalInfo.isCapture && (
                      <g className="pointer-events-none animate-tile-glow">
                        <rect
                          x={x + 2}
                          y={y + 2}
                          width={FLAT_TILE - 4}
                          height={FLAT_TILE - 4}
                          rx="6"
                          fill="url(#blue-neon)"
                          fillOpacity="0.68"
                          stroke="#DDFBFF"
                          strokeWidth="3"
                          filter="url(#glow-blue)"
                        />
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r="23"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="2.4"
                          strokeDasharray="6 4"
                        />
                      </g>
                    )}
                    {isCheckedKing && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={FLAT_TILE - 4}
                        height={FLAT_TILE - 4}
                        rx="6"
                        fill="rgba(239, 68, 68, 0.72)"
                        stroke="#FFE066"
                        strokeWidth="3"
                        className="pointer-events-none animate-tile-glow"
                      />
                    )}
                    {vc === 0 && (
                      <text
                        x={x + 5}
                        y={y + 15}
                        fontSize="11.5"
                        fontFamily="'Archivo Black', sans-serif"
                        fill="#FFFCE6"
                        stroke="#213825"
                        strokeWidth="2.2"
                        paintOrder="stroke"
                        className="pointer-events-none"
                      >
                        {RANKS[boardRow]}
                      </text>
                    )}
                    {vr === 7 && (
                      <text
                        x={x + FLAT_TILE - 13}
                        y={y + FLAT_TILE - 5}
                        fontSize="11.5"
                        fontFamily="'Archivo Black', sans-serif"
                        fill="#FFFCE6"
                        stroke="#213825"
                        strokeWidth="2.2"
                        paintOrder="stroke"
                        className="pointer-events-none"
                      >
                        {FILES[boardCol]}
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </g>
        ) : (
          /* ================================================================
             BRANCH B: TRANSPARENT 8x8 INTERACTIVE OVERLAY ON /arena-bg.png!
             Zero manual board tiles — uses the authentic grass tiles directly!
             ================================================================ */
          <g>
            {Array.from({ length: 8 }, (_, vr) =>
              Array.from({ length: 8 }, (_, vc) => {
                const boardRow = flipped ? 7 - vr : vr;
                const boardCol = flipped ? 7 - vc : vc;
                const sq = `${FILES[boardCol]}${RANKS[boardRow]}` as Square;
                const points = isoTilePoints(vr, vc);
                const center = isoGridCenter(vr, vc);

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
                    {/* Transparent exact-fit hit target directly over /arena-bg.png grass tile */}
                    <polygon
                      points={points}
                      fill="transparent"
                      className="hover:fill-white/10 transition-colors"
                    />

                    {/* Last Move Subtle Golden Rim */}
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

                    {/* Selected Piece: Soft Glowing Neon Yellow */}
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

                    {/* Legal Quiet Move: Soft Yellow Glow + Crisp Center Dot */}
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
                        <ellipse
                          cx={center.x}
                          cy={center.y}
                          rx="11"
                          ry="6.5"
                          fill="#FFFCE6"
                          stroke="#D99B00"
                          strokeWidth="2"
                        />
                      </g>
                    )}

                    {/* Legal Capture Target: Glowing Neon Blue Ring */}
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

                    {/* Subtle Edge Coordinates along front edges of /arena-bg.png board */}
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
                  </g>
                );
              })
            )}
          </g>
        )}

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

        {/* 2D FULL-BODY STANDING CHIBI SPRITES ON /arena-bg.png TILES */}
        <g className="pointer-events-none">
          {sortedPieces.map((p) => {
            const isSelected = selectedSquare === p.sq;
            const isLastTo = lastMove?.to === p.sq;
            const isJumpingAttacker = attackJumpInfo?.targetSq === p.sq;
            // Subtle perspective scale in iso mode: back pieces slightly smaller, front pieces slightly larger!
            const depthScale = isFlat ? 1 : 0.9 + ((p.vr + p.vc) / 14) * 0.16;
            const spriteW = (isFlat ? 70 : 78) * depthScale;
            const spriteH = (isFlat ? 80 : 90) * depthScale;

            const drawX = p.x - spriteW / 2;
            const drawY = isFlat ? p.y - spriteH + 22 : p.y - spriteH + 14;
            const idleDelay = `${(((p.vr * 7 + p.vc * 3) % 9) * 0.24).toFixed(2)}s`;

            const animClass = isJumpingAttacker
              ? 'animate-attack-jump'
              : isSelected
                ? 'animate-piece-float'
                : isLastTo
                  ? 'animate-piece-hop'
                  : 'animate-piece-idle';

            return (
              <g
                key={`${p.sq}-${p.color}-${p.type}-${isJumpingAttacker ? attackJumpInfo?.id : 0}`}
                transform={`translate(${drawX}, ${drawY})`}
              >
                <g
                  className={animClass}
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
                  <svg width={spriteW} height={spriteH} viewBox="0 0 110 128" overflow="visible">
                    <AnimalPiece
                      color={p.color}
                      type={p.type}
                      showBadge={isSelected}
                      showShadow
                    />
                  </svg>
                </g>
              </g>
            );
          })}
        </g>

        {/* CAPTURED ENEMY PIECES ON THE OUTER GARDEN LAWNS */}
        {leftBenchCoords.length > 0 && (
          <g className="pointer-events-none">
            {leftBenchCoords.map((item, idx) => (
              <g
                key={item.key}
                transform={`translate(${item.x - 26}, ${item.y - 46})`}
                opacity="0.96"
              >
                <g
                  className="animate-piece-idle"
                  style={{ animationDelay: `${(idx * 0.3).toFixed(2)}s` }}
                >
                  <svg width="52" height="60" viewBox="0 0 110 128" overflow="visible">
                    <AnimalPiece color="b" type={item.pieceType} showBadge={false} showShadow />
                  </svg>
                </g>
              </g>
            ))}
          </g>
        )}

        {rightBenchCoords.length > 0 && (
          <g className="pointer-events-none">
            {rightBenchCoords.map((item, idx) => (
              <g
                key={item.key}
                transform={`translate(${item.x - 26}, ${item.y - 46})`}
                opacity="0.96"
              >
                <g
                  className="animate-piece-idle"
                  style={{ animationDelay: `${(idx * 0.33).toFixed(2)}s` }}
                >
                  <svg width="52" height="60" viewBox="0 0 110 128" overflow="visible">
                    <AnimalPiece color="w" type={item.pieceType} showBadge={false} showShadow />
                  </svg>
                </g>
              </g>
            ))}
          </g>
        )}

        {/* Floating "TAP UNTUK SERANG!" Speech Callout */}
        {firstCaptureTarget && !disabled && (
          (() => {
            const pt = squareToBoardPoint(firstCaptureTarget, flipped, boardView);
            const bx = Math.max(150, Math.min(ARENA_W - 150, pt.x));
            const by = Math.max(66, pt.y - 84);
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

        {/* Comic Emote Speech Bubbles anchored above Kings */}
        {sortedPieces
          .filter((p) => p.type === 'k' && activeEmotes[p.color])
          .map((king) => {
            const emote = activeEmotes[king.color]!;
            const bx = Math.max(120, Math.min(ARENA_W - 120, king.x));
            const by = Math.max(66, king.y - 90);
            return (
              <g key={emote.id} className="pointer-events-none">
                <rect
                  x={bx - 66}
                  y={by - 22}
                  width="132"
                  height="34"
                  rx="17"
                  fill="#FFF9DB"
                  stroke="#1F1A17"
                  strokeWidth="2.8"
                />
                <polygon
                  points={`${bx - 7},${by + 10} ${bx + 7},${by + 10} ${bx},${by + 20}`}
                  fill="#FFF9DB"
                  stroke="#1F1A17"
                  strokeWidth="2.4"
                />
                <rect x={bx - 8} y={by + 6} width="16" height="6" fill="#FFF9DB" />
                <text
                  x={bx}
                  y={by - 1}
                  textAnchor="middle"
                  fontSize="13.5"
                  fontFamily="'Archivo Black', sans-serif"
                  fill="#241C14"
                >
                  {emote.text}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Pixel-Locked HTML5 Canvas 1.2s SLASH! Energy VFX Overlay */}
      <SkillVfxCanvas event={vfxEvent} flipped={flipped} boardView={boardView} />
    </div>
  );
};
