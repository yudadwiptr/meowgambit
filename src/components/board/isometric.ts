import type { Square } from 'chess.js';

export type BoardView = 'iso' | 'flat';

// Exact 0.5x coordinate space of public/arena-bg.png (2912 x 1440 -> 1456 x 720)
export const ARENA_W = 1456;
export const ARENA_H = 720;

// Calibrated 4 corners of the 8x8 grass chessboard inside arena-bg.png (1456x720 space)
const ARENA_T = { x: 738.0, y: 101.5 };
const ARENA_R = { x: 1112.0, y: 323.0 };
const ARENA_B = { x: 732.5, y: 555.0 };
const ARENA_L = { x: 353.0, y: 323.0 };

// Homogeneous projective weights calibrated on arena-bg.png (64/64 exact lock)
const W_TOP = 1.025;
const W_SIDE = 1.0;
const W_BOT = 0.975;

// Straight / Flat 8x8 Garden Board geometry centered inside the same 1456x720 space
export const FLAT_TILE = 66; // 8 * 66 = 528px square
export const FLAT_ORIGIN_X = ARENA_W / 2 - FLAT_TILE * 4; // 464
export const FLAT_ORIGIN_Y = 98; // 98..626 (leaves clean room for top timer!)

export interface BoardPoint {
  x: number;
  y: number;
}

/**
 * Projective mapping from normalized board coordinates (u: 0..1 Top->Right, v: 0..1 Top->Left)
 * onto the exact pixel location on public/arena-bg.png (1456x720 coordinate system).
 */
export function arenaProject(u: number, v: number): BoardPoint {
  const ca = (1 - u) * (1 - v) * W_TOP;
  const cb = u * (1 - v) * W_SIDE;
  const cc = u * v * W_BOT;
  const cd = (1 - u) * v * W_SIDE;
  const sumW = ca + cb + cc + cd;
  return {
    x: (ca * ARENA_T.x + cb * ARENA_R.x + cc * ARENA_B.x + cd * ARENA_L.x) / sumW,
    y: (ca * ARENA_T.y + cb * ARENA_R.y + cc * ARENA_B.y + cd * ARENA_L.y) / sumW,
  };
}

/**
 * Returns the exact 4 polygon corners [top, right, bottom, left] for isometric tile (vr, vc) on arena-bg.png.
 * vr: 0..7 (from back-right rank 8 toward front-left rank 1)
 * vc: 0..7 (from back-left file a toward front-right file h)
 */
export function isoTilePoints(vr: number, vc: number): string {
  const u0 = vc / 8;
  const u1 = (vc + 1) / 8;
  const v0 = vr / 8;
  const v1 = (vr + 1) / 8;
  const pTop = arenaProject(u0, v0);
  const pRight = arenaProject(u1, v0);
  const pBot = arenaProject(u1, v1);
  const pLeft = arenaProject(u0, v1);
  return `${pTop.x.toFixed(1)},${pTop.y.toFixed(1)} ${pRight.x.toFixed(1)},${pRight.y.toFixed(1)} ${pBot.x.toFixed(1)},${pBot.y.toFixed(1)} ${pLeft.x.toFixed(1)},${pLeft.y.toFixed(1)}`;
}

/**
 * Exact center point of isometric tile (vr, vc) on arena-bg.png.
 */
export function isoGridCenter(vr: number, vc: number): BoardPoint {
  return arenaProject((vc + 0.5) / 8, (vr + 0.5) / 8);
}

/**
 * Exact center point of Straight/Flat board tile (vr, vc).
 */
export function flatGridCenter(vr: number, vc: number): BoardPoint {
  return {
    x: FLAT_ORIGIN_X + (vc + 0.5) * FLAT_TILE,
    y: FLAT_ORIGIN_Y + (vr + 0.5) * FLAT_TILE,
  };
}

/**
 * Converts chess algebraic square (e.g. 'e4') into visual indices & exact board coordinate
 * for either 'iso' (matched to /arena-bg.png) or 'flat' view.
 */
export function squareToBoardPoint(
  sq: Square,
  flipped: boolean,
  view: BoardView = 'iso'
): { vr: number; vc: number; x: number; y: number } {
  const file = sq.charCodeAt(0) - 97; // 0..7 ('a'..'h')
  const rank = parseInt(sq[1], 10) - 1; // 0..7 ('1'..'8')
  const boardRow = 7 - rank; // 0 = rank 8 (Black), 7 = rank 1 (White)
  const boardCol = file; // 0 = file a, 7 = file h

  const vr = flipped ? 7 - boardRow : boardRow;
  const vc = flipped ? 7 - boardCol : boardCol;
  const pt = view === 'flat' ? flatGridCenter(vr, vc) : isoGridCenter(vr, vc);
  return { vr, vc, x: pt.x, y: pt.y };
}

/**
 * Computes exact CSS `background-size: cover; background-position: center` / SVG `xMidYMid slice`
 * scale & offset transform for mapping 1456x720 arena coordinates onto any viewport size.
 */
export function computeCoverTransform(viewportW: number, viewportH: number, mode: 'slice' | 'meet') {
  const scale =
    mode === 'slice'
      ? Math.max(viewportW / ARENA_W, viewportH / ARENA_H)
      : Math.min(viewportW / ARENA_W, viewportH / ARENA_H);
  const offsetX = (viewportW - ARENA_W * scale) / 2;
  const offsetY = (viewportH - ARENA_H * scale) / 2;
  return { scale, offsetX, offsetY };
}
