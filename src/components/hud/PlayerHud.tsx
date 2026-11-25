import React from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { Droplet, Heart } from 'lucide-react';
import type { TranslationPack } from '../../i18n/translations';
import { AnimalPiece } from '../pieces/AnimalPiece';

interface PlayerHudProps {
  color: Color;
  align: 'left' | 'right';
  label: string;
  sublabel: string;
  isActive: boolean;
  isThinking: boolean;
  isInCheck: boolean;
  hpPercent: number;
  energyPercent: number;
  score: number;
  capturedPieces: PieceSymbol[];
  t: TranslationPack;
}

/**
 * Casual Cartoon Mobile-First Player Profile Card (Top-Left for Cat Kingdom, Top-Right for Dog Guard).
 * Widened cleanly so "KERAJAAN KUCING" and "GARDA ANJING" always display in full without ellipsis truncation.
 */
export const PlayerHud: React.FC<PlayerHudProps> = ({
  color,
  align,
  label,
  sublabel,
  isActive,
  isThinking,
  isInCheck,
  hpPercent,
  energyPercent,
  score,
  capturedPieces,
  t,
}) => {
  const isCat = color === 'w';
  const isRight = align === 'right';
  const enemyColor: Color = isCat ? 'b' : 'w';

  return (
    <div
      className={`flex flex-col ${
        isRight ? 'items-end' : 'items-start'
      } gap-1 w-full sm:w-auto sm:min-w-[260px] sm:max-w-[330px]`}
    >
      {/* Main Glossy Profile Card */}
      <div
        className={`relative flex items-center gap-1.5 sm:gap-2.5 px-2 py-1.5 sm:px-3 sm:py-2 w-full transition-all ${
          isCat ? 'hud-card-blue' : 'hud-card-red'
        } ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${
          isActive ? 'ring-2 ring-[#FFE45E] brightness-105' : 'opacity-92'
        }`}
      >
        {/* Character Avatar Frame (King Sprite!) */}
        <div
          className={`shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-xl border-2 border-[#1F1A17] overflow-hidden flex items-center justify-center p-0.5 shadow-inner ${
            isCat
              ? 'bg-gradient-to-b from-[#DCEEFF] to-[#A6CEF2]'
              : 'bg-gradient-to-b from-[#F5D6CE] to-[#C48C7E]'
          }`}
        >
          <AnimalPiece color={color} type="k" showBadge={false} showShadow={false} className="w-full h-full" />
        </div>

        {/* Full Name (No Ellipsis!) + HP Bar + Energy Bar */}
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div
            className={`flex items-center gap-1 flex-wrap ${
              isRight ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="font-display text-[9.5px] sm:text-[13px] text-white cartoon-text-shadow whitespace-nowrap leading-none">
              {label}
            </span>
            <span className="hidden md:inline-block px-1.5 py-[1px] rounded-full bg-black/35 text-[9px] font-bold text-[#FFE885] uppercase leading-tight whitespace-nowrap shrink-0">
              {sublabel}
            </span>
          </div>

          {/* HP Bar (Green) */}
          <div className={`flex items-center gap-1 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
            <Heart className="w-3 h-3 text-[#FF5E6C] fill-[#FF5E6C] shrink-0 drop-shadow-[0_1px_0_#1a1412]" />
            <div className="flex-1 h-2.5 sm:h-3 rounded-full bg-[#1C2329] border border-black/80 overflow-hidden p-[1px]">
              <div
                className="h-full rounded-full bg-gradient-to-b from-[#98F55B] to-[#45B82C] transition-all duration-300"
                style={{ width: `${Math.max(8, Math.min(100, hpPercent))}%` }}
              />
            </div>
          </div>

          {/* Energy / Skill Bar (Blue) */}
          <div className={`flex items-center gap-1 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
            <Droplet className="w-3 h-3 text-[#4CE8FF] fill-[#4CE8FF] shrink-0 drop-shadow-[0_1px_0_#1a1412]" />
            <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-[#1C2329] border border-black/80 overflow-hidden p-[1px]">
              <div
                className="h-full rounded-full bg-gradient-to-b from-[#78F0FF] to-[#1FA6E8] transition-all duration-300"
                style={{ width: `${Math.max(12, Math.min(100, energyPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Floating Status Pill (CHECK! or THINKING...) */}
        {(isInCheck || isThinking) && (
          <span
            className={`absolute -bottom-2.5 ${
              isRight ? 'left-2' : 'right-2'
            } px-2 py-0.5 rounded-full text-[9px] font-display uppercase border border-black/80 shadow-md animate-pulse whitespace-nowrap ${
              isInCheck ? 'bg-[#EF4444] text-white' : 'bg-[#FFE259] text-[#2B1B04]'
            }`}
          >
            {isInCheck ? t.checkBadge : t.thinkingBadge}
          </span>
        )}
      </div>

      {/* Piece Score & Captured Mini Strip underneath */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#162B1F]/80 border border-white/15 shadow-sm ${
          isRight ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div className="flex items-center gap-1">
          <span
            className={`inline-block w-2.5 h-3 rounded-t-[2px] border border-black/80 ${
              isCat ? 'bg-[#FFF5D6]' : 'bg-[#8F6544]'
            }`}
          />
          <span className="font-display text-xs text-white cartoon-text-shadow leading-none">
            {score}
          </span>
        </div>

        {capturedPieces.length > 0 && (
          <div className="hidden sm:flex items-center -space-x-1.5 pl-1 border-l border-white/15">
            {capturedPieces.slice(0, 6).map((pt, idx) => (
              <div key={`${pt}-${idx}`} className="w-4 h-4">
                <AnimalPiece color={enemyColor} type={pt} showBadge={false} showShadow={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
