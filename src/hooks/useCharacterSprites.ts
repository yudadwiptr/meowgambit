import { useEffect, useState } from 'react';
import type { Color, PieceSymbol } from 'chess.js';

export type SpriteKey = `${Color}-${PieceSymbol}`;
export type SpriteMap = Partial<Record<SpriteKey, string>>;

// 2 rows x 3 columns grid mapping for both cats-spritesheet and dogs-spritesheet:
// [0,0] Pawn, [0,1] Rook, [0,2] Knight
// [1,0] Bishop, [1,1] Queen, [1,2] King
const GRID_ORDER: Array<{ row: number; col: number; type: PieceSymbol }> = [
  { row: 0, col: 0, type: 'p' },
  { row: 0, col: 1, type: 'r' },
  { row: 0, col: 2, type: 'n' },
  { row: 1, col: 0, type: 'b' },
  { row: 1, col: 1, type: 'q' },
  { row: 1, col: 2, type: 'k' },
];

function loadImageWithFallback(urls: string[]): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let idx = 0;
    const tryNext = () => {
      if (idx >= urls.length) {
        reject(new Error(`Failed to load spritesheet: ${urls.join(', ')}`));
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        idx += 1;
        tryNext();
      };
      img.src = urls[idx];
    };
    tryNext();
  });
}

/**
 * Slices one cell (2x3 grid), runs iterative BFS flood-fill transparency from all 4 outer
 * edges to remove near-white background pixels without touching interior white fur/eyes,
 * applies 1px anti-alias fringe softening, tight-trims transparent padding, and exports PNG dataURL.
 */
function sliceAndCleanCell(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): string {
  const cw = Math.max(1, Math.floor(sw));
  const ch = Math.max(1, Math.floor(sh));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  const imageData = ctx.getImageData(0, 0, cw, ch);
  const data = imageData.data;

  const total = cw * ch;
  const visited = new Uint8Array(total);
  const removed = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBgWhite = (pIdx: number): boolean => {
    const o = pIdx * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
    const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
    // Pure or near-white background with low saturation (keeps dark outlines & character interiors safe)
    return minC >= 224 && maxC - minC <= 26;
  };

  const enqueueIfBg = (x: number, y: number) => {
    const p = y * cw + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isBgWhite(p)) {
      queue[tail++] = p;
    }
  };

  // Seed flood-fill from all 4 outer borders of the cell
  for (let x = 0; x < cw; x++) {
    enqueueIfBg(x, 0);
    enqueueIfBg(x, ch - 1);
  }
  for (let y = 1; y < ch - 1; y++) {
    enqueueIfBg(0, y);
    enqueueIfBg(cw - 1, y);
  }

  // Iterative 4-connected BFS flood fill
  while (head < tail) {
    const p = queue[head++];
    removed[p] = 1;
    data[p * 4 + 3] = 0;

    const x = p % cw;
    const y = (p - x) / cw;

    if (x > 0) enqueueIfBg(x - 1, y);
    if (x < cw - 1) enqueueIfBg(x + 1, y);
    if (y > 0) enqueueIfBg(x, y - 1);
    if (y < ch - 1) enqueueIfBg(x, y + 1);
  }

  // 1-pass soft anti-alias defringing for bright white edge pixels directly touching removed BG
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const p = y * cw + x;
      if (removed[p]) continue;
      if (
        !removed[p - 1] &&
        !removed[p + 1] &&
        !removed[p - cw] &&
        !removed[p + cw]
      ) {
        continue;
      }
      const o = p * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const lum = (r + g + b) / 3;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      if (lum > 195 && maxC - minC <= 28) {
        const nextAlpha = Math.max(0, Math.min(255, Math.round(((236 - lum) / 41) * 255)));
        data[o + 3] = nextAlpha;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Tight-trim excess transparent padding around the sprite
  let minX = cw;
  let minY = ch;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return canvas.toDataURL('image/png');
  }

  const pad = 4;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(cw - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(ch - cropY, maxY - minY + 1 + pad * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = cropW;
  trimmed.height = cropH;
  const tCtx = trimmed.getContext('2d');
  if (!tCtx) return canvas.toDataURL('image/png');

  tCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimmed.toDataURL('image/png');
}

async function sliceSheetForFaction(color: Color, urls: string[]): Promise<SpriteMap> {
  const img = await loadImageWithFallback(urls);
  const cellW = img.naturalWidth / 3;
  const cellH = img.naturalHeight / 2;
  const result: SpriteMap = {};

  for (const slot of GRID_ORDER) {
    const key: SpriteKey = `${color}-${slot.type}`;
    result[key] = sliceAndCleanCell(img, slot.col * cellW, slot.row * cellH, cellW, cellH);
  }
  return result;
}

// Module-level singleton cache so spritesheets are sliced only ONCE per session
let cachedSprites: SpriteMap | null = null;
let loadPromise: Promise<SpriteMap> | null = null;

function ensureSpritesLoaded(): Promise<SpriteMap> {
  if (cachedSprites) return Promise.resolve(cachedSprites);
  if (!loadPromise) {
    loadPromise = Promise.all([
      sliceSheetForFaction('w', ['/cats-spritesheet.jpg', '/cats-spritesheet.png']),
      sliceSheetForFaction('b', ['/dogs-spritesheet.jpg', '/dogs-spritesheet.png']),
    ])
      .then(([cats, dogs]) => {
        cachedSprites = { ...cats, ...dogs };
        return cachedSprites;
      })
      .catch(() => {
        loadPromise = null;
        return {};
      });
  }
  return loadPromise;
}

/**
 * React hook returning the 12 auto-sliced, background-removed 2.5D character sprites
 * keyed by `${color}-${pieceType}` (e.g. 'w-k', 'b-n', 'w-p').
 */
export function useCharacterSprites(): { sprites: SpriteMap; ready: boolean } {
  const [sprites, setSprites] = useState<SpriteMap>(() => cachedSprites ?? {});
  const [ready, setReady] = useState<boolean>(() => Boolean(cachedSprites));

  useEffect(() => {
    if (cachedSprites) {
      setSprites(cachedSprites);
      setReady(true);
      return;
    }
    let mounted = true;
    ensureSpritesLoaded().then((map) => {
      if (!mounted) return;
      setSprites(map);
      setReady(Object.keys(map).length > 0);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { sprites, ready };
}
