import React from 'react';
import type { Color } from 'chess.js';
import { BookOpen, Globe, Play, RotateCw, Volume2, VolumeX } from 'lucide-react';
import type { Difficulty, GameConfig, GameMode, TimeControl } from '../../types/game';
import type { Language, TranslationPack } from '../../i18n/translations';
import { AnimalPiece } from '../pieces/AnimalPiece';

interface MainMenuProps {
  config: GameConfig;
  muted: boolean;
  lang: Language;
  t: TranslationPack;
  onChangeConfig: (next: GameConfig) => void;
  onStartGame: () => void;
  onOpenRoster: () => void;
  onToggleMute: () => void;
  onToggleLang: () => void;
}

const DIFFICULTY_IDS: Difficulty[] = ['easy', 'medium', 'hard'];
const TIME_CONTROLS: TimeControl[] = ['blitz', 'rapid', 'unlimited'];

export const MainMenu: React.FC<MainMenuProps> = ({
  config,
  muted,
  lang,
  t,
  onChangeConfig,
  onStartGame,
  onOpenRoster,
  onToggleMute,
  onToggleLang,
}) => {
  const updateMode = (mode: GameMode) => onChangeConfig({ ...config, mode });
  const updateDifficulty = (difficulty: Difficulty) => onChangeConfig({ ...config, difficulty });
  const updateTimeControl = (timeControl: TimeControl) => onChangeConfig({ ...config, timeControl });
  const updatePlayerColor = (playerColor: Color) => onChangeConfig({ ...config, playerColor });

  return (
    <div
      className="h-[100dvh] w-full overflow-hidden relative flex flex-col items-center justify-center bg-[#5A8E3D]"
      style={{
        backgroundImage: "url('/lobby-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle warm vignette for UI legibility without dulling the artwork */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(24, 36, 18, 0.06) 35%, rgba(16, 28, 14, 0.32) 100%)',
        }}
      />

      {/* TOP-RIGHT CORNER: AUDIO & LANGUAGE ROUNDED BUTTONS */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleLang}
          className="casual-btn casual-btn-blue px-3 py-2 font-display text-xs uppercase flex items-center gap-1.5"
          title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          aria-label="Switch Language"
        >
          <Globe className="w-4 h-4" />
          <span className="cartoon-text-shadow">{t.langLabel}</span>
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className="casual-orb w-11 h-11 bg-gradient-to-b from-[#6CC8FF] to-[#287EC9] text-white flex items-center justify-center"
          title={muted ? 'Unmute' : 'Mute'}
          aria-label="Toggle Sound"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* CENTER HERO: TRANSPARENT NEOBRUTALIST LOGO + WARM WOOD-FRAMED MATCH SETUP CARD */}
      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[410px] px-3 flex flex-col items-center justify-center max-h-[100dvh]">
        {/* Transparent MEOWGAMBIT Hero Logo (NO pink box) */}
        <div className="relative z-20 w-[225px] sm:w-[288px] -mb-4 sm:-mb-5 pointer-events-none">
          <img
            src="/logo.png?v=2"
            alt="MeowGambit Logo"
            className="w-full h-auto object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.48)]"
          />
        </div>

        {/* Semi-transparent Warm Cream & Wood-Framed Match Setup Card (#F5E6C8 + #5C3A21) */}
        <div className="w-full rounded-[26px] border-[3.5px] border-[#5C3A21] bg-[#F5E6C8]/92 backdrop-blur-[2px] shadow-[0_14px_32px_rgba(20,28,12,0.5),inset_0_2.5px_0_rgba(255,252,240,0.85),inset_0_-3px_0_rgba(128,88,48,0.28)] pt-5 pb-3.5 px-3.5 sm:pt-6 sm:pb-4 sm:px-4 flex flex-col gap-2">
          {/* Card Title */}
          <h1 className="text-center font-display text-lg sm:text-xl uppercase tracking-wide text-white cartoon-text-shadow-bold leading-none">
            {t.matchSetup}
          </h1>

          {/* 1. GAME MODE Tray */}
          <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner">
            <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1.5 px-0.5">
              {t.gameMode}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateMode('bot')}
                className={`casual-btn py-1.5 sm:py-2 px-2 font-display text-xs sm:text-sm uppercase ${
                  config.mode === 'bot' ? 'casual-btn-green text-white' : 'casual-btn-cream'
                }`}
              >
                <span className={config.mode === 'bot' ? 'cartoon-text-shadow-bold text-white' : ''}>
                  {t.vsBot}
                </span>
              </button>
              <button
                type="button"
                onClick={() => updateMode('local')}
                className={`casual-btn py-1.5 sm:py-2 px-2 font-display text-xs sm:text-sm uppercase ${
                  config.mode === 'local' ? 'casual-btn-green text-white' : 'casual-btn-cream'
                }`}
              >
                <span className={config.mode === 'local' ? 'cartoon-text-shadow-bold text-white' : ''}>
                  {t.local2p}
                </span>
              </button>
            </div>
          </div>

          {/* 2. PLAY AS (Cats/Dogs) + DIFFICULTY (Easy/Medium/Hard) OR Local Auto-Flip */}
          {config.mode === 'bot' ? (
            <>
              <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner">
                <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1.5 px-0.5">
                  {t.playAs}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updatePlayerColor('w')}
                    className={`casual-btn py-1 px-2 flex items-center justify-center gap-1.5 font-display text-xs sm:text-sm uppercase ${
                      config.playerColor === 'w'
                        ? 'casual-btn-green text-white'
                        : 'casual-btn-cream'
                    }`}
                  >
                    <div className="w-6 h-7 shrink-0">
                      <AnimalPiece color="w" type="r" showBadge={false} showShadow={false} />
                    </div>
                    <span
                      className={
                        config.playerColor === 'w' ? 'cartoon-text-shadow-bold text-white' : ''
                      }
                    >
                      {t.catsShort}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePlayerColor('b')}
                    className={`casual-btn py-1 px-2 flex items-center justify-center gap-1.5 font-display text-xs sm:text-sm uppercase ${
                      config.playerColor === 'b'
                        ? 'casual-btn-green text-white'
                        : 'casual-btn-cream'
                    }`}
                  >
                    <div className="w-6 h-7 shrink-0">
                      <AnimalPiece color="b" type="r" showBadge={false} showShadow={false} />
                    </div>
                    <span
                      className={
                        config.playerColor === 'b' ? 'cartoon-text-shadow-bold text-white' : ''
                      }
                    >
                      {t.dogsShort}
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner">
                <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1.5 px-0.5">
                  {t.aiDifficulty}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIFFICULTY_IDS.map((id) => {
                    const active = config.difficulty === id;
                    const colorClass =
                      id === 'easy'
                        ? 'casual-btn-amber'
                        : id === 'medium'
                          ? 'bg-gradient-to-b from-[#FFB347] to-[#E67E22] text-white'
                          : 'casual-btn-red';
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateDifficulty(id)}
                        className={`casual-btn py-1.5 px-1 font-display text-[11px] sm:text-xs uppercase ${colorClass} ${
                          active
                            ? 'ring-2 ring-white scale-[1.03]'
                            : 'opacity-72 hover:opacity-95'
                        }`}
                      >
                        <span className="cartoon-text-shadow-bold text-white">
                          {t.difficultyLabels[id].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2.5 flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 text-[#FFF3D1]">
                <RotateCw className="w-4 h-4 shrink-0 text-[#FFE259]" />
                <div>
                  <div className="font-display text-xs uppercase cartoon-text-shadow">
                    {t.autoFlipTitle}
                  </div>
                  <div className="text-[10px] font-medium text-[#EFE0C4]">{t.autoFlipDesc}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({ ...config, autoFlipLocal: !config.autoFlipLocal })
                }
                className={`casual-btn px-3 py-1.5 font-display text-xs uppercase shrink-0 ${
                  config.autoFlipLocal ? 'casual-btn-green text-white' : 'casual-btn-cream'
                }`}
              >
                <span className={config.autoFlipLocal ? 'cartoon-text-shadow-bold text-white' : ''}>
                  {config.autoFlipLocal ? t.on : t.off}
                </span>
              </button>
            </div>
          )}

          {/* 3. Compact TIME CONTROL Row */}
          <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner">
            <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1 px-0.5">
              {t.timeControl}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_CONTROLS.map((tc) => {
                const info = t.timeLabels[tc];
                const active = config.timeControl === tc;
                return (
                  <button
                    key={tc}
                    type="button"
                    onClick={() => updateTimeControl(tc)}
                    className={`casual-btn py-1 px-1 text-center ${
                      active ? 'casual-btn-blue text-white' : 'casual-btn-cream opacity-95'
                    }`}
                  >
                    <div
                      className={`font-display text-[10px] sm:text-[11px] uppercase leading-tight ${
                        active ? 'cartoon-text-shadow-bold text-white' : ''
                      }`}
                    >
                      {info.title}
                    </div>
                    <div
                      className={`text-[9px] font-bold leading-tight ${
                        active ? 'text-[#FFF7D6]' : 'opacity-75'
                      }`}
                    >
                      {info.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRIMARY GREEN GLOSSY CTA BUTTON ("MULAI TARUNG!" / "START BATTLE!") */}
          <button
            type="button"
            onClick={onStartGame}
            className="casual-btn casual-btn-green rounded-full mt-1 py-2.5 sm:py-3 px-4 font-display text-lg sm:text-xl uppercase tracking-wide flex items-center justify-center gap-2 text-white"
          >
            <span className="cartoon-text-shadow-bold text-white">{t.startBattle}</span>
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-black drop-shadow-[0_2px_0_#000]" />
          </button>
        </div>
      </div>

      {/* BOTTOM-LEFT CORNER: ROUNDED BLUE SKILL CODEX PILL */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-5 z-20">
        <button
          type="button"
          onClick={onOpenRoster}
          className="casual-btn casual-btn-blue rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 font-display text-xs sm:text-sm uppercase flex items-center gap-2 text-white"
        >
          <span className="w-6 h-6 rounded-lg bg-[#9E6238] border-2 border-[#3A2210] flex items-center justify-center shadow-inner">
            <BookOpen className="w-3.5 h-3.5 text-[#FFF2C2]" />
          </span>
          <span className="cartoon-text-shadow-bold text-white">{t.skillCodexBtn}</span>
        </button>
      </div>
    </div>
  );
};
