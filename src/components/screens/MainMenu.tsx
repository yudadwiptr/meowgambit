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

/** Reusable wooden fence post for the 2.5D Garden Courtyard backdrop */
const CourtyardPost: React.FC<{ x: number; y: number; h?: number }> = ({ x, y, h = 44 }) => (
  <g stroke="#2B1C12" strokeWidth="2.4" strokeLinejoin="round">
    <path
      d={`M${x - 8} ${y} L${x - 8} ${y - h + 9} L${x} ${y - h} L${x + 8} ${y - h + 9} L${x + 8} ${y} Z`}
      fill="#B87A48"
    />
    <line x1={x - 2} y1={y - h + 10} x2={x - 2} y2={y - 5} stroke="#D49866" strokeWidth="2.2" />
  </g>
);

/** Reusable fluffy garden tree cluster */
const GardenTree: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} stroke="#1E301B" strokeWidth="2.8" strokeLinejoin="round">
    <rect x="-13" y="34" width="26" height="44" rx="6" fill="#7D4F2D" />
    <circle cx="-36" cy="8" r="34" fill="#4E9444" />
    <circle cx="36" cy="10" r="32" fill="#4E9444" />
    <circle cx="0" cy="-26" r="40" fill="#63AD4C" />
    <circle cx="-24" cy="-14" r="32" fill="#6DB852" />
    <circle cx="24" cy="-12" r="30" fill="#63AD4C" />
    <circle cx="0" cy="10" r="34" fill="#59A148" />
    <circle cx="-14" cy="-36" r="12" fill="#9EE06B" stroke="none" opacity="0.65" />
    <circle cx="18" cy="-24" r="9" fill="#9EE06B" stroke="none" opacity="0.55" />
  </g>
);

