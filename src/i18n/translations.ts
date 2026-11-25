import type { Color, PieceSymbol } from 'chess.js';
import type { Difficulty, EmoteKey, TimeControl } from '../types/game';

export type Language = 'id' | 'en';

export interface PieceLocaleText {
  faction: string;
  name: string;
  skillName: string;
  skillDesc: string;
  callout: string;
}

export interface TranslationPack {
  langCode: Language;
  langLabel: string;
  badgeArcade: string;
  badgeVs: string;
  matchSetup: string;
  tagline: string;
  skillCodexBtn: string;
  codexShort: string;
  gameMode: string;
  vsBot: string;
  local2p: string;
  aiDifficulty: string;
  difficultyLabels: Record<Difficulty, { label: string; desc: string }>;
  playAs: string;
  catsShort: string;
  dogsShort: string;
  autoFlipTitle: string;
  autoFlipDesc: string;
  on: string;
  off: string;
  timeControl: string;
  timeLabels: Record<TimeControl, { title: string; sub: string }>;
  startBattle: string;

  // In-game HUD & controls
  catKingdom: string;
  dogGuard: string;
  youLabel: string;
  botPrefix: string;
  p1Label: string;
  p2Label: string;
  checkBadge: string;
  thinkingBadge: string;
  activeTurn: string;
  modeVsBot: (diffLabel: string) => string;
  modeLocal2p: string;
  readyLog: string;
  startLog: string;
  moveUndone: string;
  noMovesTitle: string;
  noMovesHint: string;
  emoteLabel: string;
  undoBtn: string;
  flipBtn: string;
  autoOnBtn: string;
  autoOffBtn: string;
  resetBtn: string;
  usedSkillLog: (unitName: string, skillName: string, suffix: string) => string;

  // Canvas VFX callouts
  vfxCheck: string;
  vfxCheckmate: string;
  vfxBonk: string;
  tapToAttack: string;
  surrenderBtn: string;
  skillLabel: string;
  skillCard1: string;
  skillCard2: string;
  skillHintReady: (san: string) => string;
  surrenderHeadline: string;
  surrenderSub: (winner: Color) => string;

  // Emotes
  emotes: Record<EmoteKey, { label: string; bubble: string }>;

  // Modals
  promoteTitle: string;
  promoteCatSub: string;
  promoteDogSub: string;
  codexTitle: string;
  codexCatTab: string;
  codexDogTab: string;
  codexFooter: string;
  matchOverBadge: string;
  totalPlies: string;
  resultLabel: string;
  drawShort: string;
  catsWinShort: string;
  dogsWinShort: string;
  rematchBtn: string;
  menuBtn: string;

  // Game Over Headlines & Sublines
  checkmateHeadline: string;
  checkmateSub: (winner: Color) => string;
  stalemateHeadline: string;
  stalemateSub: string;
  threefoldHeadline: string;
  threefoldSub: string;
  insufficientHeadline: string;
  insufficientSub: string;
  drawHeadline: string;
  drawSub: string;
  timeoutHeadline: string;
  timeoutSub: (winner: Color) => string;

  // Roster pieces
  pieces: Record<`${Color}-${PieceSymbol}`, PieceLocaleText>;
}

