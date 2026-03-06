import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, ArrowLeft } from 'lucide-react';

interface LudoProps {
  key?: number | string;
  onGameOver?: (result: string) => void;
  onBack?: () => void;
}

// ─── Figma Colors ─────────────────────────────────────────────────
const COLORS = {
  red: { bg: '#BF4848', light: '#F5BFBF', name: '红方' },
  green: { bg: '#63CA5A', light: '#C0EFBC', name: '绿方' },
  blue: { bg: '#408FEA', light: '#B8D8FA', name: '蓝方' },
  yellow: { bg: '#ECBC41', light: '#FAE9A8', name: '黄方' },
} as const;

type PlayerColor = keyof typeof COLORS;
const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];

// ─── Game Constants ────────────────────────────────────────────────
const PIECES_PER_PLAYER = 4;
const NUM_PLAYERS = 4;
const TOTAL_PATH = 52;
const HOME_COL_LEN = 5; // 5 steps in the home column (52..56), 57 = done

// Each player's absolute entry on the MAIN_PATH array
const PLAYER_ENTRY: Record<PlayerColor, number> = { red: 0, green: 13, blue: 26, yellow: 39 };
// Absolute index of the last main-path square before the home column
const PLAYER_HOME_ENTRY: Record<PlayerColor, number> = { red: 51, green: 12, blue: 25, yellow: 38 };
// Safe square absolute indices (cannot capture here)
const SAFE_ABS = new Set<number>([0, 13, 26, 39]);

// ─── Piece State ───────────────────────────────────────────────────
// pos = -1            → parked in base
// pos = 0..51         → relative steps from own ENTRY (absolute = (pos+ENTRY[color])%52)
// pos = 52..56        → in home column, index = pos-52 (0=entry cell, 4=last)
// pos = 57            → finished ✓
interface Piece {
  id: number;          // 0..15 globally unique
  owner: PlayerColor;
  pos: number;
}

function createPieces(): Piece[] {
  const out: Piece[] = [];
  let id = 0;
  for (const c of PLAYER_COLORS)
    for (let i = 0; i < PIECES_PER_PLAYER; i++)
      out.push({ id: id++, owner: c, pos: -1 });
  return out;
}

// ─── Board Visual Layout ───────────────────────────────────────────
const BOARD_GRID = 15;

// 52-cell main path: [row, col] on a 15×15 grid.  Standard Ludo layout.
// Red enters at index 0, Green at 13, Blue at 26, Yellow at 39.
const MAIN_PATH: [number, number][] = [
  // Red's row → going right then turning up    (indices 0-12)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  // Green's row → going down then right        (indices 13-25)
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  // Blue's row → going left then down          (indices 26-38)
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  // Yellow's row → going up then left          (indices 39-51)
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
];

// Home column cells per color (indices 0..4, displayed at pos 52..56)
const HOME_PATH: Record<PlayerColor, [number, number][]> = {
  red: [[8, 1], [8, 2], [8, 3], [8, 4], [8, 5]],
  green: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6]],
  blue: [[6, 13], [6, 12], [6, 11], [6, 10], [6, 9]],
  yellow: [[13, 8], [12, 8], [11, 8], [10, 8], [9, 8]],
};

// Parking spots (base) per color: 4 spots
const PARKING: Record<PlayerColor, [number, number][]> = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  green: [[2, 11], [2, 12], [3, 11], [3, 12]],
  blue: [[11, 11], [11, 12], [12, 11], [12, 12]],
  yellow: [[11, 2], [11, 3], [12, 2], [12, 3]],
};

const S = 36; // cell size px

// ─── Game Logic Helpers ────────────────────────────────────────────
function getAbsIdx(piece: Piece): number {
  // Absolute position on MAIN_PATH (only valid when pos 0..51)
  return (piece.pos + PLAYER_ENTRY[piece.owner]) % TOTAL_PATH;
}

