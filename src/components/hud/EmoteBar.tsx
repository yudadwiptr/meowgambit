import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { EmoteKey } from '../../types/game';
import type { TranslationPack } from '../../i18n/translations';
import { EMOTE_DEFINITIONS } from '../../data/roster';

interface EmoteBarProps {
  onTriggerEmote: (emote: EmoteKey) => void;
  disabled?: boolean;
  t: TranslationPack;
}

const EMOTE_KEYS: EmoteKey[] = ['meow', 'hiss', 'woof', 'gg'];

export const EmoteBar: React.FC<EmoteBarProps> = ({ onTriggerEmote, disabled = false, t }) => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-display uppercase text-black bg-[#FFFDF7] border-2 border-black px-1.5 py-1">
        <MessageCircle className="w-3 h-3" />
        {t.emoteLabel}
      </span>
      <div className="flex items-center gap-1.5 flex-1">
        {EMOTE_KEYS.map((key) => {
          const def = EMOTE_DEFINITIONS[key];
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onTriggerEmote(key)}
              style={{ backgroundColor: def.bg }}
              className="neo-btn flex-1 py-1 px-2 text-[11px] sm:text-xs font-display uppercase text-black tracking-tight text-center leading-tight"
            >
              {t.emotes[key].label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
