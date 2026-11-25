import type { Square } from 'chess.js';

export const ISO_VIEW_W = 1040;
export const ISO_VIEW_H = 650;
export const ISO_CX = 520;
export const ISO_TOP_Y = 108;
export const ISO_TW = 49; // half tile width
export const ISO_TH = 25.5; // half tile height

export interface IsoPoint {
  x: number;
  y: number;
}

/**
 * Converts visual grid coordinates (vr: 0..7 back-right to front-left, vc: 0..7 back-left to front-right)
 * into SVG/Canvas isometric diamond center coordinates.
 */
export function isoGridCenter(vr: number, vc: number): IsoPoint {
  return {
    x: ISO_CX + (vc - vr) * ISO_TW,
    y: ISO_TOP_Y + (vc + vr + 1) * ISO_TH,
  };
}

/**
 * Returns the 4 diamond vertices [top, right, bottom, left] for a visual tile (vr, vc).
 */
export function isoTilePoints(vr: number, vc: number): string {
  const { x, y } = isoGridCenter(vr, vc);
  return `${x},${y - ISO_TH} ${x + ISO_TW},${y} ${x},${y + ISO_TH} ${x - ISO_TW},${y}`;
}

/**
 * Converts a chess algebraic square (e.g. 'e4') into visual grid indices (vr, vc)
 * and exact isometric center point, respecting board flip orientation.
 * Default (not flipped): White (ranks 1-2) sits along front-left edge, Black (ranks 7-8) along back-right.
 */
export function squareToIso(sq: Square, flipped: boolean): { vr: number; vc: number; x: number; y: number } {
  const file = sq.charCodeAt(0) - 97; // 0..7 ('a'..'h')
  const rank = parseInt(sq[1], 10) - 1; // 0..7 ('1'..'8')
  const boardRow = 7 - rank; // 0 = rank 8 (Black), 7 = rank 1 (White)
  const boardCol = file; // 0 = file a, 7 = file h

  const vr = flipped ? 7 - boardRow : boardRow;
  const vc = flipped ? 7 - boardCol : boardCol;
  const pt = isoGridCenter(vr, vc);
  return { vr, vc, x: pt.x, y: pt.y };
}