function canMove(piece: Piece, dice: number): boolean {
  if (piece.pos === 57) return false;
  if (piece.pos === -1) return dice === 6;
  if (piece.pos >= 52) {
    // In home column — don't overshoot
    return (piece.pos + dice) <= 57;
  }
  // Main path — compute forward distance without overshooting home column
  const stepsToHomeEntry = (PLAYER_HOME_ENTRY[piece.owner] - PLAYER_ENTRY[piece.owner] + TOTAL_PATH) % TOTAL_PATH + 1;
  const curSteps = piece.pos; // relative steps already taken
  // Can move if the move doesn't overshoot the home column
  const newSteps = curSteps + dice;
  return newSteps <= stepsToHomeEntry + HOME_COL_LEN;
}

function movePiece(piece: Piece, dice: number): number {
  if (piece.pos === -1) return 0; // relative pos 0 = at entry square
  if (piece.pos >= 52) return Math.min(piece.pos + dice, 57);

  const stepsToHomeEntry = (PLAYER_HOME_ENTRY[piece.owner] - PLAYER_ENTRY[piece.owner] + TOTAL_PATH) % TOTAL_PATH + 1;
  const newSteps = piece.pos + dice;

  if (newSteps > stepsToHomeEntry) {
    // Enter home column
    return 52 + (newSteps - stepsToHomeEntry - 1); // 52=first home cell
  }
  return newSteps % TOTAL_PATH; // stay on main path
}

// ─── SVG Cell Color ───────────────────────────────────────────────
function cellBg(r: number, c: number): string {
  // Corner home areas
  if (r >= 1 && r <= 4 && c >= 1 && c <= 4) return COLORS.red.light;
  if (r >= 1 && r <= 4 && c >= 10 && c <= 13) return COLORS.green.light;
  if (r >= 10 && r <= 13 && c >= 10 && c <= 13) return COLORS.blue.light;
  if (r >= 10 && r <= 13 && c >= 1 && c <= 4) return COLORS.yellow.light;
  // Home columns (sprint lanes)
  if (c === 7 && r >= 1 && r <= 5) return COLORS.red.light;
  if (r === 7 && c >= 9 && c <= 13) return COLORS.green.light;
  if (c === 7 && r >= 9 && r <= 13) return COLORS.blue.light;
  if (r === 7 && c >= 1 && c <= 5) return COLORS.yellow.light;
  return '#FFFFFF';
}