export const TRANSLATIONS: Record<Language, TranslationPack> = {
  id: {
    langCode: 'id',
    langLabel: 'ID',
    badgeArcade: 'ARCADE PWA',
    badgeVs: 'KUCING VS ANJING',
    matchSetup: 'ATUR PERTANDINGAN',
    tagline: 'Aturan Catur Klasik • Jurus VFX Meledak',
    skillCodexBtn: 'BUKU JURUS (12)',
    codexShort: 'JURUS',
    gameMode: 'MODE PERMAINAN',
    vsBot: 'LAWAN BOT',
    local2p: '2P LOKAL',
    aiDifficulty: 'LEVEL BOT AI',
    difficultyLabels: {
      easy: { label: 'MUDAH', desc: 'Depth 1 • Santai' },
      medium: { label: 'SEDANG', desc: 'Depth 2 • Taktis' },
      hard: { label: 'SULIT', desc: 'Depth 3 • Master' },
    },
    playAs: 'PILIH KUBU',
    catsShort: 'KUCING',
    dogsShort: 'ANJING',
    autoFlipTitle: 'PUTAR PAPAN OTOMATIS',
    autoFlipDesc: 'Papan berputar otomatis setiap pergantian giliran',
    on: 'AKTIF',
    off: 'MATI',
    timeControl: 'KONTROL WAKTU',
    timeLabels: {
      blitz: { title: 'KILAT', sub: '3 MENIT' },
      rapid: { title: 'CEPAT', sub: '10 MENIT' },
      unlimited: { title: 'SANTAI', sub: 'TANPA JAM' },
    },
    startBattle: 'MULAI TARUNG!',

    catKingdom: 'KERAJAAN KUCING',
    dogGuard: 'GARDA ANJING',
    youLabel: 'KAMU',
    botPrefix: 'BOT',
    p1Label: 'P1',
    p2Label: 'P2',
    checkBadge: 'SKAK!',
    thinkingBadge: 'MIKIR...',
    activeTurn: '● GILIRAN AKTIF',
    modeVsBot: (d) => `LAWAN BOT (${d})`,
    modeLocal2p: '2 PEMAIN LOKAL',
    readyLog: 'SIAP BERTARUNG!',
    startLog: 'MULAI! KETUK BIDAK UNTUK MELANGKAH',
    moveUndone: 'LANGKAH DIBATALKAN',
    noMovesTitle: 'BELUM ADA LANGKAH',
    noMovesHint:
      'Ketuk bidak Kucing atau Anjing untuk melihat langkah legal. Memakan bidak & Skak memicu jurus VFX 1,2 detik!',
    emoteLabel: 'EMOTE',
    undoBtn: 'BATAL',
    flipBtn: 'PUTAR',
    autoOnBtn: 'AUTO:ON',
    autoOffBtn: 'AUTO:OFF',
    resetBtn: 'ULANG',
    usedSkillLog: (unit, skill, suffix) => `${unit} KELUARKAN ${skill}!${suffix}`,

    vfxCheck: 'SKAK!!',
    vfxCheckmate: 'SKAKMAT!!',
    vfxBonk: 'BONK!',
    tapToAttack: 'TAP UNTUK SERANG!',
    surrenderBtn: 'MENYERAH',
    skillLabel: 'SKILL',
    skillCard1: 'Cakar Kilat',
    skillCard2: 'Lompat Ganda',
    skillHintReady: (san) => `SARAN JURUS: ${san}`,
    surrenderHeadline: 'MENYERAH!',
    surrenderSub: (w) =>
      w === 'w'
        ? 'Garda Anjing menyerah — Kerajaan Kucing menang!'
        : 'Kerajaan Kucing menyerah — Garda Anjing menang!',

    emotes: {
      meow: { label: 'Meong!', bubble: 'MEONG!! 🐾' },
      hiss: { label: 'Desis!', bubble: 'DESISSS! ⚡' },
      woof: { label: 'Guk!', bubble: 'GUK GUK!! 🦴' },
      gg: { label: 'GG!', bubble: 'GG EZ!! 🏆' },
    },

    promoteTitle: 'PROMOSI BIDAK!',
    promoteCatSub: 'Evolusi Kerajaan Kucing',
    promoteDogSub: 'Evolusi Garda Anjing',
    codexTitle: 'BUKU JURUS & ROSTER',
    codexCatTab: '🐾 KERAJAAN KUCING (PUTIH)',
    codexDogTab: '🦴 GARDA ANJING (HITAM)',
    codexFooter: '100% Aturan Catur Klasik • Makan Bidak atau Skak memicu Animasi Jurus!',
    matchOverBadge: 'PERTANDINGAN SELESAI',
    totalPlies: 'TOTAL LANGKAH',
    resultLabel: 'HASIL',
    drawShort: 'SERI',
    catsWinShort: 'KUCING MENANG',
    dogsWinShort: 'ANJING MENANG',
    rematchBtn: 'MAIN LAGI',
    menuBtn: 'MENU',

    checkmateHeadline: 'SKAKMAT!!',
    checkmateSub: (w) =>
      w === 'w'
        ? 'Kerajaan Kucing menaklukkan papan!'
        : 'Garda Anjing meraih kemenangan mutlak!',
    stalemateHeadline: 'PAT (SERI)!',
    stalemateSub: 'Tidak ada langkah legal tersisa — pertandingan seri.',
    threefoldHeadline: 'ULANG 3x!',
    threefoldSub: 'Posisi berulang tiga kali — pertandingan seri.',
    insufficientHeadline: 'SERI!',
    insufficientSub: 'Bidak tidak cukup untuk melakukan skakmat.',
    drawHeadline: 'PERTANDINGAN SERI!',
    drawSub: 'Aturan 50 langkah atau posisi buntu.',
    timeoutHeadline: 'WAKTU HABIS!!',
    timeoutSub: (w) =>
      w === 'w'
        ? 'Waktu Garda Anjing habis — Kerajaan Kucing menang!'
        : 'Waktu Kerajaan Kucing habis — Garda Anjing menang!',

    pieces: {
      'w-p': {
        faction: 'Kerajaan Kucing',
        name: 'Kitten Squire',
        skillName: 'Cakaran Kilat',
        skillDesc: 'Tebasan cakar diagonal putih & hijau neon melesat cepat di petak target.',
        callout: 'CAKAR!',
      },
      'w-n': {
        faction: 'Kerajaan Kucing',
        name: 'Cat Knight',
        skillName: 'Terkaman Neon',
        skillDesc: 'Lompatan parabola dengan jejak cakar #CCFF00 menyala & gelombang kejut.',
        callout: 'TERKAM!',
      },
      'w-r': {
        faction: 'Kerajaan Kucing',
        name: 'Shield Cat',
        skillName: 'Bantingan Berat',
        skillDesc: 'Hantaman jatuh vertikal dengan getaran kotak dan ledakan debu.',
        callout: 'BANTING!!',
      },
      'w-b': {
        faction: 'Kerajaan Kucing',
        name: 'Witch Cat',
        skillName: 'Cakar Laser',
        skillDesc: 'Sinar energi hot-magenta #FF2E7E menembak diagonal dari asal ke target.',
        callout: 'ZAP!!',
      },
      'w-q': {
        faction: 'Kerajaan Kucing',
        name: 'Angora Empress',
        skillName: 'Amukan Ratu',
        skillDesc: 'Ledakan bintang neon multi-cakar disertai guncangan layar 4px.',
        callout: 'AMUK RATU!',
      },
      'w-k': {
        faction: 'Kerajaan Kucing',
        name: 'Crowned Lion',
        skillName: 'Auman Raja',
        skillDesc: 'Cincin sonik emas #FFE600 mengembang saat melangkah atau lolos dari skak.',
        callout: 'AUM!!',
      },
      'b-p': {
        faction: 'Garda Anjing',
        name: 'Pup Cadet',
        skillName: 'Gigitan Kilat',
        skillDesc: 'Rahang tajam menggigit seketika dengan percikan energi.',
        callout: 'GIGIT!',
      },
      'b-n': {
        faction: 'Garda Anjing',
        name: 'Boxer Rogue',
        skillName: 'Tabrakan Kilat',
        skillDesc: 'Garis kecepatan cyan #00E5FF dan hantaman telak ke target.',
        callout: 'KO TABRAK!',
      },
      'b-r': {
        faction: 'Garda Anjing',
        name: 'Bulldog Tank',
        skillName: 'Hantaman Besi',
        skillDesc: 'Gelombang benturan perisai baja berat dan percikan logam.',
        callout: 'HANTAM!',
      },
      'b-b': {
        faction: 'Garda Anjing',
        name: 'Hound Mystic',
        skillName: 'Sinar Lolongan',
        skillDesc: 'Pulsa energi cyan elektrik menembus diagonal melintasi papan.',
        callout: 'LOLONG!!',
      },
      'b-q': {
        faction: 'Garda Anjing',
        name: 'Doberman General',
        skillName: 'Serangan Alfa',
        skillDesc: 'Kombo tebasan silang cepat dengan pop-up komik BONK! & TEBAS!!',
        callout: 'TEBAS!!',
      },
      'b-k': {
        faction: 'Garda Anjing',
        name: 'Mastiff Monarch',
        skillName: 'Aura Benteng',
        skillDesc: 'Gelombang kejut radial pelindung saat melangkah atau keluar dari skak.',
        callout: 'BENTENG!',
      },
    },
  },

  en: {
    langCode: 'en',
    langLabel: 'EN',
    badgeArcade: 'ARCADE PWA',
    badgeVs: 'CATS VS DOGS',
    matchSetup: 'MATCH SETUP',
    tagline: 'Classic Chess Rules • Explosive Skill VFX',
    skillCodexBtn: 'SKILL CODEX (12)',
    codexShort: 'CODEX',
    gameMode: 'GAME MODE',
    vsBot: 'VS BOT',
    local2p: '2P LOCAL',
    aiDifficulty: 'AI DIFFICULTY',
    difficultyLabels: {
      easy: { label: 'EASY', desc: 'Depth 1 • Playful' },
      medium: { label: 'MEDIUM', desc: 'Depth 2 • Tactical' },
      hard: { label: 'HARD', desc: 'Depth 3 • Grandmaster' },
    },
    playAs: 'PLAY AS',
    catsShort: 'CATS',
    dogsShort: 'DOGS',
    autoFlipTitle: 'AUTO-FLIP BOARD',
    autoFlipDesc: 'Rotate board automatically between turns',
    on: 'ON',
    off: 'OFF',
    timeControl: 'TIME CONTROL',
    timeLabels: {
      blitz: { title: 'BLITZ', sub: '3 MIN' },
      rapid: { title: 'RAPID', sub: '10 MIN' },
      unlimited: { title: 'CASUAL', sub: 'NO CLOCK' },
    },
    startBattle: 'START BATTLE!',

    catKingdom: 'CAT KINGDOM',
    dogGuard: 'DOG GUARD',
    youLabel: 'YOU',
    botPrefix: 'BOT',
    p1Label: 'P1',
    p2Label: 'P2',
    checkBadge: 'CHECK!',
    thinkingBadge: 'THINKING...',
    activeTurn: '● ACTIVE TURN',
    modeVsBot: (d) => `VS BOT (${d})`,
    modeLocal2p: 'LOCAL 2-PLAYER',
    readyLog: 'READY FOR BATTLE!',
    startLog: 'FIGHT! TAP A UNIT TO MOVE',
    moveUndone: 'MOVE UNDONE',
    noMovesTitle: 'NO MOVES YET',
    noMovesHint:
      'Tap any Cat or Dog unit to view legal moves. Captures & Checks trigger 1.2s arcade skills!',
    emoteLabel: 'EMOTE',
    undoBtn: 'UNDO',
    flipBtn: 'FLIP',
    autoOnBtn: 'AUTO:ON',
    autoOffBtn: 'AUTO:OFF',
    resetBtn: 'RESET',
    usedSkillLog: (unit, skill, suffix) => `${unit} USED ${skill}!${suffix}`,

    vfxCheck: 'CHECK!!',
    vfxCheckmate: 'CHECKMATE!!',
    vfxBonk: 'BONK!',
    tapToAttack: 'TAP TO ATTACK!',
    surrenderBtn: 'SURRENDER',
    skillLabel: 'SKILL',
    skillCard1: 'Scratch Burst',
    skillCard2: 'Double Jump',
    skillHintReady: (san) => `SKILL HINT: ${san}`,
    surrenderHeadline: 'SURRENDER!',
    surrenderSub: (w) =>
      w === 'w'
        ? 'Dog Guard surrendered — Cat Kingdom wins!'
        : 'Cat Kingdom surrendered — Dog Guard wins!',

    emotes: {
      meow: { label: 'Meow!', bubble: 'MEOW!! 🐾' },
      hiss: { label: 'Hiss!', bubble: 'HISSSS! ⚡' },
      woof: { label: 'Woof!', bubble: 'WOOF!! 🦴' },
      gg: { label: 'GG!', bubble: 'GG EZ!! 🏆' },
    },

    promoteTitle: 'PROMOTE UNIT!',
    promoteCatSub: 'Cat Kingdom Evolution',
    promoteDogSub: 'Dog Guard Evolution',
    codexTitle: 'SKILL CODEX & ROSTER',
    codexCatTab: '🐾 CAT KINGDOM (WHITE)',
    codexDogTab: '🦴 DOG GUARD (BLACK)',
    codexFooter: '100% Classic Chess Rules • Capture or Check triggers Cinematic Skill VFX!',
    matchOverBadge: 'MATCH OVER',
    totalPlies: 'TOTAL PLIES',
    resultLabel: 'RESULT',
    drawShort: 'DRAW',
    catsWinShort: 'CATS WIN',
    dogsWinShort: 'DOGS WIN',
    rematchBtn: 'REMATCH',
    menuBtn: 'MENU',

    checkmateHeadline: 'CHECKMATE!!',
    checkmateSub: (w) =>
      w === 'w' ? 'Cat Kingdom conquers the board!' : 'Dog Guard claims total victory!',
    stalemateHeadline: 'STALEMATE!',
    stalemateSub: 'No legal moves remaining — match drawn.',
    threefoldHeadline: '3x REPETITION!',
    threefoldSub: 'Position repeated three times — match drawn.',
    insufficientHeadline: 'DRAW!',
    insufficientSub: 'Insufficient material to deliver checkmate.',
    drawHeadline: 'DRAW MATCH!',
    drawSub: '50-move rule or dead position.',
    timeoutHeadline: "TIME'S UP!!",
    timeoutSub: (w) =>
      w === 'w'
        ? 'Dog Guard ran out of time — Cat Kingdom wins!'
        : 'Cat Kingdom ran out of time — Dog Guard wins!',

    pieces: {
      'w-p': {
        faction: 'Cat Kingdom',
        name: 'Kitten Squire',
        skillName: 'Quick Scratch',
        skillDesc: 'Fast white & acid-lime diagonal claw slash across the target tile.',
        callout: 'SCRATCH!',
      },
      'w-n': {
        faction: 'Cat Kingdom',
        name: 'Cat Knight',
        skillName: 'Neon Pounce',
        skillDesc: 'Parabolic jump arc with glowing #CCFF00 paw trail and impact shockwave.',
        callout: 'POUNCE!',
      },
      'w-r': {
        faction: 'Cat Kingdom',
        name: 'Shield Cat',
        skillName: 'Heavy Slam',
        skillDesc: 'Vertical drop with square ground-pound tremor and comic dust burst.',
        callout: 'SLAM!!',
      },
      'w-b': {
        faction: 'Cat Kingdom',
        name: 'Witch Cat',
        skillName: 'Laser Paw',
        skillDesc: 'Diagonal #FF2E7E hot-magenta energy beam from origin to target square.',
        callout: 'ZAP!!',
      },
      'w-q': {
        faction: 'Cat Kingdom',
        name: 'Angora Empress',
        skillName: 'Royal Fury',
        skillDesc: 'Multi-claw neon star explosion with intense 4px screen shake.',
        callout: 'ROYAL FURY!',
      },
      'w-k': {
        faction: 'Cat Kingdom',
        name: 'Crowned Lion',
        skillName: "King's Roar",
        skillDesc: 'Expanding golden #FFE600 sonic ring when moving, capturing, or escaping check.',
        callout: 'ROAR!!',
      },
      'b-p': {
        faction: 'Dog Guard',
        name: 'Pup Cadet',
        skillName: 'Snap Bite',
        skillDesc: 'Sharp chomp jaw snap with crisp impact sparks.',
        callout: 'CHOMP!',
      },
      'b-n': {
        faction: 'Dog Guard',
        name: 'Boxer Rogue',
        skillName: 'Dash Tackle',
        skillDesc: 'Electric cyan #00E5FF speed lines and devastating body slam.',
        callout: 'KO SLAM!',
      },
      'b-r': {
        faction: 'Dog Guard',
        name: 'Bulldog Tank',
        skillName: 'Iron Bash',
        skillDesc: 'Heavy armored shield-wall impact wave and metallic sparks.',
        callout: 'IRON BASH!',
      },
      'b-b': {
        faction: 'Dog Guard',
        name: 'Hound Mystic',
        skillName: 'Howl Beam',
        skillDesc: 'Diagonal electric cyan energy pulse piercing across the board.',
        callout: 'HOWL!!',
      },
      'b-q': {
        faction: 'Dog Guard',
        name: 'Doberman General',
        skillName: 'Alpha Strike',
        skillDesc: 'Rapid cross-slash combo with comic BONK! / SLASH! pop-up impact.',
        callout: 'SLASH!!',
      },
      'b-k': {
        faction: 'Dog Guard',
        name: 'Mastiff Monarch',
        skillName: 'Bastion Aura',
        skillDesc: 'Heavy radial shockwave shielding the monarch when moving or escaping check.',
        callout: 'BASTION!',
      },
    },
  },
};

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'id';
  const saved = window.localStorage.getItem('meowgambit_lang');
  if (saved === 'en' || saved === 'id') return saved;
  return 'id';
}
