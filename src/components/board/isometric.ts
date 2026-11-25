import type { Square } from 'chess.js';

export type BoardView = 'iso' | 'flat';

// Exact native pixel ratio of public/arena-bg.png (2912 x 1440 -> 1456 x 720 SVG/Canvas units)
export const ARENA_NATIVE_W = 2912;
export const ARENA_NATIVE_H = 1440;
export const ARENA_W = 1456;
export const ARENA_H = 720;

// =========================================================================
// FINE-TUNING CALIBRATION OFFSETS (in % of arena-bg.png dimensions)
// Adjust these by ±0.1 .. ±0.5 if you ever swap arena-bg.png!
// =========================================================================
export const OFFSET_X = 0; // horizontal fine-tune (% of image width)
export const OFFSET_Y = 0; // vertical fine-tune (% of image height)

// =========================================================================
// 4 OUTER CORNERS OF THE 8x8 GRASS BOARD ON /arena-bg.png (in %: 0..100)
// Visually verified 64/64 exact lock against public/arena-bg.png (2912x1440)
// =========================================================================
export const BOARD_CORNERS_PCT = {
  top: { x: 50.69, y: 14.1 }, // top corner (a8/h8 apex)
  right: { x: 76.37, y: 44.86 }, // right corner
  bottom: { x: 50.31, y: 77.08 }, // bottom corner (h1/a1 apex)
  left: { x: 24.24, y: 44.86 }, // left corner
};

// Mild perspective weight so back tiles are slightly foreshortened vs front tiles
const W_TOP = 1.025;
const W_SIDE = 1.0;
const W_BOT = 0.975;

// Straight / Flat 8x8 Garden Board geometry centered inside the same 1456x720 stage
export const FLAT_TILE = 66; // 8 * 66 = 528px square
export const FLAT_ORIGIN_X = ARENA_W / 2 - FLAT_TILE * 4; // 464
export const FLAT_ORIGIN_Y = 98; // 98..626

export interface BoardPoint {
  x: number; // in 0..1456 SVG/Canvas coordinate space
  y: number; // in 0..720 SVG/Canvas coordinate space
  xPct: number; // in 0..100% of stage container width
  yPct: number; // in 0..100% of stage container height
}

/**
 * 4-Corner Bilinear Interpolation (with mild projective foreshortening)
 * mapping normalized grid coordinates (rowNorm: 0..1 Top->Left, colNorm: 0..1 Top->Right)
 * into both exact percentage coordinates (xPct, yPct) and 1456x720 SVG/Canvas units.
 */
export function bilinearBoardPoint(rowNorm: number, colNorm: number): BoardPoint {
  const u = colNorm; // 0..1 along Top -> Right
  const v = rowNorm; // 0..1 along Top -> Left

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
 * Returns the 4 SVG polygon vertices [top, right, bottom, left] for isometric tile (vr, vc).
 */
export function isoTilePoints(vr: number, vc: number): string {
  const pTop = bilinearBoardPoint(vr / 8, vc / 8);
  const pRight = bilinearBoardPoint(vr / 8, (vc + 1) / 8);
  const pBot = bilinearBoardPoint((vr + 1) / 8, (vc + 1) / 8);
  const pLeft = bilinearBoardPoint((vr + 1) / 8, vc / 8);
  return `${pTop.x.toFixed(1)},${pTop.y.toFixed(1)} ${pRight.x.toFixed(1)},${pRight.y.toFixed(1)} ${pBot.x.toFixed(1)},${pBot.y.toFixed(1)} ${pLeft.x.toFixed(1)},${pLeft.y.toFixed(1)}`;
}

/**
 * Exact center point of isometric tile (vr + 0.5, vc + 0.5) on /arena-bg.png.
 */
export function isoGridCenter(vr: number, vc: number): BoardPoint {
  return bilinearBoardPoint((vr + 0.5) / 8, (vc + 0.5) / 8);
}

/**
 * Exact center point of Straight/Flat board tile (vr, vc).
 */
export function flatGridCenter(vr: number, vc: number): BoardPoint {
  const x = FLAT_ORIGIN_X + (vc + 0.5) * FLAT_TILE;
  const y = FLAT_ORIGIN_Y + (vr + 0.5) * FLAT_TILE;
  return {
    x,
    y,
    xPct: (x / ARENA_W) * 100,
    yPct: (y / ARENA_H) * 100,
  };
}

/**
 * Converts a chess algebraic square (e.g. 'e4') into visual grid indices & exact stage coordinates
 * for either 'iso' (matched to /arena-bg.png) or 'flat' view.
 */
export function squareToBoardPoint(
  sq: Square,
  flipped: boolean,
  view: BoardView = 'iso'
): { vr: number; vc: number; x: number; y: number; xPct: number; yPct: number } {
  const file = sq.charCodeAt(0) - 97; // 0..7 ('a'..'h')
  const rank = parseInt(sq[1], 10) - 1; // 0..7 ('1'..'8')
  const boardRow = 7 - rank; // 0 = rank 8 (Black), 7 = rank 1 (White)
  const boardCol = file; // 0 = file a, 7 = file h

  const vr = flipped ? 7 - boardRow : boardRow;
  const vc = flipped ? 7 - boardCol : boardCol;
  const pt = view === 'flat' ? flatGridCenter(vr, vc) : isoGridCenter(vr, vc);
  return { vr, vc, ...pt };
}
