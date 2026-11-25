import React from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { Sparkles } from 'lucide-react';
import type { TranslationPack } from '../../i18n/translations';
import { AnimalPiece } from '../pieces/AnimalPiece';

interface PromotionModalProps {
  color: Color;
  t: TranslationPack;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

const PROMO_OPTIONS: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  t,
  onSelect,
  onCancel,
}) => {
  const isCat = color === 'w';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="casual-panel w-full max-w-sm p-4">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b-2 border-[#D9C7A8]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-b from-[#FFE259] to-[#F5A623] border-2 border-[#4A3525]">
              <Sparkles className="w-4 h-4 text-[#361D04]" />
            </span>
            <div>
              <h2 className="font-display text-lg uppercase leading-none text-[#2F2217]">
                {t.promoteTitle}
              </h2>
              <p className="text-xs font-bold uppercase text-[#6B543E]">
                {isCat ? t.promoteCatSub : t.promoteDogSub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="casual-btn casual-btn-red font-display text-xs px-2.5 py-1"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {PROMO_OPTIONS.map((pType) => {
            const localized = t.pieces[`${color}-${pType as PieceSymbol}`];
            return (
              <button
                key={pType}
                type="button"
                onClick={() => onSelect(pType)}
                className="casual-btn casual-btn-cream hover:brightness-105 p-2.5 flex flex-col items-center gap-1 text-center"
              >
                <div className="w-16 h-20">
                  <AnimalPiece color={color} type={pType} />
                </div>
                <div className="font-display text-xs uppercase leading-tight text-[#2F2217]">
                  {localized.name}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#E3F5D3] border border-[#4D9448] text-[10px] font-bold uppercase text-[#245222]">
                  {localized.skillName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