// ─── Dice Icons ───────────────────────────────────────────────────
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// ─── Main Component ───────────────────────────────────────────────
export function Ludo({ onGameOver, onBack }: LudoProps) {
  const [pieces, setPieces] = useState<Piece[]>(createPieces);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [movable, setMovable] = useState<number[]>([]); // movable piece IDs
  const [isRolling, setIsRolling] = useState(false);
  const [diceAnim, setDiceAnim] = useState(1);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [messages, setMessages] = useState<string[]>(['红方先掷骰子！']);
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;

  const addMsg = (msg: string) => setMessages(prev => [msg, ...prev.slice(0, 4)]);

  // ─── Apply a move ──────────────────────────────────────────────────
  const applyMove = useCallback((pieceId: number, dice: number, playerIdx: number) => {
    const currentPieces = piecesRef.current;
    const playerColor = PLAYER_COLORS[playerIdx];
    const newPieces = currentPieces.map(p => ({ ...p }));
    const piece = newPieces.find(p => p.id === pieceId)!;

    const newPos = movePiece(piece, dice);
    piece.pos = newPos;

    // Capture check
    if (newPos >= 0 && newPos < 52) {
      const absPos = getAbsIdx(piece);
      if (!SAFE_ABS.has(absPos)) {
        for (const other of newPieces) {
          if (other.id === pieceId || other.owner === playerColor) continue;
          if (other.pos >= 0 && other.pos < 52 && getAbsIdx(other) === absPos) {
            other.pos = -1;
            addMsg(`✈ ${COLORS[playerColor].name} 击落了 ${COLORS[other.owner].name} 的飞机！`);
          }
        }
      }
    }

    // Check win
    const allDone = newPieces.filter(p => p.owner === playerColor).every(p => p.pos === 57);
    if (allDone) {
      setWinner(playerColor);
      onGameOver?.(`${COLORS[playerColor].name}获胜`);
    }

    setPieces(newPieces);
    setMovable([]);
    setDiceValue(null);

    if (!allDone) {
      const nextPlayer = dice === 6 ? playerIdx : (playerIdx + 1) % NUM_PLAYERS;
      if (dice === 6) addMsg(`🎲 掷到6，${COLORS[playerColor].name} 再掷一次！`);
      setTimeout(() => {
        setCurrentPlayer(nextPlayer);
        addMsg(`${COLORS[PLAYER_COLORS[nextPlayer]].name} 回合 — 请掷骰子`);
      }, 300);
    }
  }, [onGameOver]);

  // ─── Roll dice ─────────────────────────────────────────────────────
  const rollDice = useCallback(() => {
    if (isRolling || movable.length > 0 || winner) return;
    setIsRolling(true);
    let step = 0;
    const interval = setInterval(() => {
      setDiceAnim(Math.ceil(Math.random() * 6));
      if (++step >= 8) {
        clearInterval(interval);
        const result = Math.ceil(Math.random() * 6);
        setDiceValue(result);
        setIsRolling(false);

        // Compute movable using current piecesRef
        const curPieces = piecesRef.current;
        const color = PLAYER_COLORS[currentPlayer];
        const movableIds = curPieces
          .filter(p => p.owner === color && canMove(p, result))
          .map(p => p.id);

        if (movableIds.length === 0) {
          addMsg(`${COLORS[color].name} 无棋可走`);
          setTimeout(() => {
            setDiceValue(null);
            if (result !== 6) {
              const next = (currentPlayer + 1) % NUM_PLAYERS;
              setCurrentPlayer(next);
              addMsg(`${COLORS[PLAYER_COLORS[next]].name} 回合 — 请掷骰子`);
            } else {
              addMsg(`${COLORS[color].name} 掷到6，再掷一次！`);
            }
          }, 1000);
        } else if (movableIds.length === 1) {
          // Auto-move single option
          setMovable([]);
          setTimeout(() => applyMove(movableIds[0], result, currentPlayer), 200);
        } else {
          setMovable(movableIds);
          addMsg(`${COLORS[color].name} 选择要移动的棋子`);
        }
      }
    }, 80);
  }, [isRolling, movable.length, winner, currentPlayer, applyMove]);

  const handlePieceClick = useCallback((pieceId: number) => {
    if (!movable.includes(pieceId) || diceValue === null) return;
    applyMove(pieceId, diceValue, currentPlayer);
  }, [movable, diceValue, currentPlayer, applyMove]);

  const resetGame = () => {
    const initial = createPieces();
    setPieces(initial);
    piecesRef.current = initial;
    setCurrentPlayer(0);
    setDiceValue(null);
    setMovable([]);
    setIsRolling(false);
    setWinner(null);
    setMessages(['红方先掷骰子！']);
  };

  // ─── Rendering helpers ─────────────────────────────────────────────
  const color = PLAYER_COLORS[currentPlayer];
  const DiceIcon = DICE_ICONS[(isRolling ? diceAnim : (diceValue ?? 1)) - 1];
  const BOARD_PX = BOARD_GRID * S;

  // Get pixel coords for a piece
  function pieceCoords(p: Piece): [number, number] | null {
    if (p.pos === 57) return null;
    if (p.pos === -1) {
      const parked = pieces.filter(x => x.owner === p.owner && x.pos === -1);
      const idx = parked.indexOf(p);
      const spot = PARKING[p.owner][idx];
      if (!spot) return null;
      return [spot[1] * S + S / 2, spot[0] * S + S / 2]; // [cx, cy]
    }
    if (p.pos >= 52 && p.pos < 57) {
      const homeIdx = p.pos - 52;
      const coords = HOME_PATH[p.owner][homeIdx];
      if (!coords) return null;
      return [coords[1] * S + S / 2, coords[0] * S + S / 2];
    }
    // Main path
    const absIdx = getAbsIdx(p);
    const pathCoords = MAIN_PATH[absIdx];
    if (!pathCoords) return null;
    // Offset stacked pieces
    const stacked = pieces.filter(x =>
      x.id < p.id && x.pos >= 0 && x.pos < 52 && getAbsIdx(x) === absIdx
    ).length;
    const ox = (stacked % 2) * S * 0.22;
    const oy = (stacked >= 2 ? 1 : 0) * S * 0.22;
    return [pathCoords[1] * S + S / 2 + ox, pathCoords[0] * S + S / 2 + oy];
  }

  return (
    <div className="flex flex-col items-center w-full h-full overflow-y-auto bg-[#F5F0E8] p-3 gap-3">
      {/* Removed internal header */}

      {/* Message ticker */}
      <div className="w-full max-w-3xl overflow-hidden">
        <AnimatePresence mode="popLayout">
          {messages.slice(0, 1).map((m, i) => (
            <motion.div
              key={m + i}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-slate-600 font-medium bg-white px-4 py-1.5 rounded-full shadow-sm"
            >
              {m}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Board SVG */}
      <div className="overflow-auto">
        <svg
          width={BOARD_PX}
          height={BOARD_PX}
          viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`}
          style={{ maxWidth: '92vw', maxHeight: '92vw', display: 'block' }}
        >
          {/* Background */}
          <rect width={BOARD_PX} height={BOARD_PX} fill="#E8E2D8" rx={6} />

          {/* Grid cells */}
          {Array.from({ length: BOARD_GRID }, (_, r) =>
            Array.from({ length: BOARD_GRID }, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={c * S + 1} y={r * S + 1}
                width={S - 2} height={S - 2}
                rx={3}
                fill={cellBg(r, c)}
                stroke="#D8D0C4"
                strokeWidth={0.5}
              />
            ))
          )}

          {/* Home corner areas */}
          {([
            ['red', 1, 1],
            ['green', 1, 10],
            ['blue', 10, 10],
            ['yellow', 10, 1],
          ] as [PlayerColor, number, number][]).map(([c, rs, cs]) => (
            <g key={c}>
              <rect x={cs * S + 2} y={rs * S + 2} width={4 * S - 4} height={4 * S - 4} rx={8} fill={COLORS[c].bg} opacity={0.85} />
              <rect x={cs * S + S * 0.6} y={rs * S + S * 0.6} width={S * 2.8} height={S * 2.8} rx={6} fill="white" opacity={0.55} />
            </g>
          ))}

          {/* Center zone */}
          <rect x={5 * S} y={5 * S} width={5 * S} height={5 * S} fill="white" />
          <polygon points={`${7 * S},${7 * S} ${5 * S},${5 * S} ${10 * S},${5 * S}`} fill={COLORS.red.light} opacity={0.8} />
          <polygon points={`${7 * S},${7 * S} ${10 * S},${5 * S} ${10 * S},${10 * S}`} fill={COLORS.green.light} opacity={0.8} />
          <polygon points={`${7 * S},${7 * S} ${10 * S},${10 * S} ${5 * S},${10 * S}`} fill={COLORS.blue.light} opacity={0.8} />
          <polygon points={`${7 * S},${7 * S} ${5 * S},${10 * S} ${5 * S},${5 * S}`} fill={COLORS.yellow.light} opacity={0.8} />
          <circle cx={7 * S} cy={7 * S} r={S * 1.1} fill="white" />
          <text x={7 * S} y={7 * S + 8} textAnchor="middle" fontSize={22} dominantBaseline="middle">✈️</text>

          {/* Safe square markers (⭐) at each player's entry point */}
          {PLAYER_COLORS.map(c => {
            const [r, col] = MAIN_PATH[PLAYER_ENTRY[c]];
            return (
              <text key={c} x={col * S + S / 2} y={r * S + S / 2 + 5} textAnchor="middle" fontSize={10} fill={COLORS[c].bg} opacity={0.9}>★</text>
            );
          })}

          {/* Sprint lane direction arrows (subtle) */}
          {([
            ['red', [2, 7], [5, 7]],
            ['green', [7, 12], [7, 9]],
            ['blue', [12, 7], [9, 7]],
            ['yellow', [7, 2], [7, 5]],
          ] as [PlayerColor, [number, number], [number, number]][]).map(([c, [r1, c1], [r2, c2]]) => (
            <line
              key={c}
              x1={c1 * S + S / 2} y1={r1 * S + S / 2}
              x2={c2 * S + S / 2} y2={r2 * S + S / 2}
              stroke={COLORS[c].bg}
              strokeWidth={2}
              strokeDasharray="3 3"
              opacity={0.4}
              markerEnd={`url(#arr-${c})`}
            />
          ))}

          {/* Pieces */}
          {pieces.map(p => {
            const coords = pieceCoords(p);
            if (!coords) return null;
            const [cx, cy] = coords;
            const isMovable = movable.includes(p.id);
            const col = COLORS[p.owner];
            return (
              <g
                key={p.id}
                onClick={() => handlePieceClick(p.id)}
                style={{ cursor: isMovable ? 'pointer' : 'default' }}
              >
                {isMovable && (
                  <circle cx={cx} cy={cy} r={S * 0.46} fill={col.bg} opacity={0.25}>
                    <animate attributeName="r" values={`${S * 0.42};${S * 0.50};${S * 0.42}`} dur="0.7s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={cx} cy={cy} r={S * 0.38} fill={col.bg} stroke="white" strokeWidth={2.5} />
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={S * 0.3} dominantBaseline="middle">✈</text>
                {isMovable && (
                  <circle cx={cx} cy={cy} r={S * 0.38} fill="none" stroke="white" strokeWidth={1.5} opacity={0.9}>
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="0.7s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dice + Score row */}
      <div className="flex items-center gap-5">
        {/* Player dots */}
        <div className="flex gap-2">
          {PLAYER_COLORS.map((c, i) => (
            <div
              key={c}
              className="flex flex-col items-center gap-0.5 transition-all"
            >
              <div
                className={`rounded-full border-2 border-white shadow transition-all ${i === currentPlayer ? 'w-5 h-5 scale-125' : 'w-3 h-3 opacity-50'}`}
                style={{ background: COLORS[c].bg }}
              />
              <span className="text-[9px] font-bold text-slate-400">
                {pieces.filter(p => p.owner === c && p.pos === 57).length}/4
              </span>
            </div>
          ))}
        </div>

        {/* Dice button */}
        <motion.button
          onClick={rollDice}
          disabled={isRolling || movable.length > 0 || winner !== null}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.9 }}
          animate={isRolling ? { rotate: [0, -20, 20, -10, 10, 0] } : {}}
          transition={{ duration: 0.38 }}
          className="p-4 bg-white rounded-2xl shadow-lg border-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl transition-all"
          style={{ borderColor: COLORS[color].bg }}
        >
          <DiceIcon size={44} strokeWidth={1.4} style={{ color: COLORS[color].bg }} />
        </motion.button>

        {/* Last 2 messages */}
        <div className="flex flex-col gap-0.5 max-w-[140px]">
          {messages.slice(0, 3).map((m, i) => (
            <p key={i} className={`text-[11px] leading-tight ${i === 0 ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>{m}</p>
          ))}
        </div>
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-xs w-full"
            >
              <div className="text-5xl mb-3">🎉</div>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl shadow-lg"
                style={{ background: COLORS[winner].bg }}
              >✈</div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">{COLORS[winner].name} 获胜！</h2>
              <p className="text-slate-400 text-sm mb-6">所有飞机安全着陆！</p>
              <div className="flex flex-col gap-3">
                <button onClick={resetGame} className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors">再玩一局</button>
                {onBack && <button onClick={onBack} className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">返回大厅</button>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
