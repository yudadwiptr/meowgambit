import React, { useMemo } from 'react';
import type { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
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
  capturedByWhite: PieceSymbol[];
  capturedByBlack: PieceSymbol[];
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

/** Chunky 2.5D Garden Stone Wall Block with stone cracks & green moss patches */
const StoneBlock: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  shade?: string;
  hasCrack?: boolean;
  hasMoss?: boolean;
}> = ({ x, y, rx = 20, ry = 12, shade = '#9FA9AC', hasCrack = false, hasMoss = false }) => (
  <g>
    {/* Deep stone base thickness */}
    <ellipse cx={x + 1} cy={y + 7} rx={rx} ry={ry * 0.9} fill="#535D60" stroke="#1C1917" strokeWidth="2.4" />
    {/* Main top stone face */}
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={shade} stroke="#1C1917" strokeWidth="2.4" />
    {/* Top specular highlight */}
    <ellipse
      cx={x - rx * 0.26}
      cy={y - ry * 0.34}
      rx={rx * 0.38}
      ry={ry * 0.24}
      fill="rgba(255,255,255,0.42)"
    />
    {/* Stone crack detail */}
    {hasCrack && (
      <path
        d={`M${x - 4} ${y - 4} L${x + 1} ${y + 1} L${x - 2} ${y + 6}`}
        fill="none"
        stroke="#3E4649"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
    {/* Hanging green moss patch */}
    {hasMoss && (
      <path
        d={`M${x + rx * 0.15} ${y - ry * 0.35} Q${x + rx * 0.52} ${y + ry * 0.05} ${x + rx * 0.42} ${y + ry * 0.72} Q${x + rx * 0.12} ${y + ry * 0.55} ${x - rx * 0.05} ${y + ry * 0.8} Q${x - rx * 0.18} ${y + ry * 0.2} ${x + rx * 0.15} ${y - ry * 0.35} Z`}
        fill="#5EB048"
        stroke="#1C331A"
        strokeWidth="1.4"
      />
    )}
  </g>
);

/** Decorative wooden garden fence picket */
const WoodPost: React.FC<{ x: number; y: number; h?: number }> = ({ x, y, h = 38 }) => (
  <g stroke="#241911" strokeWidth="2.3" strokeLinejoin="round">
    <path
      d={`M${x - 6.5} ${y} L${x - 6.5} ${y - h + 7} L${x} ${y - h} L${x + 6.5} ${y - h + 7} L${x + 6.5} ${y} Z`}
      fill="#B37442"
    />
    <line x1={x - 1.5} y1={y - h + 8} x2={x - 1.5} y2={y - 4} stroke="#D19260" strokeWidth="2" />
  </g>
);

/** Decorative lush cartoon garden bush with mini colorful flowers */
const GardenBush: React.FC<{
  x: number;
  y: number;
  scale?: number;
  flowers?: Array<{ dx: number; dy: number; color: string }>;
}> = ({ x, y, scale = 1, flowers = [] }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="15" rx="36" ry="13" fill="rgba(10, 26, 16, 0.38)" />
    <g stroke="#182A1B" strokeWidth="2.5" strokeLinejoin="round">
      <circle cx="-19" cy="2" r="16" fill="#37753A" />
      <circle cx="19" cy="3" r="15" fill="#37753A" />
      <circle cx="-6" cy="-8" r="18" fill="#4B9246" />
      <circle cx="11" cy="-5" r="16" fill="#5DA84E" />
      <circle cx="0" cy="5" r="17" fill="#488D44" />
    </g>
    <circle cx="-9" cy="-13" r="5.5" fill="#82D168" opacity="0.7" />
    <circle cx="12" cy="-10" r="4.8" fill="#82D168" opacity="0.65" />
    {flowers.map((fl, i) => (
      <g key={i} transform={`translate(${fl.dx}, ${fl.dy})`}>
        <circle cx="0" cy="0" r="4.5" fill={fl.color} stroke="#1F1A17" strokeWidth="1.4" />
        <circle cx="0" cy="0" r="1.6" fill="#FFF176" />
      </g>
    ))}
  </g>
);

/** Scattered colorful mini flower */
const MiniFlower: React.FC<{ x: number; y: number; color: string; scale?: number }> = ({
  x,
  y,
  color,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="-3.2" cy="0" r="2.8" fill={color} stroke="#1B1917" strokeWidth="1.1" />
    <circle cx="3.2" cy="0" r="2.8" fill={color} stroke="#1B1917" strokeWidth="1.1" />
    <circle cx="0" cy="-3.2" r="2.8" fill={color} stroke="#1B1917" strokeWidth="1.1" />
    <circle cx="0" cy="3.2" r="2.8" fill={color} stroke="#1B1917" strokeWidth="1.1" />
    <circle cx="0" cy="0" r="2.1" fill="#FFE14D" />
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
  capturedByWhite,
  capturedByBlack,
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

  const firstCaptureTarget = useMemo(() => {
    for (const [sq, info] of legalTargetMap.entries()) {
      if (info.isCapture) return sq;
    }
    return null;
  }, [legalTargetMap]);

  // Diamond corners for board walls & deep 2.5D floating island cliff
  const topCorner = { x: ISO_CX, y: ISO_TOP_Y };
  const rightCorner = { x: ISO_CX + 8 * ISO_TW, y: ISO_TOP_Y + 8 * ISO_TH };
  const bottomCorner = { x: ISO_CX, y: ISO_TOP_Y + 16 * ISO_TH };
  const leftCorner = { x: ISO_CX - 8 * ISO_TW, y: ISO_TOP_Y + 8 * ISO_TH };
  const slabDepth = 60; // Deep 2.5D cliff & brickwork island thickness!

  // Perimeter thick stone blocks with cracks & moss
  const backLeftStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: leftCorner.x - 11 + (topCorner.x - leftCorner.x) * t,
          y: leftCorner.y - 6 + (topCorner.y - leftCorner.y) * t,
          shade: i % 2 === 0 ? '#A8B1B4' : '#8D989C',
          hasCrack: i % 3 === 1,
          hasMoss: i % 4 === 2,
        };
      }),
    [leftCorner.x, leftCorner.y, topCorner.x, topCorner.y]
  );

  const backRightStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: topCorner.x + 11 + (rightCorner.x - topCorner.x) * t,
          y: topCorner.y - 6 + (rightCorner.y - topCorner.y) * t,
          shade: i % 2 === 0 ? '#9DA7AB' : '#838E92',
          hasCrack: i % 3 === 0,
          hasMoss: i % 4 === 1,
        };
      }),
    [rightCorner.x, rightCorner.y, topCorner.x, topCorner.y]
  );

  const frontLeftStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: leftCorner.x - 7 + (bottomCorner.x - leftCorner.x) * t,
          y: leftCorner.y + 11 + (bottomCorner.y - leftCorner.y) * t,
          shade: i % 2 === 0 ? '#B1BABD' : '#949FA3',
          hasCrack: i % 3 === 2,
          hasMoss: i % 3 === 0,
        };
      }),
    [bottomCorner.x, bottomCorner.y, leftCorner.x, leftCorner.y]
  );

  const frontRightStones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return {
          x: bottomCorner.x + 7 + (rightCorner.x - bottomCorner.x) * t,
          y: bottomCorner.y + 11 + (rightCorner.y - bottomCorner.y) * t,
          shade: i % 2 === 0 ? '#A2ACAF' : '#889397',
          hasCrack: i % 3 === 1,
          hasMoss: i % 4 === 3,
        };
      }),
    [bottomCorner.x, bottomCorner.y, rightCorner.x, rightCorner.y]
  );

  // 2.5D Brick courses along the deep front-left & front-right island cliff faces
  const cliffBricksLeft = useMemo(() => {
    const bricks: Array<{ pts: string; fill: string; moss?: boolean }> = [];
    const rows = 2;
    const cols = 7;
    const dx = bottomCorner.x - leftCorner.x;
    const dy = bottomCorner.y - leftCorner.y;
    for (let r = 0; r < rows; r++) {
      const y0 = 18 + r * 20;
      const y1 = y0 + 18;
      const offset = r % 2 === 0 ? 0 : 0.06;
      for (let c = 0; c < cols; c++) {
        const t0 = Math.max(0.02, c / cols + offset);
        const t1 = Math.min(0.98, (c + 0.92) / cols + offset);
        if (t1 <= t0 + 0.03) continue;
        const x0 = leftCorner.x + dx * t0;
        const yy0 = leftCorner.y + dy * t0;
        const x1 = leftCorner.x + dx * t1;
        const yy1 = leftCorner.y + dy * t1;
        bricks.push({
          pts: `${x0},${yy0 + y0} ${x1},${yy1 + y0} ${x1},${yy1 + y1} ${x0},${yy0 + y1}`,
          fill: (r + c) % 2 === 0 ? '#A49889' : '#8E8274',
          moss: r === 0 && c % 3 === 1,
        });
      }
    }
    return bricks;
  }, [bottomCorner.x, bottomCorner.y, leftCorner.x, leftCorner.y]);

  const cliffBricksRight = useMemo(() => {
    const bricks: Array<{ pts: string; fill: string }> = [];
    const rows = 2;
    const cols = 7;
    const dx = rightCorner.x - bottomCorner.x;
    const dy = rightCorner.y - bottomCorner.y;
    for (let r = 0; r < rows; r++) {
      const y0 = 18 + r * 20;
      const y1 = y0 + 18;
      const offset = r % 2 === 0 ? 0.05 : 0;
      for (let c = 0; c < cols; c++) {
        const t0 = Math.max(0.02, c / cols + offset);
        const t1 = Math.min(0.98, (c + 0.92) / cols + offset);
        if (t1 <= t0 + 0.03) continue;
        const x0 = bottomCorner.x + dx * t0;
        const yy0 = bottomCorner.y + dy * t0;
        const x1 = bottomCorner.x + dx * t1;
        const yy1 = bottomCorner.y + dy * t1;
        bricks.push({
          pts: `${x0},${yy0 + y0} ${x1},${yy1 + y0} ${x1},${yy1 + y1} ${x0},${yy0 + y1}`,
          fill: (r + c) % 2 === 0 ? '#84786B' : '#716559',
        });
      }
    }
    return bricks;
  }, [bottomCorner.x, bottomCorner.y, rightCorner.x, rightCorner.y]);

  // Wooden fence posts around the diorama edges
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

  const surfaceArrows = useMemo(() => {
    if (!selectedSquare) return [];
    const origin = squareToIso(selectedSquare, flipped);
    const arrows: Array<{ id: string; points: string; isCapture: boolean }> = [];

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

  // Bench coordinates outside the stone walls for captured enemy pieces!
  // Left outer grass bench: Enemy Dogs captured by White (Player 1)
  const leftBenchCoords = useMemo(
    () =>
      capturedByWhite.slice(0, 12).map((pieceType, idx) => {
        const row = Math.floor(idx / 6);
        const col = idx % 6;
        const t = 0.08 + col * 0.145;
        const x = leftCorner.x - 42 - row * 38 + (bottomCorner.x - leftCorner.x) * t;
        const y = leftCorner.y + 52 + row * 24 + (bottomCorner.y - leftCorner.y) * t;
        return { pieceType, x, y, key: `capw-${idx}-${pieceType}` };
      }),
    [capturedByWhite, bottomCorner.x, bottomCorner.y, leftCorner.x, leftCorner.y]
  );

  // Right outer grass bench: Enemy Cats captured by Black (Player 2)
  const rightBenchCoords = useMemo(
    () =>
      capturedByBlack.slice(0, 12).map((pieceType, idx) => {
        const row = Math.floor(idx / 6);
        const col = idx % 6;
        const t = 0.88 - col * 0.145;
        const x = bottomCorner.x + 42 + row * 38 + (rightCorner.x - bottomCorner.x) * t;
        const y = bottomCorner.y + 52 + row * 24 + (rightCorner.y - bottomCorner.y) * t;
        return { pieceType, x, y, key: `capb-${idx}-${pieceType}` };
      }),
    [capturedByBlack, bottomCorner.x, bottomCorner.y, rightCorner.x, rightCorner.y]
  );

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
          <filter id="island-shadow-blur" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
          <linearGradient id="tile-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9FE866" />
            <stop offset="100%" stopColor="#82CE4F" />
          </linearGradient>
          <linearGradient id="tile-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5AAE5D" />
            <stop offset="100%" stopColor="#468F4A" />
          </linearGradient>
          <radialGradient id="board-sunlight" cx="28%" cy="22%" r="72%">
            <stop offset="0%" stopColor="#FFF8C4" stopOpacity="0.24" />
            <stop offset="65%" stopColor="#FFF8C4" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#122B18" stopOpacity="0.14" />
          </radialGradient>
          <linearGradient id="cliff-left" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8A7158" />
            <stop offset="100%" stopColor="#5E4A38" />
          </linearGradient>
          <linearGradient id="cliff-right" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#695440" />
            <stop offset="100%" stopColor="#433427" />
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

        {/* 1. Deep Ground Drop Shadow beneath the raised 2.5D Garden Island Diorama */}
        <polygon
          points={`${topCorner.x},${topCorner.y + 42} ${rightCorner.x + 34},${rightCorner.y + 72} ${bottomCorner.x},${bottomCorner.y + 92} ${leftCorner.x - 34},${leftCorner.y + 72}`}
          fill="rgba(6, 18, 11, 0.62)"
          filter="url(#island-shadow-blur)"
        />

        {/* 2. Scattered Outer Garden Colorful Flowers */}
        <g className="pointer-events-none">
          <MiniFlower x={175} y={488} color="#FF8AB5" scale={1.1} />
          <MiniFlower x={238} y={534} color="#74C4FF" scale={1.05} />
          <MiniFlower x={312} y={576} color="#FFE97A" scale={1.1} />
          <MiniFlower x={392} y={606} color="#D29BFF" scale={1} />
          <MiniFlower x={742} y={570} color="#FF8AB5" scale={1.1} />
          <MiniFlower x={818} y={530} color="#FFE97A" scale={1.05} />
          <MiniFlower x={882} y={474} color="#74C4FF" scale={1.1} />
          <MiniFlower x={115} y={248} color="#FFE97A" />
          <MiniFlower x={922} y={240} color="#FF8AB5" />
        </g>

        {/* 3. Back Garden Scenery: Large Boulder, Lush Bushes & Back Wooden Fence */}
        <g className="pointer-events-none">
          <GardenBush
            x={466}
            y={72}
            scale={1.05}
            flowers={[
              { dx: -12, dy: -4, color: '#FF8AB5' },
              { dx: 12, dy: -8, color: '#FFE97A' },
            ]}
          />
          <GardenBush
            x={574}
            y={74}
            scale={0.92}
            flowers={[{ dx: -6, dy: -2, color: '#74C4FF' }]}
          />

          {/* Large Corner Garden Boulder with crack & moss */}
          <path
            d="M318 164 C312 130, 342 104, 376 110 C404 102, 428 124, 422 154 L398 170 L336 174 Z"
            fill="#9BA6AA"
            stroke="#1E1C1A"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M342 128 C354 118, 374 116, 390 122"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M366 135 L374 148 L368 160"
            fill="none"
            stroke="#566064"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M386 114 Q404 122 406 140 Q392 138 384 126 Z"
            fill="#5BB047"
            stroke="#1C331A"
            strokeWidth="1.6"
          />

          {/* Back-Left Wooden Fence */}
          <line
            x1={fenceBackLeft[0].x}
            y1={fenceBackLeft[0].y - 18}
            x2={fenceBackLeft[fenceBackLeft.length - 1].x}
            y2={fenceBackLeft[fenceBackLeft.length - 1].y - 18}
            stroke="#8B562C"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {fenceBackLeft.map((p, i) => (
            <WoodPost key={`fbl-${i}`} x={p.x} y={p.y} h={38} />
          ))}

          {/* Thick Back Stone Wall Edges with cracks & moss */}
          {backLeftStones.map((s, i) => (
            <StoneBlock
              key={`bls-${i}`}
              x={s.x}
              y={s.y}
              rx={19}
              ry={11}
              shade={s.shade}
              hasCrack={s.hasCrack}
              hasMoss={s.hasMoss}
            />
          ))}
          {backRightStones.map((s, i) => (
            <StoneBlock
              key={`brs-${i}`}
              x={s.x}
              y={s.y}
              rx={19}
              ry={11}
              shade={s.shade}
              hasCrack={s.hasCrack}
              hasMoss={s.hasMoss}
            />
          ))}

          {/* Left & Right Corner Lush Bushes with colorful blooms */}
          <GardenBush
            x={102}
            y={324}
            scale={1.06}
            flowers={[
              { dx: -14, dy: 2, color: '#FF8AB5' },
              { dx: 8, dy: -8, color: '#FFE97A' },
              { dx: 14, dy: 6, color: '#74C4FF' },
            ]}
          />
          <GardenBush
            x={938}
            y={322}
            scale={1.02}
            flowers={[
              { dx: -8, dy: -6, color: '#74C4FF' },
              { dx: 10, dy: 4, color: '#FF8AB5' },
            ]}
          />
        </g>

        {/* 4. DEEP 2.5D ISLAND DIORAMA CLIFF & BRICKWORK SIDES (Front-Left & Front-Right) */}
        <g className="pointer-events-none">
          {/* Front-Left Earth Cliff Face */}
          <polygon
            points={`${leftCorner.x},${leftCorner.y} ${bottomCorner.x},${bottomCorner.y} ${bottomCorner.x},${bottomCorner.y + slabDepth} ${leftCorner.x},${leftCorner.y + slabDepth}`}
            fill="url(#cliff-left)"
            stroke="#1E1813"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Front-Right Shaded Earth Cliff Face */}
          <polygon
            points={`${bottomCorner.x},${bottomCorner.y} ${rightCorner.x},${rightCorner.y} ${rightCorner.x},${rightCorner.y + slabDepth} ${bottomCorner.x},${bottomCorner.y + slabDepth}`}
            fill="url(#cliff-right)"
            stroke="#1E1813"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* 2.5D Retaining Brickwork along Left & Right Cliff Faces */}
          {cliffBricksLeft.map((b, i) => (
            <g key={`cbl-${i}`}>
              <polygon points={b.pts} fill={b.fill} stroke="#2B221B" strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          ))}
          {cliffBricksRight.map((b, i) => (
            <polygon
              key={`cbr-${i}`}
              points={b.pts}
              fill={b.fill}
              stroke="#241C16"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          ))}

          {/* Overhanging Green Grass Lip draping over the top of both cliff faces */}
          <polygon
            points={`${leftCorner.x},${leftCorner.y} ${bottomCorner.x},${bottomCorner.y} ${bottomCorner.x},${bottomCorner.y + 15} ${leftCorner.x},${leftCorner.y + 15}`}
            fill="#5EAE46"
            stroke="#1C331A"
            strokeWidth="2"
          />
          <polygon
            points={`${bottomCorner.x},${bottomCorner.y} ${rightCorner.x},${rightCorner.y} ${rightCorner.x},${rightCorner.y + 15} ${bottomCorner.x},${bottomCorner.y + 15}`}
            fill="#478C38"
            stroke="#1C331A"
            strokeWidth="2"
          />

          {/* Hanging Moss Tufts on the Island Cliff */}
          <path
            d={`M${leftCorner.x + 95} ${leftCorner.y + 52} Q${leftCorner.x + 112} ${leftCorner.y + 76} ${leftCorner.x + 128} ${leftCorner.y + 68} Z`}
            fill="#56A844"
            stroke="#1B3019"
            strokeWidth="1.6"
          />
          <path
            d={`M${leftCorner.x + 255} ${leftCorner.y + 135} Q${leftCorner.x + 272} ${leftCorner.y + 162} ${leftCorner.x + 292} ${leftCorner.y + 152} Z`}
            fill="#56A844"
            stroke="#1B3019"
            strokeWidth="1.6"
          />
          <path
            d={`M${bottomCorner.x + 145} ${bottomCorner.y - 60} Q${bottomCorner.x + 162} ${bottomCorner.y - 34} ${bottomCorner.x + 178} ${bottomCorner.y - 76} Z`}
            fill="#438736"
            stroke="#1B3019"
            strokeWidth="1.6"
          />
        </g>

        {/* 5. 8x8 ISOMETRIC GRASS CHESSBOARD TILES WITH FINE GRASS BLADES & WARM LIGHTING */}
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

                  {/* Fine Grass Blades & Tiny Clover Texture on Tiles */}
                  {(vr + vc) % 2 === 0 && (
                    <path
                      d={`M${center.x - 14} ${center.y + 3} L${center.x - 16} ${center.y - 2} M${center.x - 11} ${center.y + 4} L${center.x - 10} ${center.y - 1} M${center.x + 11} ${center.y - 2} L${center.x + 13} ${center.y - 7} M${center.x + 14} ${center.y - 1} L${center.x + 17} ${center.y - 5}`}
                      stroke={isLight ? '#6EB83E' : '#3A7B3D'}
                      strokeWidth="1.35"
                      strokeLinecap="round"
                      opacity="0.62"
                      className="pointer-events-none"
                    />
                  )}
                  {(vr * 3 + vc) % 5 === 0 && (
                    <circle
                      cx={center.x + 4}
                      cy={center.y + 7}
                      r="1.6"
                      fill={isLight ? '#FFF59D' : '#A5E887'}
                      opacity="0.65"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Last Move Warm Sunbeam Highlight */}
                  {(isLastFrom || isLastTo) && !isSelected && !legalInfo && (
                    <polygon
                      points={points}
                      fill="rgba(255, 241, 130, 0.34)"
                      stroke="rgba(255, 232, 95, 0.78)"
                      strokeWidth="1.7"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Skill Hint Highlight */}
                  {isHintSquare && !isSelected && (
                    <polygon
                      points={points}
                      fill="rgba(116, 242, 255, 0.44)"
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

                  {/* Legal Capture Target Tile: Glowing Neon Blue */}
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

                  {/* Checked King Tile */}
                  {isCheckedKing && (
                    <polygon
                      points={points}
                      fill="rgba(239, 68, 68, 0.72)"
                      stroke="#FFE066"
                      strokeWidth="3"
                      className="pointer-events-none animate-tile-glow"
                    />
                  )}

                  {/* Edge Coordinate Labels */}
                  {vr === 7 && (
                    <text
                      x={center.x - 16}
                      y={center.y + 15}
                      fontSize="11"
                      fontFamily="'Archivo Black', sans-serif"
                      fill="rgba(255, 250, 230, 0.88)"
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
                      fill="rgba(255, 250, 230, 0.88)"
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

          {/* Soft Warm Directional Sunlight Overlay across the entire grass board */}
          <polygon
            points={`${topCorner.x},${topCorner.y} ${rightCorner.x},${rightCorner.y} ${bottomCorner.x},${bottomCorner.y} ${leftCorner.x},${leftCorner.y}`}
            fill="url(#board-sunlight)"
            className="pointer-events-none"
          />
        </g>

        {/* 6. Glowing Surface Direction Arrows */}
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

        {/* 7. 2D FULL-BODY CHIBI STANDING SPRITES WITH LIVING IDLE BREATHING ANIMATION */}
        <g className="pointer-events-none">
          {sortedPieces.map((p) => {
            const isSelected = selectedSquare === p.sq;
            const isLastTo = lastMove?.to === p.sq;
            const isJumpingAttacker = attackJumpInfo?.targetSq === p.sq;
            const spriteW = 76;
            const spriteH = 88;

            const drawX = p.x - spriteW / 2;
            const drawY = p.y - spriteH + 13;

            // Deterministic staggered breathing delay so characters feel naturally alive
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

        {/* 8. Foreground Thick Stone Wall (Cracks + Moss), Mini Fences, Bushes & Flowers */}
        <g className="pointer-events-none">
          {frontLeftStones.map((s, i) => (
            <StoneBlock
              key={`fls-${i}`}
              x={s.x}
              y={s.y}
              rx={19}
              ry={11}
              shade={s.shade}
              hasCrack={s.hasCrack}
              hasMoss={s.hasMoss}
            />
          ))}
          {frontRightStones.map((s, i) => (
            <StoneBlock
              key={`frs-${i}`}
              x={s.x}
              y={s.y}
              rx={19}
              ry={11}
              shade={s.shade}
              hasCrack={s.hasCrack}
              hasMoss={s.hasMoss}
            />
          ))}

          {/* Front-Left Wooden Fence */}
          <line
            x1={fenceFrontLeft[0].x}
            y1={fenceFrontLeft[0].y - 16}
            x2={fenceFrontLeft[fenceFrontLeft.length - 1].x}
            y2={fenceFrontLeft[fenceFrontLeft.length - 1].y - 16}
            stroke="#8B562C"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {fenceFrontLeft.map((p, i) => (
            <WoodPost key={`ffl-${i}`} x={p.x} y={p.y} h={32} />
          ))}

          {/* Front-Right Wooden Fence */}
          <line
            x1={fenceFrontRight[0].x}
            y1={fenceFrontRight[0].y - 16}
            x2={fenceFrontRight[fenceFrontRight.length - 1].x}
            y2={fenceFrontRight[fenceFrontRight.length - 1].y - 16}
            stroke="#8B562C"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {fenceFrontRight.map((p, i) => (
            <WoodPost key={`ffr-${i}`} x={p.x} y={p.y} h={32} />
          ))}

          {/* Front Lush Bushes & Blooming Flowers */}
          <GardenBush
            x={578}
            y={590}
            scale={0.94}
            flowers={[
              { dx: -10, dy: -4, color: '#FFE97A' },
              { dx: 10, dy: 2, color: '#FF8AB5' },
            ]}
          />
          <GardenBush
            x={452}
            y={584}
            scale={0.68}
            flowers={[{ dx: 4, dy: -3, color: '#74C4FF' }]}
          />
        </g>

        {/* 9. CAPTURED PIECES SIDELINE BENCHES OUTSIDE THE STONE WALLS! */}
        {/* Left outer sideline: Enemy Dogs captured by Player 1 (Cat Kingdom) */}
        {leftBenchCoords.length > 0 && (
          <g className="pointer-events-none">
            {leftBenchCoords.map((item, idx) => (
              <g
                key={item.key}
                transform={`translate(${item.x - 24}, ${item.y - 44})`}
                opacity="0.95"
              >
                <g
                  className="animate-piece-idle"
                  style={{ animationDelay: `${(idx * 0.3).toFixed(2)}s` }}
                >
                  <svg width="48" height="56" viewBox="0 0 110 128" overflow="visible">
                    <AnimalPiece color="b" type={item.pieceType} showBadge={false} showShadow />
                  </svg>
                </g>
              </g>
            ))}
          </g>
        )}

        {/* Right outer sideline: Enemy Cats captured by Player 2 (Dog Guard) */}
        {rightBenchCoords.length > 0 && (
          <g className="pointer-events-none">
            {rightBenchCoords.map((item, idx) => (
              <g
                key={item.key}
                transform={`translate(${item.x - 24}, ${item.y - 44})`}
                opacity="0.95"
              >
                <g
                  className="animate-piece-idle"
                  style={{ animationDelay: `${(idx * 0.33).toFixed(2)}s` }}
                >
                  <svg width="48" height="56" viewBox="0 0 110 128" overflow="visible">
                    <AnimalPiece color="w" type={item.pieceType} showBadge={false} showShadow />
                  </svg>
                </g>
              </g>
            ))}
          </g>
        )}

        {/* 10. Floating "TAP UNTUK SERANG!" Speech Callout */}
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

        {/* 11. Comic Emote Speech Bubbles anchored above Kings */}
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

      {/* 12. HTML5 Canvas 1.2s Cinematic SLASH! Blue-Gold Energy VFX Overlay */}
      <SkillVfxCanvas event={vfxEvent} flipped={flipped} />
    </div>
  );
};
