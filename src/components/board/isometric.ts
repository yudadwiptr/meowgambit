import type { Square } from 'chess.js';

export type BoardView = 'iso' | 'flat';

// =========================================================================
// 1. 2.5D ISOMETRIC STAGE (/arena-bg.png — 2912 x 1440 -> 1456 x 720)
// =========================================================================
export const ARENA_NATIVE_W = 2912;
export const ARENA_NATIVE_H = 1440;
export const ARENA_W = 1456;
export const ARENA_H = 720;

// Fine-tuning offsets for 2.5D mode (in % of /arena-bg.png dimensions)
export const OFFSET_X = 0;
export const OFFSET_Y = 0;

// Calibrated 4 outer corners of the 8x8 grass board on /arena-bg.png (in %)
export const BOARD_CORNERS_PCT = {
  top: { x: 50.69, y: 14.1 },
  right: { x: 76.37, y: 44.86 },
  bottom: { x: 50.31, y: 77.08 },
  left: { x: 24.24, y: 44.86 },
};

const W_TOP = 1.025;
const W_SIDE = 1.0;
const W_BOT = 0.975;

// =========================================================================
// 2. 2D FLAT / TOP-DOWN STAGE (/arena-bg-flat.png — 2752 x 1536 -> 1376 x 768)
// =========================================================================
export const FLAT_NATIVE_W = 2752;
export const FLAT_NATIVE_H = 1536;
export const FLAT_STAGE_W = 1376;
export const FLAT_STAGE_H = 768;

// Fine-tuning offsets for RATA / Flat mode (in % of /arena-bg-flat.png dimensions)
export const FLAT_OFFSET_X = 0;
export const FLAT_OFFSET_Y = 0;

// Visually verified 64/64 exact 4 outer corners of the 8x8 grass board on /arena-bg-flat.png (in %)
export const FLAT_CORNERS_PCT = {
  tl: { x: 33.6, y: 20.1 }, // top-left corner (a8 outer corner)
  tr: { x: 66.4, y: 20.1 }, // top-right corner (h8 outer corner)
  bl: { x: 33.5, y: 78.7 }, // bottom-left corner (a1 outer corner)
  br: { x: 66.5, y: 78.7 }, // bottom-right corner (h1 outer corner)
};

export interface StageMetrics {
  w: number;
  h: number;
  nativeRatio: number;
  imageUrl: string;
}

export function getStageMetrics(view: BoardView): StageMetrics {
  if (view === 'flat') {
    return {
      w: FLAT_STAGE_W,
      h: FLAT_STAGE_H,
      nativeRatio: FLAT_NATIVE_W / FLAT_NATIVE_H,
      imageUrl: '/arena-bg-flat.png',
    };
  }
  return {
    w: ARENA_W,
    h: ARENA_H,
    nativeRatio: ARENA_NATIVE_W / ARENA_NATIVE_H,
    imageUrl: '/arena-bg.png',
  };
}

export interface BoardPoint {
  x: number;
  y: number;
  xPct: number;
  yPct: number;
}

/**
 * 4-Corner Bilinear Interpolation for 2.5D Isometric mode (/arena-bg.png).
 */
export function bilinearBoardPoint(rowNorm: number, colNorm: number): BoardPoint {
  const u = colNorm;
  const v = rowNorm;
  const { top, right, bottom, left } = BOARD_CORNERS_PCT;

  const ca = (1 - u) * (1 - v) * W_TOP;
  const cb = u * (1 - v) * W_SIDE;
  const cc = u * v * W_BOT;
  const cd = (1 - u) * v * W_SIDE;
  const sumW = ca + cb + cc + cd;

  const xPct = (ca * top.x + cb * right.x + cc * bottom.x + cd * left.x) / sumW + OFFSET_X;
  const yPct = (ca * top.y + cb * right.y + cc * bottom.y + cd * left.y) / sumW + OFFSET_Y;

  return {
    xPct,
    yPct,
    x: (xPct / 100) * ARENA_W,
    y: (yPct / 100) * ARENA_H,
  };
}

/**
 * 4-Corner Bilinear Interpolation for 2D Straight / Flat mode (/arena-bg-flat.png).
 */
export function flatBilinearPoint(rowNorm: number, colNorm: number): BoardPoint {
  const u = colNorm; // 0..1 left -> right
  const v = rowNorm; // 0..1 top -> bottom
  const { tl, tr, bl, br } = FLAT_CORNERS_PCT;

  const xPct =
    (1 - u) * (1 - v) * tl.x +
    u * (1 - v) * tr.x +
    u * v * br.x +
    (1 - u) * v * bl.x +
    FLAT_OFFSET_X;

  const yPct =
    (1 - u) * (1 - v) * tl.y +
    u * (1 - v) * tr.y +
    u * v * br.y +
    (1 - u) * v * bl.y +
    FLAT_OFFSET_Y;

  return {
    xPct,
    yPct,
    x: (xPct / 100) * FLAT_STAGE_W,
    y: (yPct / 100) * FLAT_STAGE_H,
  };
}

/**
 * Returns the 4 SVG <polygon> vertices for tile (vr, vc) in either 'iso' or 'flat' mode.
 */
export function boardTilePoints(vr: number, vc: number, view: BoardView): string {
  const fn = view === 'flat' ? flatBilinearPoint : bilinearBoardPoint;
  const p0 = fn(vr / 8, vc / 8);
  const p1 = fn(vr / 8, (vc + 1) / 8);
  const p2 = fn((vr + 1) / 8, (vc + 1) / 8);
  const p3 = fn((vr + 1) / 8, vc / 8);
  return `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;
}

/**
 * Exact center point of tile (vr + 0.5, vc + 0.5) in either 'iso' or 'flat' mode.
 */
export function boardGridCenter(vr: number, vc: number, view: BoardView): BoardPoint {
  return view === 'flat'
    ? flatBilinearPoint((vr + 0.5) / 8, (vc + 0.5) / 8)
    : bilinearBoardPoint((vr + 0.5) / 8, (vc + 0.5) / 8);
}

/**
 * Converts a chess algebraic square (e.g. 'e4') into visual indices & exact stage coordinates
 * for either 'iso' (/arena-bg.png) or 'flat' (/arena-bg-flat.png).
 */
export function squareToBoardPoint(
  sq: Square,
  flipped: boolean,
  view: BoardView = 'iso'
): { vr: number; vc: number; x: number; y: number; xPct: number; yPct: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10) - 1;
  const boardRow = 7 - rank;
  const boardCol = file;

  const vr = flipped ? 7 - boardRow : boardRow;
  const vc = flipped ? 7 - boardCol : boardCol;
  const pt = boardGridCenter(vr, vc, view);
  return { vr, vc, ...pt };
}
