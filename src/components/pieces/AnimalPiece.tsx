import React from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { useCharacterSprites, type SpriteKey } from '../../hooks/useCharacterSprites';

interface AnimalPieceProps {
  color: Color;
  type: PieceSymbol;
  className?: string;
  showBadge?: boolean;
  showShadow?: boolean;
}

const ROLE_LABELS: Record<PieceSymbol, string> = {
  p: 'P',
  n: 'N',
  b: 'B',
  r: 'R',
  q: 'Q',
  k: 'K',
};

/**
 * Renders the authentic 2.5D illustrated character sprites auto-sliced from
 * `/cats-spritesheet.jpg` (Cat Kingdom / White) and `/dogs-spritesheet.jpg` (Dog Guard / Black)
 * with soft oval ground shadow (`rgba(0,0,0,0.3)`) beneath the feet and optional role badge.
 */
export const AnimalPiece: React.FC<AnimalPieceProps> = React.memo(
  ({ color, type, className = 'w-full h-full', showBadge = false, showShadow = true }) => {
    const { sprites } = useCharacterSprites();
    const key: SpriteKey = `${color}-${type}`;
    const spriteSrc = sprites[key];
    const isCat = color === 'w';

    return (
      <div
        className={`relative flex items-end justify-center select-none pointer-events-none ${className}`}
        aria-label={`${isCat ? 'Cat Kingdom' : 'Dog Guard'} ${type.toUpperCase()}`}
      >
        {/* Soft oval shadow planted directly under the character's feet */}
        {showShadow && (
          <span
            className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[66%] h-[15%] rounded-full pointer-events-none"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.30)',
              filter: 'blur(1.2px)',
            }}
          />
        )}

        {/* Auto-sliced transparent 2.5D character sprite */}
        {spriteSrc ? (
          <img
            src={spriteSrc}
            alt={`${isCat ? 'Cat' : 'Dog'} ${type.toUpperCase()}`}
            draggable={false}
            className="relative z-10 w-full h-[94%] object-contain object-bottom mb-[6%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]"
          />
        ) : (
          /* Minimal subtle loading placeholder while offscreen canvas slices (~30ms) */
          <div
            className={`relative z-10 w-[56%] h-[56%] mb-[12%] rounded-full border-2 border-[#1F1A17] opacity-60 animate-pulse ${
              isCat ? 'bg-[#FFF5D6]' : 'bg-[#4A3B32]'
            }`}
          />
        )}

        {/* Optional role pill badge (shown when selected on board or in Codex) */}
        {showBadge && (
          <span
            className={`absolute bottom-[4%] right-[2%] z-20 w-[26%] aspect-square min-w-[16px] min-h-[16px] rounded-full border-[2px] border-[#1C1714] flex items-center justify-center font-display text-[9px] sm:text-[10px] leading-none shadow-sm ${
              isCat ? 'bg-[#FFF4C2] text-[#3A2610]' : 'bg-[#324252] text-[#FFE680]'
            }`}
          >
            {ROLE_LABELS[type]}
          </span>
        )}
      </div>
    );
  }
);

AnimalPiece.displayName = 'AnimalPiece';
