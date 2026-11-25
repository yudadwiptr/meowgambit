import React from 'react';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import type { GameOutcome } from '../../types/game';
import type { TranslationPack } from '../../i18n/translations';
import { AnimalPiece } from '../pieces/AnimalPiece';

interface GameOverModalProps {
  outcome: GameOutcome;
  totalMoves: number;
  t: TranslationPack;
  onRematch: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  outcome,
  totalMoves,
  t,
  onRematch,
  onMainMenu,
}) => {
  const isDraw = outcome.winner === 'draw';
  const headerGrad = isDraw
    ? 'from-[#FFE259] to-[#E89B24]'
    : outcome.winner === 'w'
      ? 'from-[#5DA9E9] to-[#2B669E]'
      : 'from-[#D95B4E] to-[#962D25]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="casual-panel w-full max-w-sm overflow-hidden">
        {/* Glossy Cartoon Banner */}
        <div
          className={`bg-gradient-to-b ${headerGrad} border-b-[3px] border-[#4A3525] p-4 text-center`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/35 text-[#FFF4B8] font-display text-[11px] uppercase mb-2">
            <Trophy className="w-3.5 h-3.5 text-[#FFE259]" />
            {t.matchOverBadge}
          </div>
          <h2 className="font-display text-3xl uppercase tracking-tight text-white cartoon-text-shadow leading-none">
            {outcome.headline}
          </h2>
          <p className="mt-2 font-bold text-xs sm:text-sm text-white/95 drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]">
            {outcome.subline}
          </p>
        </div>

        {/* Mascot Showcase & Stats */}
        <div className="p-4 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            {outcome.winner === 'draw' ? (
              <>
                <div className="w-20 h-24 rounded-2xl bg-[#DDF2CC] border-2 border-[#4A3525] p-1 flex items-center justify-center shadow-inner">
                  <AnimalPiece color="w" type="k" showBadge={false} />
                </div>
                <span className="font-display text-xl text-[#4A3525]">VS</span>
                <div className="w-20 h-24 rounded-2xl bg-[#E8D5C4] border-2 border-[#4A3525] p-1 flex items-center justify-center shadow-inner">
                  <AnimalPiece color="b" type="k" showBadge={false} />
                </div>
              </>
            ) : (
              <div
                className={`w-24 h-28 rounded-2xl border-2 border-[#4A3525] p-1.5 flex items-center justify-center shadow-inner ${
                  outcome.winner === 'w' ? 'bg-[#DDF2CC]' : 'bg-[#F0D5CE]'
                }`}
              >
                <AnimalPiece color={outcome.winner} type="k" showBadge={false} />
              </div>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-2xl border-2 border-[#CBB594] bg-[#F3E9D4] p-2">
              <div className="text-[10px] font-bold uppercase text-[#6B543E]">{t.totalPlies}</div>
              <div className="font-display text-xl text-[#2F2217]">{totalMoves}</div>
            </div>
            <div className="rounded-2xl border-2 border-[#CBB594] bg-[#FFF2C2] p-2">
              <div className="text-[10px] font-bold uppercase text-[#6B543E]">{t.resultLabel}</div>
              <div className="font-display text-base uppercase text-[#2F2217]">
                {isDraw ? t.drawShort : outcome.winner === 'w' ? t.catsWinShort : t.dogsWinShort}
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRematch}
              className="casual-btn casual-btn-green font-display text-sm uppercase py-3 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              {t.rematchBtn}
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="casual-btn casual-btn-amber font-display text-sm uppercase py-3 flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              {t.menuBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
