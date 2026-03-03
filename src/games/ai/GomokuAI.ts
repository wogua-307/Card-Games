/**
 * GomokuAI.ts — Heuristic Gomoku AI Engine
 *
 * Algorithm: Threat-space heuristic scoring with optional Minimax (depth 2).
 * Runs synchronously — call from a short setTimeout to avoid UI blockage.
 */

const BOARD_SIZE = 15;

type Board = (number | null)[][];

// ─── Score table for consecutive stones with open / semi-open ends ───────────
// Pattern: count of own stones in a line, blockedEnds (0/1/2)
const SCORE_TABLE: Record<string, number> = {
  // Five in a row — WIN
  '5_0': 1_000_000, '5_1': 1_000_000, '5_2': 1_000_000,
  // Live four
  '4_0': 50_000,
  // Blocked four
  '4_1': 5_000, '4_2': 100,
  // Live three
  '3_0': 3_000,
  // Blocked three
  '3_1': 300, '3_2': 10,
  // Live two
  '2_0': 200,
  // Blocked two
  '2_1': 20, '2_2': 1,
  // Singles
  '1_0': 10, '1_1': 1, '1_2': 0,
};

function getScore(count: number, blocked: number): number {
  const key = `${Math.min(count, 5)}_${Math.min(blocked, 2)}`;
  return SCORE_TABLE[key] ?? 0;
}

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;

/** Compute a heuristic board score for `player` relative to `opponent`. */
function evaluateBoard(board: Board, player: number, opponent: number): number {
  let score = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== player) continue;

      for (const [dr, dc] of DIRS) {
        let count = 1;
        let blocked = 0;

        // Count forward
        for (let i = 1; i < 5; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blocked++; break; }
          if (board[nr][nc] === player) count++;
          else { if (board[nr][nc] === opponent) blocked++; break; }
        }

        // Count backward
        for (let i = 1; i < 5; i++) {
          const nr = r - dr * i, nc = c - dc * i;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blocked++; break; }
          if (board[nr][nc] === player) count++;
          else { if (board[nr][nc] === opponent) blocked++; break; }
        }

        score += getScore(count, blocked);
      }
    }
  }

  return score;
}

/** Get all candidate cells to evaluate (empty cells adjacent to existing stones). */
function getCandidates(board: Board): [number, number][] {
  const candidates = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) continue;
      // Add all empty cells within distance 2
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === null) {
            candidates.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  // If the board is empty, start from the center
  if (candidates.size === 0) {
    const mid = Math.floor(BOARD_SIZE / 2);
    candidates.add(`${mid},${mid}`);
  }

  return [...candidates].map(s => s.split(',').map(Number) as [number, number]);
}

/** Check if a player has won with a stone at (r, c). */
function checkWin(r: number, c: number, player: number, board: Board): boolean {
  for (const [dr, dc] of DIRS) {
    let cnt = 1;
    for (let i = 1; i < 5; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) cnt++;
      else break;
    }
    for (let i = 1; i < 5; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) cnt++;
      else break;
    }
    if (cnt >= 5) return true;
  }
  return false;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Main entry point: compute best move for `aiPlayer`.
 * Returns [row, col].
 */
export function getBestMove(
  board: Board,
  aiPlayer: number,
  difficulty: AIDifficulty = 'medium'
): [number, number] {
  const humanPlayer = aiPlayer === 0 ? 1 : 0;
  const candidates = getCandidates(board);

  if (difficulty === 'easy') {
    // Easy: pick random from top 5 candidates to feel less robotic
    const scored = candidates.map(([r, c]) => {
      const b = board.map(row => [...row]);
      b[r][c] = aiPlayer;
      return { r, c, score: evaluateBoard(b, aiPlayer, humanPlayer) - evaluateBoard(b, humanPlayer, aiPlayer) };
    });
    scored.sort((a, b) => b.score - a.score);
    const pool = scored.slice(0, Math.min(5, scored.length));
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return [chosen.r, chosen.c];
  }

  // Medium & Hard: greedy single-step with combined attack + defense scoring
  let bestScore = -Infinity;
  let bestMove: [number, number] = candidates[0];

  for (const [r, c] of candidates) {
    // 1. Immediate win check (attack)
    const bAtk = board.map(row => [...row]);
    bAtk[r][c] = aiPlayer;
    if (checkWin(r, c, aiPlayer, bAtk)) return [r, c];

    // 2. Block human win (defense)
    const bDef = board.map(row => [...row]);
    bDef[r][c] = humanPlayer;
    if (checkWin(r, c, humanPlayer, bDef)) {
      bestMove = [r, c];
      bestScore = 900_000; // Forced defensive move
      break;
    }

    // 3. Combined heuristic: attack score + weighted defense score
    const atkScore = evaluateBoard(bAtk, aiPlayer, humanPlayer);
    const defScore = evaluateBoard(bDef, humanPlayer, aiPlayer);
    const combined = atkScore + defScore * (difficulty === 'hard' ? 1.2 : 0.9);

    if (combined > bestScore) {
      bestScore = combined;
      bestMove = [r, c];
    }
  }

  return bestMove;
}
