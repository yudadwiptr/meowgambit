import { computeBotMove } from './chessAI';
import type { Difficulty } from '../types/game';

interface BotRequest {
  id: number;
  fen: string;
  difficulty: Difficulty;
}

self.onmessage = (e: MessageEvent<BotRequest>) => {
  const { id, fen, difficulty } = e.data;
  const move = computeBotMove(fen, difficulty);
  self.postMessage({
    id,
    move: move
      ? {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        }
      : null,
  });
};
