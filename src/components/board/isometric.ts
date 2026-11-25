import type { Square } from 'chess.js';

export type BoardView = 'iso' | 'flat';

export const ISO_VIEW_W = 1040;
export const ISO_VIEW_H = 650;
export const ISO_CX = 520;
export const ISO_TOP_Y = 108;
export const ISO_TW = 49; // half tile width
export const ISO_TH = 25.5; // half tile height

// Straight / Flat Garden Board geometry inside the exact same 1040x650 canvas!
export const FLAT_TILE = 62; // 8 * 62 = 496px square board
export const FLAT_ORIGIN_X = ISO_CX - FLAT_TILE * 4; // 272
export const FLAT_ORIGIN_Y = 66; // 66..562 (+ 26px 3D stone ledge underneath!)

export interface IsoPoint {
  x: number;
  y: number;
}

/**
 * Converts visual grid coordinates (vr: 0..7, vc: 0..7)
 * into SVG/Canvas isometric diamond center coordinates.
 */
export function isoGridCenter(vr: number, vc: number): IsoPoint {
  return {
    x: ISO_CX + (vc - vr) * ISO_TW,
    y: ISO_TOP_Y + (vc + vr + 1) * ISO_TH,
  };
}

/**
 * Returns the 4 diamond vertices [top, right, bottom, left] for an isometric tile (vr, vc).
 */
export function isoTilePoints(vr: number, vc: number): string {
  const { x, y } = isoGridCenter(vr, vc);
  return `${x},${y - ISO_TH} ${x + ISO_TW},${y} ${x},${y + ISO_TH} ${x - ISO_TW},${y}`;
}

/**
 * Converts visual grid coordinates (vr: 0..7 top->bottom, vc: 0..7 left->right)
 * into Straight/Flat board center coordinates.
 */
export function flatGridCenter(vr: number, vc: number): IsoPoint {
  return {
    x: FLAT_ORIGIN_X + (vc + 0.5) * FLAT_TILE,
    y: FLAT_ORIGIN_Y + (vr + 0.5) * FLAT_TILE,
  };
}

/**
 * Converts a chess algebraic square (e.g. 'e4') into visual grid indices (vr, vc)
 * and exact center point for the active boardView ('iso' or 'flat').
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

/** Backwards-compatible alias for isometric projection */
export function squareToIso(sq: Square, flipped: boolean) {
  return squareToBoardPoint(sq, flipped, 'iso');
}
