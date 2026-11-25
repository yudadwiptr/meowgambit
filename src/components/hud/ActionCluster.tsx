import React, { useState } from 'react';
import { Flag, MessageCircle, Sparkles, Undo2 } from 'lucide-react';
import type { EmoteKey } from '../../types/game';
import type { TranslationPack } from '../../i18n/translations';

interface ActionClusterProps {
  t: TranslationPack;
  canUndo: boolean;
  disabled: boolean;
  hasSkillReady: boolean;
  onUndo: () => void;
  onSurrender: () => void;
  onOpenCodex: () => void;
  onTriggerSkillHint: () => void;
  onTriggerEmote: (emote: EmoteKey) => void;
}

const EMOTE_KEYS: EmoteKey[] = ['meow', 'hiss', 'woof', 'gg'];

/**
 * Mobile-First Casual Game Action Cluster anchored at the Bottom-Right of the Garden Arena
 * matching the reference: Undo/Surrender orb, 2 mini Skill Cards, Emote bubble orb,
 * SKILL claw orb, and Big Golden Paw orb.
 */
export const ActionCluster: React.FC<ActionClusterProps> = ({
  t,
  canUndo,
  disabled,
  hasSkillReady,
  onUndo,
  onSurrender,
  onOpenCodex,
  onTriggerSkillHint,
  onTriggerEmote,
}) => {
  const [showEmotes, setShowEmotes] = useState(false);
  const [confirmSurrender, setConfirmSurrender] = useState(false);

  return (
    <div className="relative flex items-end gap-1.5 sm:gap-2.5 select-none">
      {/* Floating Emote Picker Popover */}
      {showEmotes && (
        <div className="absolute bottom-[112%] right-14 sm:right-20 z-40 casual-panel p-2 flex items-center gap-1.5">
          {EMOTE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onTriggerEmote(key);
                setShowEmotes(false);
              }}
              className="casual-btn casual-btn-amber px-2.5 py-1.5 font-display text-[11px] whitespace-nowrap"
            >
              {t.emotes[key].label}
            </button>
          ))}
        </div>
      )}

      {/* Undo + Surrender Pill */}
      <div className="flex flex-col items-center gap-1">
        {confirmSurrender && !disabled && (
          <button
            type="button"
            onClick={() => {
              setConfirmSurrender(false);
              onSurrender();
            }}
            className="casual-btn casual-btn-red px-2 py-1 font-display text-[10px] uppercase flex items-center gap-1 animate-bounce"
          >
            <Flag className="w-3 h-3" />
            {t.surrenderBtn}?
          </button>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setConfirmSurrender(false);
              onUndo();
            }}
            disabled={!canUndo || disabled}
            className="casual-orb w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-b from-[#D95B4E] to-[#A6332A] text-white flex flex-col items-center justify-center"
            title={t.undoBtn}
            aria-label={t.undoBtn}
          >
            <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmSurrender((v) => !v)}
            disabled={disabled}
            className="casual-orb w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-b from-[#6C584C] to-[#4A3B32] text-[#FFE8B6] flex items-center justify-center"
            title={t.surrenderBtn}
            aria-label={t.surrenderBtn}
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="font-display text-[8px] sm:text-[9px] text-[#E6F2E9] cartoon-text-shadow uppercase tracking-tight">
          {t.undoBtn}
        </span>
      </div>

      {/* 2 Decorative & Interactive Mini Skill Cards (persis referensi!) */}
      <div className="hidden xs:flex sm:flex items-end gap-1.5">
        <button
          type="button"
          onClick={onOpenCodex}
          className="group relative w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-[#3A2818] bg-gradient-to-b from-[#F7B733] via-[#D97224] to-[#7A3412] shadow-lg overflow-hidden flex flex-col items-center justify-between p-1 transition-transform active:scale-95 hover:brightness-110"
          title={t.codexTitle}
        >
          <span className="w-full h-1.5 rounded-full bg-white/35" />
          <Sparkles className="w-5 h-5 text-[#FFF7B0] drop-shadow-[0_1px_0_#000]" />
          <span className="font-display text-[7px] leading-tight text-white cartoon-text-shadow text-center uppercase">
            {t.skillCard1}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenCodex}
          className="group relative w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-[#233245] bg-gradient-to-b from-[#5CE1FF] via-[#2A7CC7] to-[#1A3966] shadow-lg overflow-hidden flex flex-col items-center justify-between p-1 transition-transform active:scale-95 hover:brightness-110"
          title={t.codexTitle}
        >
          <span className="w-full h-1.5 rounded-full bg-white/35" />
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FFE875]" fill="currentColor">
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
          </svg>
          <span className="font-display text-[7px] leading-tight text-white cartoon-text-shadow text-center uppercase">
            {t.skillCard2}
          </span>
        </button>
      </div>

      {/* Emote Chat Bubble Orb */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowEmotes((v) => !v)}
          className={`casual-orb w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-b from-[#66C8FF] to-[#287EC9] text-white flex items-center justify-center ${
            showEmotes ? 'ring-2 ring-[#FFE45E]' : ''
          }`}
          title={t.emoteLabel}
          aria-label={t.emoteLabel}
        >
          <MessageCircle className="w-5 h-5 fill-white/25" />
        </button>
        <span className="font-display text-[8px] sm:text-[9px] text-[#E6F2E9] cartoon-text-shadow uppercase">
          {t.emoteLabel}
        </span>
      </div>

      {/* SKILL Claw Slash Orb (Triggers Tactical Hint / Best Move Highlight!) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={onTriggerSkillHint}
          className={`casual-orb w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-b from-[#FFB636] via-[#E06D1B] to-[#8F350C] flex items-center justify-center relative ${
            hasSkillReady && !disabled ? 'ring-2 ring-[#FFF176]' : ''
          }`}
          title={t.skillLabel}
          aria-label={t.skillLabel}
        >
          {/* 3 Glowing Diagonal Claw Slash Marks */}
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path
              d="M9 28 Q18 18 30 9"
              stroke="#FFF39E"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M12 32 Q21 22 33 14"
              stroke="#FFE052"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M17 34 Q25 26 34 20"
              stroke="#FF9B26"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
        <span className="font-display text-[9px] sm:text-[10px] text-[#FFE875] cartoon-text-shadow uppercase">
          {t.skillLabel}
        </span>
      </div>

      {/* Big Golden Cat Paw Orb (Opens Skill Codex / Roster) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onOpenCodex}
          className="casual-orb w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-b from-[#FFE866] via-[#F7B733] to-[#D47A16] flex items-center justify-center"
          title={t.codexTitle}
          aria-label={t.codexTitle}
        >
          <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-11 sm:h-11">
            {/* Cute Cartoon Cat Paw Pad (persis tombol kanan bawah di referensi!) */}
            <g stroke="#3A2516" strokeWidth="2.6" strokeLinejoin="round">
              <path
                d="M18 42 C16 32, 24 27, 32 27 C40 27, 48 32, 46 42 C45 50, 39 55, 32 55 C25 55, 19 50, 18 42 Z"
                fill="#FFF8EE"
              />
              <ellipse cx="32" cy="43" rx="8.5" ry="6.5" fill="#F79EB0" strokeWidth="1.8" />
              <ellipse cx="20" cy="24" rx="5.5" ry="7.5" transform="rotate(-18 20 24)" fill="#FFF8EE" />
              <ellipse cx="28" cy="18" rx="5.5" ry="7.5" transform="rotate(-5 28 18)" fill="#FFF8EE" />
              <ellipse cx="37" cy="18" rx="5.5" ry="7.5" transform="rotate(6 37 18)" fill="#FFF8EE" />
              <ellipse cx="45" cy="24" rx="5.5" ry="7.5" transform="rotate(20 45 24)" fill="#FFF8EE" />
              <circle cx="20.5" cy="24.5" r="2.8" fill="#F79EB0" stroke="none" />
              <circle cx="28" cy="18.5" r="2.8" fill="#F79EB0" stroke="none" />
              <circle cx="37" cy="18.5" r="2.8" fill="#F79EB0" stroke="none" />
              <circle cx="44.5" cy="24.5" r="2.8" fill="#F79EB0" stroke="none" />
            </g>
          </svg>
        </button>
        <span className="font-display text-[8px] sm:text-[9px] text-[#E6F2E9] cartoon-text-shadow uppercase">
          {t.codexShort}
        </span>
      </div>
    </div>
  );
};
