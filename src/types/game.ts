import type { Color, PieceSymbol, Square } from 'chess.js';

export type GameMode = 'bot' | 'local' | 'online';
export type GameRuleset = 'classic' | 'arcade';
export type ActiveSkillType = 'scratch' | 'double_jump';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TimeControl = 'blitz' | 'rapid' | 'unlimited';
export type EmoteKey = 'meow' | 'hiss' | 'woof' | 'gg';
export type OnlineRole = 'host' | 'guest';
export type OnlineConnectionStatus =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'connected'
  | 'disconnected'
  | 'error';

export type RematchState = 'none' | 'offered_by_me' | 'offered_by_opponent';

export type OnlineMessage =
  | { type: 'hello' }
  | { type: 'start'; timeControl: TimeControl; ruleset: GameRuleset }
  | {
      type: 'move';
      from: Square;
      to: Square;
      promotion?: 'q' | 'r' | 'b' | 'n';
      fen: string;
      clocks?: { w: number | null; b: number | null };
      energy?: { w: number; b: number };
      doubleJumpTriggered?: boolean;
    }
  | {
      type: 'skill_scratch';
      caster: Color;
      targetSq: Square;
      pushedTo?: Square;
      destroyed?: boolean;
      fen: string;
      energy: { w: number; b: number };
    }
  | {
      type: 'skill_double_jump';
      caster: Color;
      energy: { w: number; b: number };
    }
  | { type: 'emote'; emote: EmoteKey; color: Color }
  | { type: 'surrender'; loserColor: Color }
  | { type: 'timeout'; loserColor: Color }
  | { type: 'rematch_offer' }
  | { type: 'rematch_accept' };

export interface GameConfig {
  mode: GameMode;
  ruleset: GameRuleset;
  difficulty: Difficulty;
  timeControl: TimeControl;
  playerColor: Color; // Used in 'bot' mode
  autoFlipLocal: boolean; // Used in 'local' mode
}

export interface PieceMeta {
  color: Color;
  type: PieceSymbol;
  faction: 'Cat Kingdom' | 'Dog Guard';
  name: string;
  roleCode: string;
  skillName: string;
  skillDesc: string;
  callout: string;
  accentColor: string;
  triggersShake: boolean;
}

export interface SkillVfxEvent {
  id: number;
  pieceColor: Color;
  pieceType: PieceSymbol;
  from: Square;
  to: Square;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isKingEscapeOrMove: boolean;
  skillName: string;
  callout: string;
  checkLabel: string;
  checkmateLabel: string;
  bonkLabel: string;
  accentColor: string;
  triggersShake: boolean;
  timestamp: number;
}

export interface ActiveEmote {
  id: number;
  color: Color;
  emote: EmoteKey;
  text: string;
  timestamp: number;
}

export interface PendingPromotion {
  from: Square;
  to: Square;
  color: Color;
}

export type GameOverReason =
  | 'checkmate'
  | 'stalemate'
  | 'threefold'
  | 'insufficient'
  | 'draw'
  | 'timeout'
  | 'resign';

export interface GameOutcome {
  winner: Color | 'draw';
  reason: GameOverReason;
  headline: string;
  subline: string;
}

export interface MoveRecord {
  san: string;
  color: Color;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  moveNumber: number;
}
