import React, { useEffect, useState } from 'react';
import type { Color } from 'chess.js';
import {
  BookOpen,
  Check,
  Copy,
  Globe,
  Link2,
  Loader2,
  Play,
  RefreshCw,
  RotateCw,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import type {
  Difficulty,
  GameConfig,
  GameMode,
  OnlineConnectionStatus,
  TimeControl,
} from '../../types/game';
import type { Language, TranslationPack } from '../../i18n/translations';
import { normalizeRoomCode } from '../../engine/multiplayer';
import { AnimalPiece } from '../pieces/AnimalPiece';

interface MainMenuProps {
  config: GameConfig;
  muted: boolean;
  lang: Language;
  t: TranslationPack;
  // Online Multiplayer Lobby state & actions
  onlineTab: 'create' | 'join';
  onlineStatus: OnlineConnectionStatus;
  roomCode: string;
  joinCode: string;
  onlineError: string | null;
  onChangeOnlineTab: (tab: 'create' | 'join') => void;
  onChangeJoinCode: (code: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onCancelOnline: () => void;
  // Core menu callbacks
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
  onlineTab,
  onlineStatus,
  roomCode,
  joinCode,
  onlineError,
  onChangeOnlineTab,
  onChangeJoinCode,
  onCreateRoom,
  onJoinRoom,
  onCancelOnline,
  onChangeConfig,
  onStartGame,
  onOpenRoster,
  onToggleMute,
  onToggleLang,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  // Lazily pre-warm lightweight arena backgrounds after Lobby paints so entering battle is instant!
  useEffect(() => {
    const id = window.setTimeout(() => {
      ['/arena-bg.jpg', '/arena-bg-flat.jpg'].forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }, 600);
    return () => window.clearTimeout(id);
  }, []);

  const updateMode = (mode: GameMode) => onChangeConfig({ ...config, mode });
  const updateRuleset = (ruleset: 'classic' | 'arcade') => onChangeConfig({ ...config, ruleset });
  const updateDifficulty = (difficulty: Difficulty) => onChangeConfig({ ...config, difficulty });
  const updateTimeControl = (timeControl: TimeControl) => onChangeConfig({ ...config, timeControl });
  const updatePlayerColor = (playerColor: Color) => onChangeConfig({ ...config, playerColor });

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedType(type);
    window.setTimeout(() => setCopiedType((cur) => (cur === type ? null : cur)), 1800);
  };

  const inviteUrl =
    typeof window !== 'undefined' && roomCode
      ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      : '';

  return (
    <div
      className="h-[100dvh] w-full overflow-hidden relative flex flex-col items-center justify-center bg-[#5A8E3D]"
      style={{
        backgroundImage: "url('/lobby-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle warm vignette for UI legibility */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(24, 36, 18, 0.06) 35%, rgba(16, 28, 14, 0.32) 100%)',
        }}
      />

      {/* TOP-LEFT CORNER: ROUNDED BLUE SKILL CODEX PILL */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-5 z-20">
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
      <div className="relative z-10 w-full max-w-[400px] sm:max-w-[436px] px-3 flex flex-col items-center justify-center max-h-[100dvh]">
        {/* Transparent MEOWGAMBIT Hero Logo (NO pink box) */}
        <div className="relative z-20 w-[210px] sm:w-[270px] -mb-4 sm:-mb-5 pointer-events-none">
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

          {/* 1. GAME MODE Tray (3 Modes: VS BOT | 2P LOCAL | ONLINE MABAR) */}
          <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner">
            <div className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow mb-1.5 px-0.5">
              {t.gameMode}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => updateMode('bot')}
                className={`casual-btn py-1.5 sm:py-2 px-1.5 font-display text-[10.5px] sm:text-xs uppercase leading-tight ${
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
                className={`casual-btn py-1.5 sm:py-2 px-1.5 font-display text-[10.5px] sm:text-xs uppercase leading-tight ${
                  config.mode === 'local' ? 'casual-btn-green text-white' : 'casual-btn-cream'
                }`}
              >
                <span
                  className={config.mode === 'local' ? 'cartoon-text-shadow-bold text-white' : ''}
                >
                  {t.local2p}
                </span>
              </button>
              <button
                type="button"
                onClick={() => updateMode('online')}
                className={`casual-btn py-1.5 sm:py-2 px-1.5 font-display text-[10.5px] sm:text-xs uppercase leading-tight flex items-center justify-center gap-1 ${
                  config.mode === 'online' ? 'casual-btn-green text-white' : 'casual-btn-cream'
                }`}
              >
                <Wifi className="w-3 h-3 shrink-0" />
                <span
                  className={config.mode === 'online' ? 'cartoon-text-shadow-bold text-white' : ''}
                >
                  {t.onlineMabar}
                </span>
              </button>
            </div>
          </div>

          {/* 1B. RULESET TOGGLE: KLASIK | ARCADE ⚡ (Shown for Bot, Local, and Online Host) */}
          {(config.mode !== 'online' || onlineTab === 'create') && (
            <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-1 px-0.5">
                <span className="text-[10px] font-display uppercase text-[#FFF3D1] cartoon-text-shadow">
                  {t.rulesetLabel}
                </span>
                <span className="text-[9.5px] font-bold text-[#FFE8A3] truncate">
                  {config.ruleset === 'arcade' ? t.rulesetArcadeHint : t.rulesetClassicHint}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRuleset('classic')}
                  className={`casual-btn py-1.5 px-2 font-display text-xs uppercase ${
                    config.ruleset === 'classic' ? 'casual-btn-blue text-white' : 'casual-btn-cream'
                  }`}
                >
                  <span
                    className={
                      config.ruleset === 'classic' ? 'cartoon-text-shadow-bold text-white' : ''
                    }
                  >
                    {t.rulesetClassic}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateRuleset('arcade')}
                  className={`casual-btn py-1.5 px-2 font-display text-xs uppercase ${
                    config.ruleset === 'arcade'
                      ? 'bg-gradient-to-b from-[#FFB830] to-[#E65C19] text-white'
                      : 'casual-btn-cream'
                  }`}
                >
                  <span
                    className={
                      config.ruleset === 'arcade' ? 'cartoon-text-shadow-bold text-white' : ''
                    }
                  >
                    {t.rulesetArcade}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 2. MODE-SPECIFIC PANEL */}
          {config.mode === 'online' ? (
            <>
              {/* Online Sub-Tabs: BUAT ROOM | GABUNG ROOM */}
              <div className="rounded-2xl bg-[#6B4E3B]/92 border-2 border-[#5C3A21] p-2 shadow-inner flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeOnlineTab('create')}
                    className={`casual-btn py-1.5 px-2 font-display text-xs uppercase ${
                      onlineTab === 'create' ? 'casual-btn-blue text-white' : 'casual-btn-cream'
                    }`}
                  >
                    <span
                      className={
                        onlineTab === 'create' ? 'cartoon-text-shadow-bold text-white' : ''
                      }
                    >
                      {t.createRoomTab}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOnlineTab('join')}
                    className={`casual-btn py-1.5 px-2 font-display text-xs uppercase ${
                      onlineTab === 'join' ? 'casual-btn-blue text-white' : 'casual-btn-cream'
                    }`}
                  >
                    <span
                      className={onlineTab === 'join' ? 'cartoon-text-shadow-bold text-white' : ''}
                    >
                      {t.joinRoomTab}
                    </span>
                  </button>
                </div>

                {onlineTab === 'create' ? (
                  <div className="rounded-xl bg-[#4E382A] border border-[#3B281B] p-2.5 flex flex-col items-center gap-2 text-center">
                    <div className="text-[10px] font-bold uppercase text-[#FFE8B3]">
                      {t.roomCodeLabel}
                    </div>

                    {onlineStatus === 'creating' || !roomCode ? (
                      <div className="flex items-center gap-2 py-2 text-[#FFF7D6]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#FFE259]" />
                        <span className="font-display text-xs uppercase">{t.creatingRoom}</span>
                      </div>
                    ) : (
                      <>
                        {/* Big Readable 5-Character Room Code */}
                        <div className="flex items-center gap-2">
                          <div className="px-4 py-1.5 rounded-xl bg-[#FFF8E7] border-2 border-[#2B1D12] font-display text-2xl sm:text-3xl tracking-[0.2em] text-[#2F1E10] shadow-inner">
                            {roomCode}
                          </div>
                          <button
                            type="button"
                            onClick={onCreateRoom}
                            className="casual-btn casual-btn-amber p-2"
                            title={t.regenerateRoomBtn}
                            aria-label={t.regenerateRoomBtn}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Waiting Status */}
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A5F57A]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>{t.waitingOpponent}</span>
                        </div>

                        {/* Copy Code & Copy Invite Link Buttons */}
                        <div className="w-full grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(roomCode, 'code')}
                            className="casual-btn casual-btn-amber py-1.5 px-2 font-display text-[11px] uppercase flex items-center justify-center gap-1"
                          >
                            {copiedType === 'code' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{t.copiedLabel}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t.copyCodeBtn}</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(inviteUrl, 'link')}
                            className="casual-btn casual-btn-blue py-1.5 px-2 font-display text-[11px] uppercase flex items-center justify-center gap-1 text-white"
                          >
                            {copiedType === 'link' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="cartoon-text-shadow">{t.copiedLabel}</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="cartoon-text-shadow">{t.copyLinkBtn}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-[10px] font-medium text-[#EFE0C4]">
                          {t.onlineHostHint}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#4E382A] border border-[#3B281B] p-2.5 flex flex-col gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      maxLength={5}
                      disabled={onlineStatus === 'joining'}
                      onChange={(e) => onChangeJoinCode(normalizeRoomCode(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && joinCode.length >= 4 && onlineStatus !== 'joining') {
                          onJoinRoom(joinCode);
                        }
                      }}
                      placeholder={t.enterRoomPlaceholder}
                      className="w-full rounded-xl bg-[#FFF8E7] border-2 border-[#2B1D12] px-3 py-2 text-center font-display text-xl sm:text-2xl tracking-[0.2em] uppercase text-[#2F1E10] placeholder:text-[#9A846B] placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#FFE259]"
                    />

                    <div className="text-center text-[10px] font-medium text-[#EFE0C4]">
                      {t.onlineGuestHint}
                    </div>

                    {onlineStatus === 'joining' ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-[#342419] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#FFE259] text-xs font-display">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>{t.connectingRoom(joinCode)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={onCancelOnline}
                          className="casual-btn casual-btn-red px-2.5 py-1 font-display text-[10px] uppercase"
                        >
                          {t.cancelRoomBtn}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={joinCode.length < 4}
                        onClick={() => onJoinRoom(joinCode)}
                        className="casual-btn casual-btn-green rounded-full py-2.5 px-4 font-display text-base sm:text-lg uppercase tracking-wide flex items-center justify-center gap-2 text-white"
                      >
                        <span className="cartoon-text-shadow-bold text-white">
                          {t.joinBattleBtn}
                        </span>
                        <Play className="w-5 h-5 fill-white text-black drop-shadow-[0_2px_0_#000]" />
                      </button>
                    )}
                  </div>
                )}

                {onlineError && (
                  <div className="rounded-xl bg-[#B83227] border border-[#59130D] px-2.5 py-1.5 text-center text-[11px] font-bold text-white">
                    {onlineError}
                  </div>
                )}
              </div>

              {/* Host can pick Time Control before Guest joins */}
              {onlineTab === 'create' && (
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
              )}
            </>
          ) : (
            <>
              {/* BOT / LOCAL OPTIONS */}
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
                    <span
                      className={config.autoFlipLocal ? 'cartoon-text-shadow-bold text-white' : ''}
                    >
                      {config.autoFlipLocal ? t.on : t.off}
                    </span>
                  </button>
                </div>
              )}

              {/* Compact TIME CONTROL Row */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
