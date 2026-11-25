import type { Color, PieceSymbol } from 'chess.js';
import type { EmoteKey, PieceMeta, TimeControl } from '../types/game';

export const TIME_CONTROL_SECONDS: Record<TimeControl, number | null> = {
  blitz: 180,
  rapid: 600,
  unlimited: null,
};

export const TIME_CONTROL_LABELS: Record<TimeControl, { title: string; sub: string }> = {
  blitz: { title: 'BLITZ', sub: '3 MIN' },
  rapid: { title: 'RAPID', sub: '10 MIN' },
  unlimited: { title: 'CASUAL', sub: 'NO CLOCK' },
};

export const EMOTE_DEFINITIONS: Record<
  EmoteKey,
  { label: string; bubble: string; bg: string; factionHint: 'cat' | 'dog' | 'any' }
> = {
  meow: { label: 'Meow!', bubble: 'MEOW!! 🐾', bg: '#CCFF00', factionHint: 'cat' },
  hiss: { label: 'Hiss!', bubble: 'HISSSS! ⚡', bg: '#FF2E7E', factionHint: 'cat' },
  woof: { label: 'Woof!', bubble: 'WOOF!! 🦴', bg: '#00E5FF', factionHint: 'dog' },
  gg: { label: 'GG!', bubble: 'GG EZ!! 🏆', bg: '#FFE600', factionHint: 'any' },
};

const ROSTER_MAP: Record<`${Color}-${PieceSymbol}`, PieceMeta> = {
  'w-p': {
    color: 'w',
    type: 'p',
    faction: 'Cat Kingdom',
    name: 'Kitten Squire',
    roleCode: 'P',
    skillName: 'Quick Scratch',
    skillDesc: 'Fast white & acid-lime diagonal claw slash across the target tile.',
    callout: 'SCRATCH!',
    accentColor: '#CCFF00',
    triggersShake: false,
  },
  'w-n': {
    color: 'w',
    type: 'n',
    faction: 'Cat Kingdom',
    name: 'Cat Knight',
    roleCode: 'N',
    skillName: 'Neon Pounce',
    skillDesc: 'Parabolic jump arc with glowing #CCFF00 paw trail and impact shockwave.',
    callout: 'POUNCE!',
    accentColor: '#CCFF00',
    triggersShake: true,
  },
  'w-r': {
    color: 'w',
    type: 'r',
    faction: 'Cat Kingdom',
    name: 'Shield Cat',
    roleCode: 'R',
    skillName: 'Heavy Slam',
    skillDesc: 'Vertical drop with square ground-pound tremor and comic dust burst.',
    callout: 'SLAM!!',
    accentColor: '#FFE600',
    triggersShake: true,
  },
  'w-b': {
    color: 'w',
    type: 'b',
    faction: 'Cat Kingdom',
    name: 'Witch Cat',
    roleCode: 'B',
    skillName: 'Laser Paw',
    skillDesc: 'Diagonal #FF2E7E hot-magenta energy beam from origin to target square.',
    callout: 'ZAP!!',
    accentColor: '#FF2E7E',
    triggersShake: false,
  },
  'w-q': {
    color: 'w',
    type: 'q',
    faction: 'Cat Kingdom',
    name: 'Angora Empress',
    roleCode: 'Q',
    skillName: 'Royal Fury',
    skillDesc: 'Multi-claw neon star explosion with intense 4px screen shake.',
    callout: 'ROYAL FURY!',
    accentColor: '#FF2E7E',
    triggersShake: true,
  },
  'w-k': {
    color: 'w',
    type: 'k',
    faction: 'Cat Kingdom',
    name: 'Crowned Lion',
    roleCode: 'K',
    skillName: "King's Roar",
    skillDesc: 'Expanding golden #FFE600 sonic ring when moving, capturing, or escaping check.',
    callout: 'ROAR!!',
    accentColor: '#FFE600',
    triggersShake: false,
  },
  'b-p': {
    color: 'b',
    type: 'p',
    faction: 'Dog Guard',
    name: 'Pup Cadet',
    roleCode: 'P',
    skillName: 'Snap Bite',
    skillDesc: 'Sharp chomp jaw snap with crisp impact sparks.',
    callout: 'CHOMP!',
    accentColor: '#00E5FF',
    triggersShake: false,
  },
  'b-n': {
    color: 'b',
    type: 'n',
    faction: 'Dog Guard',
    name: 'Boxer Rogue',
    roleCode: 'N',
    skillName: 'Dash Tackle',
    skillDesc: 'Electric cyan #00E5FF speed lines and devastating body slam.',
    callout: 'KO SLAM!',
    accentColor: '#00E5FF',
    triggersShake: true,
  },
  'b-r': {
    color: 'b',
    type: 'r',
    faction: 'Dog Guard',
    name: 'Bulldog Tank',
    roleCode: 'R',
    skillName: 'Iron Bash',
    skillDesc: 'Heavy armored shield-wall impact wave and metallic sparks.',
    callout: 'IRON BASH!',
    accentColor: '#FFE600',
    triggersShake: true,
  },
  'b-b': {
    color: 'b',
    type: 'b',
    faction: 'Dog Guard',
    name: 'Hound Mystic',
    roleCode: 'B',
    skillName: 'Howl Beam',
    skillDesc: 'Diagonal electric cyan energy pulse piercing across the board.',
    callout: 'HOWL!!',
    accentColor: '#00E5FF',
    triggersShake: false,
  },
  'b-q': {
    color: 'b',
    type: 'q',
    faction: 'Dog Guard',
    name: 'Doberman General',
    roleCode: 'Q',
    skillName: 'Alpha Strike',
    skillDesc: 'Rapid cross-slash combo with comic BONK! / SLASH! pop-up impact.',
    callout: 'SLASH!!',
    accentColor: '#00E5FF',
    triggersShake: true,
  },
  'b-k': {
    color: 'b',
    type: 'k',
    faction: 'Dog Guard',
    name: 'Mastiff Monarch',
    roleCode: 'K',
    skillName: 'Bastion Aura',
    skillDesc: 'Heavy radial shockwave shielding the monarch when moving or escaping check.',
    callout: 'BASTION!',
    accentColor: '#00E5FF',
    triggersShake: false,
  },
};

export function getPieceMeta(color: Color, type: PieceSymbol): PieceMeta {
  return ROSTER_MAP[`${color}-${type}`];
}

export const PIECE_ORDER: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p'];

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const ALL_ROSTER_LIST: PieceMeta[] = [
  ...PIECE_ORDER.map((t) => ROSTER_MAP[`w-${t}`]),
  ...PIECE_ORDER.map((t) => ROSTER_MAP[`b-${t}`]),
];
