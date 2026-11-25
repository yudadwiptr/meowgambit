import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { TranslationPack } from '../../i18n/translations';
import { ALL_ROSTER_LIST } from '../../data/roster';
import { AnimalPiece } from '../pieces/AnimalPiece';

interface RosterModalProps {
  t: TranslationPack;
  onClose: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({ t, onClose }) => {
  const [tab, setTab] = useState<'w' | 'b'>('w');
  const filtered = ALL_ROSTER_LIST.filter((item) => item.color === tab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm">
      <div className="casual-panel w-full max-w-xl max-h-[88dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#FFE259] to-[#F2A624] border-b-[3px] border-[#4A3525] px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3A2408]" />
            <h2 className="font-display text-lg sm:text-xl uppercase tracking-tight text-[#2E1B05]">
              {t.codexTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="casual-btn casual-btn-red p-1.5"
            aria-label="Close Roster"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Faction Tabs */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#EBDDC3] border-b-2 border-[#CBB594]">
          <button
            type="button"
            onClick={() => setTab('w')}
            className={`casual-btn py-2 font-display text-xs sm:text-sm uppercase ${
              tab === 'w' ? 'casual-btn-blue' : 'casual-btn-cream opacity-75'
            }`}
          >
            {t.codexCatTab}
          </button>
          <button
            type="button"
            onClick={() => setTab('b')}
            className={`casual-btn py-2 font-display text-xs sm:text-sm uppercase ${
              tab === 'b' ? 'casual-btn-red' : 'casual-btn-cream opacity-75'
            }`}
          >
            {t.codexDogTab}
          </button>
        </div>

        {/* Roster Grid */}
        <div className="p-3 sm:p-4 overflow-y-auto casual-scroll grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filtered.map((unit) => {
            const localized = t.pieces[`${unit.color}-${unit.type}`];
            return (
              <div
                key={`${unit.color}-${unit.type}`}
                className="rounded-2xl border-2 border-[#C7B393] bg-[#FFFDF7] p-2.5 flex items-center gap-3 shadow-sm"
              >
                <div
                  className={`w-16 h-20 shrink-0 rounded-xl border-2 border-[#594433] p-1 flex items-center justify-center ${
                    unit.color === 'w' ? 'bg-[#DFF2CF]' : 'bg-[#E9D7C9]'
                  }`}
                >
                  <AnimalPiece color={unit.color} type={unit.type} showBadge />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xs uppercase leading-tight text-[#2F2217]">
                    {localized.name}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#FFE885] border border-[#8A6118] text-[10px] font-display uppercase text-[#3A2408] leading-none">
                      {localized.skillName}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-[#5C4938]">
                    {localized.skillDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t-2 border-[#CBB594] bg-[#E5F2D6] px-4 py-2 text-[11px] font-bold uppercase text-center text-[#294D28]">
          {t.codexFooter}
        </div>
      </div>
    </div>
  );
};
