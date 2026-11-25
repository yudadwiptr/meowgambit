import { Chess, type Color, type Move, type PieceSymbol } from 'chess.js';
import type { Difficulty } from '../types/game';

const MATERIAL: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Standard PeSTO / Simplified Piece-Square Tables (White's perspective: rank 8 = row 0, rank 1 = row 7)
const PST: Record<PieceSymbol, number[][]> = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 27, 27, 10, 5, 5],
    [0, 0, 0, 24, 24, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -22, -22, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-30, 5, 12, 16, 16, 12, 5, -30],
    [-30, 5, 16, 22, 22, 16, 5, -30],
    [-30, 5, 16, 22, 22, 16, 5, -30],
    [-30, 5, 12, 16, 16, 12, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 0, 10, 12, 12, 10, 0, -10],
    [-10, 5, 8, 12, 12, 8, 5, -10],
    [-10, 0, 8, 10, 10, 8, 0, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  r: [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [5, 12, 12, 12, 12, 12, 12, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 4, 8, 8, 4, 0, 0],
  ],
  q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-10, 5, 6, 6, 6, 6, 5, -10],
    [-5, 0, 6, 8, 8, 6, 0, -5],
    [0, 0, 6, 8, 8, 6, 0, -5],
    [-10, 0, 6, 6, 6, 6, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

// Simple center control bonus map for Medium difficulty
const CENTER_BONUS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 4, 4, 4, 4, 2, 0],
  [0, 4, 10, 14, 14, 10, 4, 0],
  [0, 4, 14, 24, 24, 14, 4, 0],
  [0, 4, 14, 24, 24, 14, 4, 0],
  [0, 4, 10, 14, 14, 10, 4, 0],
  [0, 2, 4, 4, 4, 4, 2, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

/**
 * Fast static evaluation from White's perspective (+ favours White, - favours Black).
 * Scans the 8x8 board directly without expensive legal-move regeneration.
 */
function evaluateStatic(chess: Chess, difficulty: Difficulty): number {
  const board = chess.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    const row = board[r];
    for (let c = 0; c < 8; c++) {
      const piece = row[c];
      if (!piece) continue;

      let value = MATERIAL[piece.type];

      if (difficulty === 'hard') {
        const pstRow = piece.color === 'w' ? r : 7 - r;
        value += PST[piece.type][pstRow][c];
      } else if (difficulty === 'medium') {
        if (piece.type !== 'k') {
          value += CENTER_BONUS[r][c];
        }
      }

      score += piece.color === 'w' ? value : -value;
    }
  }

  return score;
}

/**
 * MVV-LVA & tactical ordering to maximize Alpha-Beta cutoffs on Hard/Medium.
 */
function orderMoves(moves: Move[], prioritizeCaptures: boolean): Move[] {
  if (!prioritizeCaptures) return moves;

  return [...moves].sort((a, b) => {
    const scoreMove = (m: Move): number => {
      let s = 0;
      if (m.captured) {
        s += 10 * MATERIAL[m.captured] - MATERIAL[m.piece];
      }
      if (m.promotion) {
        s += MATERIAL[m.promotion];
      }
      if (m.san.endsWith('#')) s += 50000;
      else if (m.san.endsWith('+')) s += 45;
      return s;
    };
    return scoreMove(b) - scoreMove(a);
  });
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingWhite: boolean,
  difficulty: Difficulty
): number {
  if (depth === 0) {
    return evaluateStatic(chess, difficulty);
  }

  const rawMoves = chess.moves({ verbose: true });
  if (rawMoves.length === 0) {
    if (chess.inCheck()) {
      // Faster checkmate preferred via +depth bonus
      return maximizingWhite ? -99999 - depth * 10 : 99999 + depth * 10;
    }
    return 0; // Stalemate
  }

  // Fast O(n) capture/promotion/check partitioning at depth 1, full MVV-LVA sort at depth >= 2
  let moves = rawMoves;
  if (difficulty === 'hard' || difficulty === 'medium') {
    if (depth >= 2) {
      moves = orderMoves(rawMoves, true);
    } else {
      const tactical: Move[] = [];
      const quiet: Move[] = [];
      for (let i = 0; i < rawMoves.length; i++) {
        const m = rawMoves[i];
        if (m.captured || m.promotion || m.san.endsWith('#') || m.san.endsWith('+')) {
          tactical.push(m);
        } else {
          quiet.push(m);
        }
      }
      moves = tactical.length > 0 ? tactical.concat(quiet) : rawMoves;
    }
  }

  if (maximizingWhite) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      // Immediate mate shortcut when move SAN ends with '#'
      const evaluation = move.san.endsWith('#')
        ? 99999 + depth * 10
        : minimax(chess, depth - 1, alpha, beta, false, difficulty);
      chess.undo();
      if (evaluation > maxEval) maxEval = evaluation;
      if (evaluation > alpha) alpha = evaluation;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = move.san.endsWith('#')
        ? -99999 - depth * 10
        : minimax(chess, depth - 1, alpha, beta, true, difficulty);
      chess.undo();
      if (evaluation < minEval) minEval = evaluation;
      if (evaluation < beta) beta = evaluation;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Selects the best move for the bot given current FEN and difficulty level:
 * - Easy: Depth 1 + 40% random suboptimal moves
 * - Medium: Depth 2 with material + center-control evaluation
 * - Hard: Depth 3 with full piece-square tables and capture prioritization
 */
export function computeBotMove(fen: string, difficulty: Difficulty): Move | null {
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  const botColor: Color = chess.turn();
  const maximizingWhite = botColor === 'w';

  // Easy: 40% chance of picking a random (often suboptimal) legal move
  if (difficulty === 'easy' && Math.random() < 0.4) {
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }

  const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const ordered = orderMoves(legalMoves, difficulty === 'hard' || difficulty === 'medium');

  let bestScore = maximizingWhite ? -Infinity : Infinity;
  let bestMoves: Move[] = [];

  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of ordered) {
    // Immediate mate-in-1 shortcut
    if (move.san.endsWith('#')) {
      return move;
    }

    chess.move(move);
    const score = minimax(
      chess,
      depth - 1,
      alpha,
      beta,
      !maximizingWhite,
      difficulty
    );
    chess.undo();

    if (maximizingWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
      if (score > alpha) alpha = score;
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
      if (score < beta) beta = score;
    }
  }

  // Tie-break randomly among equal best moves so games feel fresh & lively
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? ordered[0];
}