/** Little courtyard flower */
const CourtyardFlower: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx="-4" cy="0" r="3.4" fill={color} stroke="#231D18" strokeWidth="1.3" />
    <circle cx="4" cy="0" r="3.4" fill={color} stroke="#231D18" strokeWidth="1.3" />
    <circle cx="0" cy="-4" r="3.4" fill={color} stroke="#231D18" strokeWidth="1.3" />
    <circle cx="0" cy="4" r="3.4" fill={color} stroke="#231D18" strokeWidth="1.3" />
    <circle cx="0" cy="0" r="2.6" fill="#FFE45E" />
  </g>
);

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

  // Isometric courtyard checkered stone tiles behind the setup card
  const courtyardTiles: Array<{ pts: string; light: boolean; key: string }> = [];
  const ox = 720;
  const oy = 255;
  const tw = 58;
  const th = 31;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cx = ox + (c - r) * tw;
      const cy = oy + (c + r) * th;
      courtyardTiles.push({
        key: `${r}-${c}`,
        light: (r + c) % 2 === 0,
        pts: `${cx},${cy - th} ${cx + tw},${cy} ${cx},${cy + th} ${cx - tw},${cy}`,
      });
    }
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden relative flex flex-col items-center justify-center bg-[#73B944]">
      {/* ================================================================
          FULL-BLEED 2.5D ISOMETRIC GARDEN COURTYARD BACKDROP (REFERENCE)
         ================================================================ */}
      <svg
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="courtyard-grass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A9E660" />
            <stop offset="50%" stopColor="#86CF4D" />
            <stop offset="100%" stopColor="#69B33E" />
          </linearGradient>
          <linearGradient id="sunbeams" x1="0%" y1="0%" x2="50%" y2="60%">
            <stop offset="0%" stopColor="#FFF7B2" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#FFF7B2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="brick-wall-l" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7BC99" />
            <stop offset="100%" stopColor="#B89974" />
          </linearGradient>
          <linearGradient id="brick-wall-r" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C9AE8B" />
            <stop offset="100%" stopColor="#A88966" />
          </linearGradient>
        </defs>

        {/* Sunny Green Courtyard Lawn */}
        <rect width="1440" height="810" fill="url(#courtyard-grass)" />

        {/* Back-Left & Back-Right Sandstone Garden Walls */}
        <polygon
          points="0,250 560,-40 720,42 720,170 0,530"
          fill="url(#brick-wall-l)"
          stroke="#2E2118"
          strokeWidth="3.5"
        />
        <polygon
          points="720,42 880,-40 1440,250 1440,530 720,170"
          fill="url(#brick-wall-r)"
          stroke="#2E2118"
          strokeWidth="3.5"
        />
        {/* Stone Wall Cap Ledge */}
        <polygon
          points="0,224 560,-64 720,20 720,56 560,-28 0,260"
          fill="#EBD7B8"
          stroke="#2E2118"
          strokeWidth="3"
        />
        <polygon
          points="720,20 880,-64 1440,224 1440,260 880,-28 720,56"
          fill="#DFC7A4"
          stroke="#2E2118"
          strokeWidth="3"
        />

        {/* Wooden Courtyard Gate & Stone Steps on Upper-Right */}
        <g stroke="#2C1D13" strokeWidth="3" strokeLinejoin="round">
          <polygon points="1085,78 1205,138 1205,274 1085,214" fill="#B5723D" />
          <line x1="1085" y1="125" x2="1205" y2="185" stroke="#7A4822" strokeWidth="3" />
          <line x1="1085" y1="170" x2="1205" y2="230" stroke="#7A4822" strokeWidth="3" />
          {/* Stone Steps in front of gate */}
          <polygon points="1062,226 1188,288 1222,272 1096,210" fill="#DFD5C3" />
          <polygon points="1042,248 1172,312 1206,294 1076,230" fill="#CFC4B0" />
        </g>

        {/* Isometric Checkered Stone Courtyard Floor */}
        <g>
          {courtyardTiles.map((tile) => (
            <polygon
              key={tile.key}
              points={tile.pts}
              fill={tile.light ? '#EAE1CE' : '#7D7B72'}
              stroke="#5D5B53"
              strokeWidth="2"
            />
          ))}
        </g>

        {/* Decorative Carved Stone Chess Pedestal Table (Left Courtyard, persis referensi!) */}
        <g stroke="#2B231B" strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="468" cy="596" rx="74" ry="26" fill="rgba(26, 48, 22, 0.28)" stroke="none" />
          <polygon points="396,568 468,604 540,568 468,532" fill="#D5C8B2" />
          <polygon points="416,560 468,586 468,512 416,486" fill="#E3D7C3" />
          <polygon points="468,586 520,560 520,486 468,512" fill="#C4B69F" />
          <polygon points="392,482 468,520 544,482 468,444" fill="#F0E6D5" />
          {/* Mini checkered top on pedestal */}
          <polygon points="432,482 468,500 504,482 468,464" fill="#A07B56" strokeWidth="1.6" />
          <polygon points="450,473 468,482 486,473 468,464" fill="#F5EBD8" stroke="none" />
          <polygon points="450,491 468,500 486,491 468,482" fill="#F5EBD8" stroke="none" />
        </g>

        {/* Inner Wooden Courtyard Fences (Back-Left & Back-Right) */}
        <g>
          <line x1="88" y1="452" x2="520" y2="230" stroke="#8C552B" strokeWidth="9" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CourtyardPost key={`fl-${i}`} x={105 + i * 50} y={472 - i * 26} h={46} />
          ))}

          <line x1="920" y1="230" x2="1352" y2="452" stroke="#8C552B" strokeWidth="9" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CourtyardPost key={`fr-${i}`} x={935 + i * 50} y={264 + i * 26} h={46} />
          ))}
        </g>

        {/*Lush Trees & Bushes framing left and right sides */}
        <GardenTree x={70} y={220} scale={1.55} />
        <GardenTree x={1375} y={240} scale={1.6} />
        <GardenTree x={30} y={540} scale={1.35} />
        <GardenTree x={1410} y={560} scale={1.35} />

        {/* Colorful Courtyard Flowers & Butterflies */}
        <CourtyardFlower x={250} y={620} color="#F78FB3" />
        <CourtyardFlower x={190} y={560} color="#74B9FF" />
        <CourtyardFlower x={1045} y={640} color="#FFEAA7" />
        <CourtyardFlower x={1150} y={615} color="#F78FB3" />
        <CourtyardFlower x={1260} y={680} color="#74B9FF" />
        <CourtyardFlower x={975} y={685} color="#F78FB3" />

        {/* Cute Pastel Butterflies */}
        <g transform="translate(215, 558) rotate(-15)">
          <ellipse cx="-6" cy="-4" rx="7" ry="5" fill="#C49CFF" stroke="#221A14" strokeWidth="1.6" />
          <ellipse cx="6" cy="-4" rx="7" ry="5" fill="#C49CFF" stroke="#221A14" strokeWidth="1.6" />
          <ellipse cx="-4" cy="4" rx="4.5" ry="3.5" fill="#E3CEFF" stroke="#221A14" strokeWidth="1.4" />
          <ellipse cx="4" cy="4" rx="4.5" ry="3.5" fill="#E3CEFF" stroke="#221A14" strokeWidth="1.4" />
        </g>
        <g transform="translate(1288, 540) rotate(12)">
          <ellipse cx="-6" cy="-4" rx="7" ry="5" fill="#FFA96B" stroke="#221A14" strokeWidth="1.6" />
          <ellipse cx="6" cy="-4" rx="7" ry="5" fill="#FFA96B" stroke="#221A14" strokeWidth="1.6" />
        </g>

        {/* ============================================================
            4 STANDING CHIBI CHARACTERS IN THE COURTYARD (PERSIS REFERENSI!)
           ============================================================ */}
        {/* Left: Penyihir Kucing (Witch Cat) & Kucing Ksatria (Cat Knight) */}
        <g transform="translate(362, 294)">
          <svg width="152" height="176" viewBox="0 0 110 128" overflow="visible">
            <AnimalPiece color="w" type="b" showShadow />
          </svg>
        </g>
        <g transform="translate(230, 382)">
          <svg width="166" height="192" viewBox="0 0 110 128" overflow="visible">
            <AnimalPiece color="w" type="n" showShadow />
          </svg>
        </g>

        {/* Right: Singa Bermahkota (Crowned Lion) & Bulldog Kekar (Bulldog Tank) */}
        <g transform="translate(946, 286)">
          <svg width="174" height="202" viewBox="0 0 110 128" overflow="visible">
            <AnimalPiece color="w" type="k" showShadow />
          </svg>
        </g>
        <g transform="translate(1086, 412)">
          <svg width="168" height="196" viewBox="0 0 110 128" overflow="visible">
            <AnimalPiece color="b" type="r" showShadow />
          </svg>
        </g>

        {/* Foreground Bottom Wooden Fence Accents */}
        <g>
          <line x1="340" y1="775" x2="500" y2="795" stroke="#8C552B" strokeWidth="9" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <CourtyardPost key={`bfl-${i}`} x={355 + i * 44} y={810} h={64} />
          ))}
          <line x1="940" y1="795" x2="1120" y2="775" stroke="#8C552B" strokeWidth="9" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <CourtyardPost key={`bfr-${i}`} x={960 + i * 44} y={810} h={64} />
          ))}
        </g>

        {/* Warm Sunlight Rays from Top-Left */}
        <polygon points="0,0 440,0 920,560 0,380" fill="url(#sunbeams)" />
      </svg>

      {/* ================================================================
          TOP-RIGHT CORNER: AUDIO & LANGUAGE ROUNDED BUTTONS
         ================================================================ */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleLang}
          className="casual-btn casual-btn-blue px-3 py-2 font-display text-xs uppercase flex items-center gap-1.5"
          title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          aria-label="Switch Language"
        >
          <Globe className="w-4 h-4" />
          {t.langLabel}
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

      {/* ================================================================
          CENTER HERO: TRANSPARENT NEOBRUTALIST LOGO + CASUAL MATCH SETUP CARD
         ================================================================ */}
      <div className="relative z-10 w-full max-w-[390px] sm:max-w-[420px] px-3 flex flex-col items-center justify-center max-h-[100dvh]">
        {/* Transparent MEOWGAMBIT Hero Logo (NO pink box!) */}
        <div className="relative z-20 w-[230px] sm:w-[295px] -mb-4 sm:-mb-5 pointer-events-none">
          <img
            src="/logo.png?v=2"
            alt="MeowGambit Logo"
            className="w-full h-auto object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.42)]"
          />
        </div>

        {/* Rounded Warm Casual Cartoon Match Setup Card (Persis Referensi!) */}
        <div className="w-full rounded-[28px] border-[3.5px] border-[#382619] bg-gradient-to-b from-[#F5E7CE] via-[#EAD7B9] to-[#D9C09D] shadow-[0_14px_30px_rgba(16,32,14,0.52),inset_0_3px_0_rgba(255,255,255,0.8)] pt-5 pb-3.5 px-3.5 sm:pt-6 sm:pb-4 sm:px-4 flex flex-col gap-2">
          {/* Card Title */}
          <h1 className="text-center font-display text-lg sm:text-xl uppercase tracking-wide text-white cartoon-text-shadow leading-none">
            {t.matchSetup}
          </h1>

          {/* 1. GAME MODE Tray */}
          <div className="rounded-2xl bg-[#6F5543] border-2 border-[#4A3628] p-2 shadow-inner">
            <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1.5 px-0.5">
              {t.gameMode}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateMode('bot')}
                className={`casual-btn py-1.5 sm:py-2 px-2 font-display text-xs sm:text-sm uppercase ${
                  config.mode === 'bot' ? 'casual-btn-green' : 'casual-btn-cream'
                }`}
              >
                {t.vsBot}
              </button>
              <button
                type="button"
                onClick={() => updateMode('local')}
                className={`casual-btn py-1.5 sm:py-2 px-2 font-display text-xs sm:text-sm uppercase ${
                  config.mode === 'local' ? 'casual-btn-green' : 'casual-btn-cream'
                }`}
              >
                {t.local2p}
              </button>
            </div>
          </div>

          {/* 2. PLAY AS (Cats/Dogs) + DIFFICULTY (Easy/Medium/Hard) OR Local Auto-Flip */}
          {config.mode === 'bot' ? (
            <>
              <div className="rounded-2xl bg-[#6F5543] border-2 border-[#4A3628] p-2 shadow-inner">
                <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1.5 px-0.5">
                  {t.playAs}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updatePlayerColor('w')}
                    className={`casual-btn py-1 px-2 flex items-center justify-center gap-1.5 font-display text-xs sm:text-sm uppercase ${
                      config.playerColor === 'w' ? 'casual-btn-green' : 'casual-btn-cream'
                    }`}
                  >
                    <div className="w-6 h-7 shrink-0">
                      <AnimalPiece color="w" type="r" showBadge={false} showShadow={false} />
                    </div>
                    <span>{t.catsShort}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePlayerColor('b')}
                    className={`casual-btn py-1 px-2 flex items-center justify-center gap-1.5 font-display text-xs sm:text-sm uppercase ${
                      config.playerColor === 'b' ? 'casual-btn-green' : 'casual-btn-cream'
                    }`}
                  >
                    <div className="w-6 h-7 shrink-0">
                      <AnimalPiece color="b" type="r" showBadge={false} showShadow={false} />
                    </div>
                    <span>{t.dogsShort}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#6F5543] border-2 border-[#4A3628] p-2 shadow-inner">
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
                            : 'opacity-70 hover:opacity-95'
                        }`}
                      >
                        <span className="cartoon-text-shadow text-white">
                          {t.difficultyLabels[id].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[#6F5543] border-2 border-[#4A3628] p-2.5 flex items-center justify-between gap-2 shadow-inner">
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
                  config.autoFlipLocal ? 'casual-btn-green' : 'casual-btn-cream'
                }`}
              >
                {config.autoFlipLocal ? t.on : t.off}
              </button>
            </div>
          )}

          {/* 3. Compact TIME CONTROL Row */}
          <div className="rounded-2xl bg-[#6F5543] border-2 border-[#4A3628] p-2 shadow-inner">
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
                      active ? 'casual-btn-blue' : 'casual-btn-cream opacity-90'
                    }`}
                  >
                    <div className="font-display text-[10px] sm:text-[11px] uppercase leading-tight">
                      {info.title}
                    </div>
                    <div className="text-[9px] font-bold opacity-80 leading-tight">{info.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRIMARY GREEN GLOSSY CTA BUTTON (PLAY BATTLE! / START BATTLE!) */}
          <button
            type="button"
            onClick={onStartGame}
            className="casual-btn casual-btn-green rounded-full mt-1 py-2.5 sm:py-3 px-4 font-display text-lg sm:text-xl uppercase tracking-wide flex items-center justify-center gap-2 text-white"
          >
            <span className="cartoon-text-shadow">{t.startBattle}</span>
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-[#1E3B16] drop-shadow-[0_1.5px_0_#1A2E14]" />
          </button>
        </div>
      </div>

      {/* ================================================================
          BOTTOM-LEFT CORNER: ROUNDED BLUE SKILL CODEX PILL (PERSIS REFERENSI!)
         ================================================================ */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-5 z-20">
        <button
          type="button"
          onClick={onOpenRoster}
          className="casual-btn casual-btn-blue rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 font-display text-xs sm:text-sm uppercase flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded-lg bg-[#9E6238] border-2 border-[#3A2210] flex items-center justify-center shadow-inner">
            <BookOpen className="w-3.5 h-3.5 text-[#FFF2C2]" />
          </span>
          <span className="cartoon-text-shadow">{t.skillCodexBtn}</span>
        </button>
      </div>
    </div>
  );
};
