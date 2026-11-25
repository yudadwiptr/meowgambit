import React, { useMemo } from 'react';
import type { Chess, Color, Move, Square } from 'chess.js';
import type { ActiveEmote, SkillVfxEvent } from '../../types/game';
import { AnimalPiece } from '../pieces/AnimalPiece';
import { SkillVfxCanvas } from '../vfx/SkillVfxCanvas';
import {
  ISO_CX,
  ISO_TH,
  ISO_TOP_Y,
  ISO_TW,
  ISO_VIEW_H,
  ISO_VIEW_W,
  isoGridCenter,
  isoTilePoints,
  squareToIso,
} from './isometric';

interface ChessBoardProps {
  chess: Chess;
  fen: string;
  flipped: boolean;
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: { from: Square; to: Square } | null;
  vfxEvent: SkillVfxEvent | null;
  isShaking: boolean;
  activeEmotes: Partial<Record<Color, ActiveEmote>>;
  disabled: boolean;
  tapToAttackLabel: string;
  hintMove?: { from: Square; to: Square } | null;
  onSquareClick: (sq: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/** Helper to build a clean glowing isometric arrow polygon along the grass surface */
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

/** Decorative cartoon garden stone block */
const StoneBlock: React.FC<{ x: number; y: number; rx?: number; ry?: number; shade?: string }> = ({
  x,
  y,
  rx = 16,
  ry = 10,
  shade = '#9BA5A8',
}) => (
  <g>
    <ellipse cx={x + 1} cy={y + 4} rx={rx} ry={ry * 0.85} fill="#5C6669" stroke="#1E1C1A" strokeWidth="2.2" />
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={shade} stroke="#1E1C1A" strokeWidth="2.2" />
    <ellipse cx={x - rx * 0.25} cy={y - ry * 0.32} rx={rx * 0.4} ry={ry * 0.25} fill="rgba(255,255,255,0.38)" />
  </g>
);

/** Decorative wooden garden fence picket */
const WoodPost: React.FC<{ x: number; y: number; h?: number }> = ({ x, y, h = 34 }) => (
  <g stroke="#241911" strokeWidth="2.2" strokeLinejoin="round">
    <path
      d={`M${x - 6} ${y} L${x - 6} ${y - h + 7} L${x} ${y - h} L${x + 6} ${y - h + 7} L${x + 6} ${y} Z`}
      fill="#A96E3F"
    />
    <line x1={x - 1.5} y1={y - h + 8} x2={x - 1.5} y2={y - 4} stroke="#C78A58" strokeWidth="2" />
  </g>
);

/** Decorative lush cartoon garden bush with mini flowers */
const GardenBush: React.FC<{
  x: number;
  y: number;
  scale?: number;
  flowers?: Array<{ dx: number; dy: number; color: string }>;
}> = ({ x, y, scale = 1, flowers = [] }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="14" rx="34" ry="12" fill="rgba(12, 28, 18, 0.35)" />
    <g stroke="#1A2C1D" strokeWidth="2.4" strokeLinejoin="round">
      <circle cx="-18" cy="2" r="15" fill="#3B7A3E" />
      <circle cx="18" cy="3" r="14" fill="#3B7A3E" />
      <circle cx="-6" cy="-7" r="17" fill="#4D9448" />
      <circle cx="10" cy="-4" r="15" fill="#5CA84E" />
      <circle cx="0" cy="5" r="16" fill="#4B9146" />
    </g>
    {/* Soft leafy highlight puffs */}
    <circle cx="-9" cy="-12" r="5" fill="#7AC762" opacity="0.65" />
    <circle cx="11" cy="-9" r="4.5" fill="#7AC762" opacity="0.65" />
    {flowers.map((fl, i) => (
      <g key={i} transform={`translate(${fl.dx}, ${fl.dy})`}>
        <circle cx="0" cy="0" r="4.2" fill={fl.color} stroke="#1F1A17" strokeWidth="1.4" />
        <circle cx="0" cy="0" r="1.5" fill="#FFF176" />
      </g>
    ))}
  </g>
);

/** Scattered tiny garden flower */
const MiniFlower: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx="-3" cy="0" r="2.6" fill={color} stroke="#1B1917" strokeWidth="1" />
    <circle cx="3" cy="0" r="2.6" fill={color} stroke="#1B1917" strokeWidth="1" />
    <circle cx="0" cy="-3" r="2.6" fill={color} stroke="#1B1917" strokeWidth="1" />
    <circle cx="0" cy="3" r="2.6" fill={color} stroke="#1B1917" strokeWidth="1" />
    <circle cx="0" cy="0" r="2" fill="#FFE14D" />
  </g>
);

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  fen,
  flipped,
  selectedSquare,
  legalMoves,
  lastMove,
  vfxEvent,
  isShaking,
  activeEmotes,
  disabled,
  tapToAttackLabel,
  hintMove,
  onSquareClick,
}) => {
  const boardMatrix = useMemo(() => {
    void fen;
    return chess.board();
  }, [chess, fen]);

  const inCheck = chess.inCheck();
  const currentTurn = chess.turn();

  // Map legal target squares
  const legalTargetMap = useMemo(() => {
    const map = new Map<Square, { isCapture: boolean; move: Move }>();
    for (const m of legalMoves) {
      const isCapture = Boolean(m.captured) || m.flags.includes('e');
      map.set(m.to, { isCapture, move: m });
    }
    return map;
  }, [legalMoves]);

  // Collect pieces sorted back-to-front (Painter's Algorithm: vr + vc ascending)
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
        const pos = squareToIso(sq, flipped);
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

    items.sort((a, b) => a.vr + a.vc - (b.vr + b.vc) || a.x - b.x);
    return items;
  }, [boardMatrix, flipped]);

  const checkedKingSquare = useMemo(() => {
    if (!inCheck) return undefined;
    const found = sortedPieces.find((p) => p.type === 'k' && p.color === currentTurn);
    return found?.sq;
  }, [inCheck, sortedPieces, currentTurn]);

  // First capture target for "TAP UNTUK SERANG!" floating callout bubble
  const firstCaptureTarget = useMemo(() => {
    for (const [sq, info] of legalTargetMap.entries()) {
      if (info.isCapture) return sq;
    }
    return null;
  }, [legalTargetMap]);

  // Diamond corners for board walls & garden frame
  const topCorner = { x: ISO_CX, y: ISO_TOP_Y };
  const rightCorner = { x: ISO_CX + 8 * ISO_TW, y: ISO_TOP_Y + 8 * ISO_TH };
  const bottomCorner = { x: ISO_CX, y: ISO_TOP_Y + 16 * ISO_TH };
  const leftCorner = { x: ISO_CX - 8 * ISO_TW, y: ISO_TOP_Y + 8 * ISO_TH };
  const slabDepth = 26;

  // Perimeter stone coordinates along all 4 edges
  const backLeftStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: leftCorner.x - 10 + (topCorner.x - leftCorner.x) * t,
          y: leftCorner.y - 6 + (topCorner.y - leftCorner.y) * t,
          shade: i % 2 === 0 ? '#A2ACAF' : '#8A9599',
        };
      }),
    [leftCorner.x, leftCorner.y, topCorner.x, topCorner.y]
  );

  const backRightStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: topCorner.x + 10 + (rightCorner.x - topCorner.x) * t,
          y: topCorner.y - 6 + (rightCorner.y - topCorner.y) * t,
          shade: i % 2 === 0 ? '#97A2A6' : '#808B8F',
        };
      }),
    [rightCorner.x, rightCorner.y, topCorner.x, topCorner.y]
  );

  const frontLeftStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: leftCorner.x - 6 + (bottomCorner.x - leftCorner.x) * t,
          y: leftCorner.y + 12 + (bottomCorner.y - leftCorner.y) * t,
          shade: i % 2 === 0 ? '#AAB3B6' : '#8F9A9E',
        };
      }),
    [bottomCorner.x, bottomCorner.y, leftCorner.x, leftCorner.y]
  );

  const frontRightStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: bottomCorner.x + 6 + (rightCorner.x - bottomCorner.x) * t,
          y: bottomCorner.y + 12 + (rightCorner.y - bottomCorner.y) * t,
          shade: i % 2 === 0 ? '#9DA7AA' : '#848F93',
        };
      }),
    [bottomCorner.x, bottomCorner.y, rightCorner.x, rightCorner.y]
  );

  // Wooden fence posts along upper-left, lower-left, and lower-right edges (like reference!)
  const fenceBackLeft = [0.14, 0.25, 0.36, 0.47, 0.58].map((t) => ({
    x: leftCorner.x - 16 + (topCorner.x - leftCorner.x) * t,
    y: leftCorner.y - 8 + (topCorner.y - leftCorner.y) * t,
  }));

  const fenceFrontLeft = [0.06, 0.16, 0.26].map((t) => ({
    x: leftCorner.x - 2 + (bottomCorner.x - leftCorner.x) * t,
    y: leftCorner.y + 18 + (bottomCorner.y - leftCorner.y) * t,
  }));

  const fenceFrontRight = [0.68, 0.78, 0.88].map((t) => ({
    x: bottomCorner.x + 2 + (rightCorner.x - bottomCorner.x) * t,
    y: bottomCorner.y + 18 + (rightCorner.y - bottomCorner.y) * t,
  }));

  // Compute attack jump delta if active VFX is a capture/check
  const attackJumpInfo = useMemo(() => {
    if (!vfxEvent || (!vfxEvent.isCapture && !vfxEvent.isCheck)) return null;
    const f = squareToIso(vfxEvent.from, flipped);
    const t = squareToIso(vfxEvent.to, flipped);
    return {
      targetSq: vfxEvent.to,
      dx: f.x - t.x,
      dy: f.y - t.y,
      id: vfxEvent.id,
    };
  }, [vfxEvent, flipped]);

  // Surface arrows when a piece is selected
  const surfaceArrows = useMemo(() => {
    if (!selectedSquare) return [];
    const origin = squareToIso(selectedSquare, flipped);
    const arrows: Array<{ id: string; points: string; isCapture: boolean }> = [];

    // Show clean arrows for capture targets + up to 4 nearest quiet moves so board stays super clear
    const captures: Move[] = [];
    const quiets: Move[] = [];
    for (const m of legalMoves) {
      if (m.captured || m.flags.includes('e')) captures.push(m);
      else quiets.push(m);
    }

    for (const m of captures) {
      const target = squareToIso(m.to, flipped);
      const pts = buildSurfaceArrow(origin, target);
      if (pts) arrows.push({ id: `cap-${m.to}`, points: pts, isCapture: true });
    }

    for (const m of quiets.slice(0, 6)) {
      const target = squareToIso(m.to, flipped);
      const pts = buildSurfaceArrow(origin, target);
      if (pts) arrows.push({ id: `q-${m.to}`, points: pts, isCapture: false });
    }

    return arrows;
  }, [selectedSquare, legalMoves, flipped]);

  return (
    <div
      className={`relative w-full aspect-[1040/650] select-none ${
        isShaking ? 'animate-board-shake' : ''
      }`}
    >
      <svg
        viewBox={`0 0 ${ISO_VIEW_W} ${ISO_VIEW_H}`}
        className="w-full h-full overflow-visible block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft glowing filters for neon yellow & neon blue grass tile highlights */}
          <filter id="glow-yellow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="tile-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9AE362" />
            <stop offset="100%" stopColor="#82CE4F" />
          </linearGradient>
          <linearGradient id="tile-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#58A85B" />
            <stop offset="100%" stopColor="#468E49" />
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

        {/* 1. Ambient Diorama Ground Shadow */}
        <polygon
          points={`${topCorner.x},${topCorner.y + 18} ${rightCorner.x + 28},${rightCorner.y + 34} ${bottomCorner.x},${bottomCorner.y + 52} ${leftCorner.x - 28},${leftCorner.y + 34}`}
          fill="rgba(8, 22, 14, 0.45)"
        />

        {/* 2. Scattered Outer Garden Grass Tufts & Mini Flowers */}
        <g className="pointer-events-none">
          <MiniFlower x={175} y={468} color="#F78FB3" />
          <MiniFlower x={240} y={505} color="#74B9FF" />
          <MiniFlower x={315} y={548} color="#FFEAA7" />
          <MiniFlower x={745} y={536} color="#F78FB3" />
          <MiniFlower x={820} y={495} color="#FFEAA7" />
          <MiniFlower x={875} y={448} color="#74B9FF" />
          <MiniFlower x={115} y={248} color="#FFEAA7" />
          <MiniFlower x={920} y={242} color="#F78FB3" />
        </g>

        {/* 3. Back Garden Scenery: Large Boulder, Bushes & Back Wooden Fence */}
        <g className="pointer-events-none">
          {/* Top-center lush garden bushes */}
          <GardenBush
            x={468}
            y={74}
            scale={0.95}
            flowers={[{ dx: -10, dy: -4, color: '#F78FB3' }]}
          />
          <GardenBush x={568} y={76} scale={0.82} />
          {/* Iconic corner garden boulder near top-left */}
          <path
            d="M322 162 C316 132, 344 106, 376 112 C402 104, 424 124, 418 152 L396 168 L338 172 Z"
            fill="#9BA6AA"
            stroke="#1E1C1A"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M342 130 C354 120, 374 118, 390 124"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Wooden Fence Rails & Posts on Back-Left */}
          <line
            x1={fenceBackLeft[0].x}
            y1={fenceBackLeft[0].y - 16}
            x2={fenceBackLeft[fenceBackLeft.length - 1].x}
            y2={fenceBackLeft[fenceBackLeft.length - 1].y - 16}
            stroke="#8B562C"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {fenceBackLeft.map((p, i) => (
            <WoodPost key={`fbl-${i}`} x={p.x} y={p.y} h={34} />
          ))}

          {/* Back Stone Wall Edges */}
          {backLeftStones.map((s, i) => (
            <StoneBlock key={`bls-${i}`} x={s.x} y={s.y} rx={17} ry={10} shade={s.shade} />
          ))}
          {backRightStones.map((s, i) => (
            <StoneBlock key={`brs-${i}`} x={s.x} y={s.y} rx={17} ry={10} shade={s.shade} />
          ))}

          {/* Left & Right Corner Bushes */}
          <GardenBush
            x={108}
            y={324}
            scale={0.95}
            flowers={[
              { dx: -12, dy: 2, color: '#F78FB3' },
              { dx: 8, dy: -6, color: '#FFEAA7' },
            ]}
          />
          <GardenBush
            x={932}
            y={322}
            scale={0.92}
            flowers={[{ dx: -6, dy: -4, color: '#74B9FF' }]}
          />
        </g>

        {/* 4. 3D Diorama Earth/Stone Slab Thickness (Front-Left & Front-Right Sides) */}
        <polygon
          points={`${leftCorner.x},${leftCorner.y} ${bottomCorner.x},${bottomCorner.y} ${bottomCorner.x},${bottomCorner.y + slabDepth} ${leftCorner.x},${leftCorner.y + slabDepth}`}
          fill="#6E5D4B"
          stroke="#1E1C1A"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <polygon
          points={`${bottomCorner.x},${bottomCorner.y} ${rightCorner.x},${rightCorner.y} ${rightCorner.x},${rightCorner.y + slabDepth} ${bottomCorner.x},${bottomCorner.y + slabDepth}`}
          fill="#554738"
          stroke="#1E1C1A"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />

        {/* 5. 8x8 ISOMETRIC GRASS CHESSBOARD TILES */}
        <g>
          {Array.from({ length: 8 }, (_, vr) =>
            Array.from({ length: 8 }, (_, vc) => {
              const boardRow = flipped ? 7 - vr : vr;
              const boardCol = flipped ? 7 - vc : vc;
              const sq = `${FILES[boardCol]}${RANKS[boardRow]}` as Square;
              const isLight = (boardRow + boardCol) % 2 === 0;
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
                  {/* Base Grass Diamond Tile */}
                  <polygon
                    points={points}
                    fill={isLight ? 'url(#tile-light)' : 'url(#tile-dark)'}
                    stroke="#3B7A3E"
                    strokeWidth="1.2"
                  />

                  {/* Subtle cartoon grass blade texture on alternating tiles */}
                  {(vr + vc) % 3 === 0 && (
                    <path
                      d={`M${center.x - 10} ${center.y + 4} L${center.x - 12} ${center.y - 1} M${center.x - 7} ${center.y + 5} L${center.x - 6} ${center.y} M${center.x + 9} ${center.y - 2} L${center.x + 11} ${center.y - 6}`}
                      stroke={isLight ? '#6EB83E' : '#3C7E3F'}
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      opacity="0.55"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Last Move Warm Sunbeam Highlight */}
                  {(isLastFrom || isLastTo) && !isSelected && !legalInfo && (
                    <polygon
                      points={points}
                      fill="rgba(255, 241, 130, 0.32)"
                      stroke="rgba(255, 232, 95, 0.7)"
                      strokeWidth="1.6"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Skill Hint Highlight */}
                  {isHintSquare && !isSelected && (
                    <polygon
                      points={points}
                      fill="rgba(116, 242, 255, 0.42)"
                      stroke="#38E8FF"
                      strokeWidth="2.5"
                      filter="url(#glow-blue)"
                      className="pointer-events-none animate-tile-glow"
                    />
                  )}

                  {/* Selected Piece Tile: Glowing Neon Yellow */}
                  {isSelected && (
                    <polygon
                      points={points}
                      fill="url(#yellow-neon)"
                      fillOpacity="0.82"
                      stroke="#FFFCE0"
                      strokeWidth="3"
                      filter="url(#glow-yellow)"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Legal Quiet Move Tile: Soft Glowing Neon Yellow */}
                  {legalInfo && !legalInfo.isCapture && (
                    <g className="pointer-events-none animate-tile-glow">
                      <polygon
                        points={points}
                        fill="url(#yellow-neon)"
                        fillOpacity="0.58"
                        stroke="#FFF48C"
                        strokeWidth="2.4"
                        filter="url(#glow-yellow)"
                      />
                      <ellipse
                        cx={center.x}
                        cy={center.y}
                        rx="11"
                        ry="6"
                        fill="#FFFCE6"
                        stroke="#D99B00"
                        strokeWidth="1.8"
                      />
                    </g>
                  )}

                  {/* Legal Capture Target Tile: Glowing Neon Blue (persis referensi!) */}
                  {legalInfo && legalInfo.isCapture && (
                    <g className="pointer-events-none animate-tile-glow">
                      <polygon
                        points={points}
                        fill="url(#blue-neon)"
                        fillOpacity="0.72"
                        stroke="#DDFBFF"
                        strokeWidth="3"
                        filter="url(#glow-blue)"
                      />
                      <ellipse
                        cx={center.x}
                        cy={center.y}
                        rx="22"
                        ry="11.5"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2.4"
                        strokeDasharray="6 4"
                      />
                    </g>
                  )}

                  {/* Checked King Tile: Warm Pulsing Red/Orange Alert */}
                  {isCheckedKing && (
                    <polygon
                      points={points}
                      fill="rgba(239, 68, 68, 0.72)"
                      stroke="#FFE066"
                      strokeWidth="3"
                      className="pointer-events-none animate-tile-glow"
                    />
                  )}

                  {/* Subtle Edge Coordinate Letters & Numbers along front edges */}
                  {vr === 7 && (
                    <text
                      x={center.x - 16}
                      y={center.y + 15}
                      fontSize="11"
                      fontFamily="'Archivo Black', sans-serif"
                      fill="rgba(255, 250, 230, 0.85)"
                      stroke="#213825"
                      strokeWidth="2.4"
                      paintOrder="stroke"
                      className="pointer-events-none"
                    >
                      {FILES[boardCol]}
                    </text>
                  )}
                  {vc === 7 && (
                    <text
                      x={center.x + 12}
                      y={center.y + 15}
                      fontSize="11"
                      fontFamily="'Archivo Black', sans-serif"
                      fill="rgba(255, 250, 230, 0.85)"
                      stroke="#213825"
                      strokeWidth="2.4"
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

        {/* 6. Glowing Surface Direction Arrows (Yellow for paths, Blue for attacks) */}
        {surfaceArrows.length > 0 && (
          <g className="pointer-events-none">
            {surfaceArrows.map((arr) => (
              <polygon
                key={arr.id}
                points={arr.points}
                fill={arr.isCapture ? 'url(#blue-neon)' : 'url(#yellow-neon)'}
                fillOpacity="0.88"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                filter={arr.isCapture ? 'url(#glow-blue)' : 'url(#glow-yellow)'}
              />
            ))}
          </g>
        )}

        {/* 7. 2D FULL-BODY CHIBI STANDING SPRITES (Painter's Algorithm Z-Sorted) */}
        <g className="pointer-events-none">
          {sortedPieces.map((p) => {
            const isSelected = selectedSquare === p.sq;
            const isLastTo = lastMove?.to === p.sq;
            const isJumpingAttacker = attackJumpInfo?.targetSq === p.sq;
            const spriteW = 74;
            const spriteH = 86;

            // Anchor feet slightly below tile center so piece stands naturally on grass
            const drawX = p.x - spriteW / 2;
            const drawY = p.y - spriteH + 13;

            const animClass = isJumpingAttacker
              ? 'animate-attack-jump'
              : isSelected
                ? 'animate-piece-float'
                : isLastTo
                  ? 'animate-piece-hop'
                  : '';

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

        {/* 8. Foreground Garden Stone Wall, Mini Fences, Bushes & Flowers */}
        <g className="pointer-events-none">
          {frontLeftStones.map((s, i) => (
            <StoneBlock key={`fls-${i}`} x={s.x} y={s.y} rx={17} ry={10} shade={s.shade} />
          ))}
          {frontRightStones.map((s, i) => (
            <StoneBlock key={`frs-${i}`} x={s.x} y={s.y} rx={17} ry={10} shade={s.shade} />
          ))}

          {/* Small front-left wooden fence */}
          <line
            x1={fenceFrontLeft[0].x}
            y1={fenceFrontLeft[0].y - 14}
            x2={fenceFrontLeft[fenceFrontLeft.length - 1].x}
            y2={fenceFrontLeft[fenceFrontLeft.length - 1].y - 14}
            stroke="#8B562C"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {fenceFrontLeft.map((p, i) => (
            <WoodPost key={`ffl-${i}`} x={p.x} y={p.y} h={28} />
          ))}

          {/* Small front-right wooden fence */}
          <line
            x1={fenceFrontRight[0].x}
            y1={fenceFrontRight[0].y - 14}
            x2={fenceFrontRight[fenceFrontRight.length - 1].x}
            y2={fenceFrontRight[fenceFrontRight.length - 1].y - 14}
            stroke="#8B562C"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {fenceFrontRight.map((p, i) => (
            <WoodPost key={`ffr-${i}`} x={p.x} y={p.y} h={28} />
          ))}

          {/* Front-center lush accent bush (persis referensi di dekat sudut bawah!) */}
          <GardenBush
            x={575}
            y={566}
            scale={0.85}
            flowers={[{ dx: -8, dy: -3, color: '#FFEAA7' }]}
          />
        </g>

        {/* 9. Floating "TAP UNTUK SERANG!" Speech Callout when a capture target is available */}
        {firstCaptureTarget && !disabled && (
          (() => {
            const pt = squareToIso(firstCaptureTarget, flipped);
            const bx = Math.max(110, Math.min(ISO_VIEW_W - 110, pt.x));
            const by = Math.max(54, pt.y - 84);
            return (
              <g className="pointer-events-none animate-tile-glow">
                <rect
                  x={bx - 76}
                  y={by - 20}
                  width="152"
                  height="30"
                  rx="15"
                  fill="#FFFDF5"
                  stroke="#1E1A16"
                  strokeWidth="2.6"
                />
                <polygon
                  points={`${bx - 7},${by + 9} ${bx + 7},${by + 9} ${bx},${by + 19}`}
                  fill="#FFFDF5"
                  stroke="#1E1A16"
                  strokeWidth="2.2"
                />
                <rect x={bx - 8} y={by + 5} width="16" height="6" fill="#FFFDF5" />
                <text
                  x={bx}
                  y={by - 1}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontFamily="'Archivo Black', sans-serif"
                  fill="#C4302B"
                >
                  {tapToAttackLabel}
                </text>
              </g>
            );
          })()
        )}

        {/* 10. Comic Emote Speech Bubbles anchored above Kings */}
        {sortedPieces
          .filter((p) => p.type === 'k' && activeEmotes[p.color])
          .map((king) => {
            const emote = activeEmotes[king.color]!;
            const bx = Math.max(90, Math.min(ISO_VIEW_W - 90, king.x));
            const by = Math.max(52, king.y - 88);
            return (
              <g key={emote.id} className="pointer-events-none">
                <rect
                  x={bx - 62}
                  y={by - 22}
                  width="124"
                  height="32"
                  rx="16"
                  fill="#FFF9DB"
                  stroke="#1F1A17"
                  strokeWidth="2.8"
                />
                <polygon
                  points={`${bx - 7},${by + 9} ${bx + 7},${by + 9} ${bx},${by + 19}`}
                  fill="#FFF9DB"
                  stroke="#1F1A17"
                  strokeWidth="2.2"
                />
                <rect x={bx - 8} y={by + 5} width="16" height="6" fill="#FFF9DB" />
                <text
                  x={bx}
                  y={by - 2}
                  textAnchor="middle"
                  fontSize="13"
                  fontFamily="'Archivo Black', sans-serif"
                  fill="#241C14"
                >
                  {emote.text}
                </text>
              </g>
            );
          })}
      </svg>

      {/* 11. HTML5 Canvas 1.2s Cinematic SLASH! Blue-Gold Energy VFX Overlay */}
      <SkillVfxCanvas event={vfxEvent} flipped={flipped} />
    </div>
  );
};
