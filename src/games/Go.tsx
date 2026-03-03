import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Flag, Share2, Settings, ArrowLeft } from 'lucide-react';

interface GoProps {
  key?: number | string;
  onGameOver?: (result: string) => void;
  onBack?: () => void;
}

const BOARD_SIZE = 19;

export function Go({ onGameOver, onBack }: GoProps) {
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [winner, setWinner] = useState<number | null>(null);
  const [history, setHistory] = useState<{ r: number; c: number }[]>([]);
  const [captures, setCaptures] = useState({ black: 0, white: 0 });
  const [blackTime, setBlackTime] = useState(1800); // 30 minutes for Go
  const [whiteTime, setWhiteTime] = useState(1800);

  const [toastMsg, setToastMsg] = useState<{ msg: string, id: number } | null>(null);
  const [shakeCoords, setShakeCoords] = useState<{ r: number, c: number } | null>(null);

  useEffect(() => {
    if (winner !== null) return;
    const timer = setInterval(() => {
      if (isBlackTurn) setBlackTime(p => Math.max(0, p - 1));
      else setWhiteTime(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isBlackTurn, winner]);

  const showToast = (msg: string) => {
    setToastMsg({ msg, id: Date.now() });
    setTimeout(() => {
      setToastMsg(prev => prev?.id === Date.now() ? null : prev); // clear after 3s if not overwritten
    }, 3000);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleCellClick = (r: number, c: number) => {
    if (winner !== null) return;
    if (board[r][c] !== null) {
      // Prompt for clicking on an existing stone
      setShakeCoords({ r, c });
      showToast('此处已有子，无法落子！');
      setTimeout(() => setShakeCoords(null), 400);
      return;
    }

    const currentPlayer = isBlackTurn ? 0 : 1;
    const opponentPlayer = isBlackTurn ? 1 : 0;

    // Create a new board copy for the tentative move
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = currentPlayer;

    // Helper functions for Go logic
    const getAdjacent = (row: number, col: number) => {
      return [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1]
      ].filter(([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE);
    };

    const getGroupAndLiberties = (startNodeR: number, startNodeC: number, b: (number | null)[][]) => {
      const color = b[startNodeR][startNodeC];
      if (color === null) return { group: [], liberties: 0 };

      const group: { r: number, c: number }[] = [];
      const visited = new Set<string>();
      const liberties = new Set<string>();
      const queue = [[startNodeR, startNodeC]];

      visited.add(`${startNodeR},${startNodeC}`);

      while (queue.length > 0) {
        const [currR, currC] = queue.shift()!;
        group.push({ r: currR, c: currC });

        for (const [nr, nc] of getAdjacent(currR, currC)) {
          const key = `${nr},${nc}`;
          if (b[nr][nc] === null) {
            liberties.add(key);
          } else if (b[nr][nc] === color && !visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }

      return { group, liberties: liberties.size };
    };

    let capturedStones = 0;

    // 1. Check adjacent opponent stones for captures
    for (const [nr, nc] of getAdjacent(r, c)) {
      if (newBoard[nr][nc] === opponentPlayer) {
        const { group, liberties } = getGroupAndLiberties(nr, nc, newBoard);
        if (liberties === 0) {
          // Capture the group
          for (const stone of group) {
            newBoard[stone.r][stone.c] = null;
            capturedStones++;
          }
        }
      }
    }

    // 2. Self-capture check (Suicide rule)
    // If the move didn't capture anything and results in 0 liberties, it's illegal.
    const { liberties: ownLiberties } = getGroupAndLiberties(r, c, newBoard);
    if (ownLiberties === 0 && capturedStones === 0) {
      // Illegal move: suicide
      setShakeCoords({ r, c });
      showToast('禁入点：落子后该棋块无“气”且不能吃掉对方，属于违规自杀哦！');
      setTimeout(() => setShakeCoords(null), 400);
      return;
    }

    // Apply the valid move
    setBoard(newBoard);
    setHistory([...history, { r, c }]);
    if (capturedStones > 0) {
      setCaptures(prev => ({
        ...prev,
        [isBlackTurn ? 'black' : 'white']: prev[isBlackTurn ? 'black' : 'white'] + capturedStones
      }));
      // Optional: Add a subtle toast to celebrate capture for beginners
      if (capturedStones >= 3) {
        showToast(`漂亮！吃掉了 ${capturedStones} 颗子！`);
      }
    }
    setToastMsg(null); // Clear previous errors on successful move
    setIsBlackTurn(!isBlackTurn);
  };

  const handleUndo = () => {
    if (history.length === 0 || winner !== null) return;
    const last = history[history.length - 1];
    const newBoard = board.map(row => [...row]);
    newBoard[last.r][last.c] = null;
    setBoard(newBoard);
    setHistory(history.slice(0, -1));
    setIsBlackTurn(!isBlackTurn);
  };

  const handleResign = () => {
    if (winner !== null) return;
    const w = isBlackTurn ? 1 : 0;
    setWinner(w);
    onGameOver?.(w === 0 ? '黑棋胜' : '白棋胜');
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setIsBlackTurn(true);
    setWinner(null);
    setHistory([]);
    setCaptures({ black: 0, white: 0 });
    setBlackTime(1800);
    setWhiteTime(1800);
  };

  // Star points for 19x19 Go board: (3,3), (3,9), (3,15), (9,3), (9,9), (9,15), (15,3), (15,9), (15,15)
  // counting from 0
  const starPoints = [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15]
  ];

  return (
    <div className="flex flex-col items-center w-full min-h-full bg-[#F5F0E8] p-4 md:p-6">

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full bg-white/80 shadow-sm text-slate-600 hover:bg-white transition-all">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">围棋</h1>
            <p className="text-slate-500 text-xs">Weiqi / Go · Standard 19x19</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-white rounded-full shadow-sm text-slate-500 hover:text-slate-800 transition-all hover:shadow-md">
            <Share2 size={18} />
          </button>
          <button className="p-2.5 bg-white rounded-full shadow-sm text-slate-500 hover:text-slate-800 transition-all hover:shadow-md">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center w-full max-w-6xl">

        {/* Player 1 (Black) Card */}
        <PlayerCard
          name="玩家 一"
          label="执黑"
          isBlack
          isActive={isBlackTurn && winner === null}
          time={formatTime(blackTime)}
          captures={captures.black}
        />

        {/* ╔══════════════════════════════╗
            ║   THE BOARD — Figma Accurate ║
            ╚══════════════════════════════╝ */}
        <div
          className="relative shrink-0 select-none"
          style={{
            /* Outer frame — #F1B152 fill with black outline */
            background: '#F1B152',
            border: '2px solid #000000',
            padding: '2.5%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {/* Inner board — #FFF4E8 fill with thick black stroke */}
          <div
            className="relative"
            style={{
              background: '#FFF4E8',
              border: '4px solid #000000', // slightly thinner than Gomoku's 5px due to size perceived
              width: 'min(82vw, 560px)',
              height: 'min(82vw, 560px)',
            }}
          >
            {/* Decorative double-border overlay (from Figma "border" frame) */}
            <div className="absolute inset-0 pointer-events-none" style={{ border: '2px solid #000', margin: '8px' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ border: '1px solid #000', margin: '11px' }} />
            {/* Corner accent squares (4 corners) */}
            {[
              { top: 5, left: 5 }, { top: 5, right: 5 },
              { bottom: 5, left: 5 }, { bottom: 5, right: 5 }
            ].map((pos, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ ...pos, width: 8, height: 8, border: '2px solid #000' }} />
            ))}

            {/* Grid lines — rendered as SVG for perfect alignment. For 19x19 we need a 18x18 grid. */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 18 18" preserveAspectRatio="none">
              {/* 17 horizontal lines (rows 1–17) */}
              {Array.from({ length: 17 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i + 1} x2={18} y2={i + 1} stroke="#000" strokeWidth="0.04" />
              ))}
              {/* 17 vertical lines */}
              {Array.from({ length: 17 }, (_, i) => (
                <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={18} stroke="#000" strokeWidth="0.04" />
              ))}
              {/* Outer border grid lines (row 0, row 18, col 0, col 18) */}
              <line x1="0" y1="0" x2="18" y2="0" stroke="#000" strokeWidth="0.04" />
              <line x1="0" y1="18" x2="18" y2="18" stroke="#000" strokeWidth="0.04" />
              <line x1="0" y1="0" x2="0" y2="18" stroke="#000" strokeWidth="0.04" />
              <line x1="18" y1="0" x2="18" y2="18" stroke="#000" strokeWidth="0.04" />
            </svg>

            {/* Star points as SVG dots */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 18 18" preserveAspectRatio="none">
              {starPoints.map(([c, r], i) => (
                <circle key={i} cx={c} cy={r} r="0.16" fill="#000000" />
              ))}
            </svg>

            {/* 提示信息 Toast */}
            <AnimatePresence>
              {toastMsg && (
                <motion.div
                  key={toastMsg.id}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-800/90 backdrop-blur text-white text-sm font-medium rounded-full shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap text-center"
                >
                  {toastMsg.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive board grid of 19x19 cells
                Align grid accurately outside the 18x18 drawn grid: 1/18 = 5.55%
                Offset grid by -5.55% / 2 = -2.77%
                Size is 1 + 1/18 = 105.55%
            */}
            <div
              className="absolute pointer-events-auto grid"
              style={{
                top: '-2.77%', left: '-2.77%', width: '105.55%', height: '105.55%',
                gridTemplateColumns: 'repeat(19, 1fr)', gridTemplateRows: 'repeat(19, 1fr)'
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isShaking = shakeCoords?.r === r && shakeCoords?.c === c;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className="relative flex items-center justify-center cursor-pointer group"
                    >
                      {/* Hover / Error preview */}
                      {cell === null && winner === null && (
                        <div className={`absolute w-[70%] h-[70%] rounded-full transition-opacity ${isShaking
                            ? 'opacity-60 bg-rose-500 animate-pulse' // Error state for invalid move
                            : `opacity-0 group-hover:opacity-25 ${isBlackTurn ? 'bg-black' : 'bg-white border border-gray-400'}`
                          }`}
                        />
                      )}

                      {/* Chess piece */}
                      <AnimatePresence>
                        {cell !== null && (
                          <motion.div
                            initial={{ scale: 0.2, opacity: 0 }}
                            animate={isShaking ? { x: [-2, 2, -2, 2, 0] } : { scale: 1, opacity: 1 }}
                            transition={isShaking ? { duration: 0.3 } : { type: 'spring', stiffness: 400, damping: 22 }}
                            className="absolute w-[86%] h-[86%] rounded-full"
                            style={cell === 0
                              ? {
                                background: 'radial-gradient(circle at 33% 30%, #6B6B6B, #1A1A1A 55%, #000000)',
                                boxShadow: '1px 2px 4px rgba(0,0,0,0.5)',
                              }
                              : {
                                background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #F0F0F0 50%, #D8D8D8)',
                                boxShadow: '0px 1px 3px rgba(0,0,0,0.2)',
                                border: '1px solid #ccc',
                              }
                            }
                          >
                            {/* Last move marker */}
                            {history.length > 0 &&
                              history[history.length - 1].r === r &&
                              history[history.length - 1].c === c && (
                                <div className={`absolute inset-0 flex items-center justify-center`}>
                                  <div className={`w-[30%] h-[30%] rounded-sm ${cell === 0 ? 'bg-rose-400' : 'bg-rose-500'}`} />
                                </div>
                              )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Player 2 (White) Card */}
        <PlayerCard
          name="玩家 二"
          label="执白"
          isBlack={false}
          isActive={!isBlackTurn && winner === null}
          time={formatTime(whiteTime)}
          captures={captures.white}
        />
      </main>

      {/* Controls */}
      <footer className="mt-8 flex gap-4">
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || winner !== null}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <RotateCcw size={16} />
          悔棋
        </button>
        <button
          onClick={handleResign}
          disabled={winner !== null}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-rose-500 bg-rose-50 border border-rose-100 shadow-sm hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Flag size={16} />
          认输
        </button>
      </footer>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {winner !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-xs w-full"
            >
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-slate-800 mb-1">
                {winner === 0 ? '黑棋' : '白棋'} 胜出！
              </h2>
              <p className="text-slate-400 text-sm mb-8">对局结束</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={resetGame}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
                >
                  再来一局
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  返回大厅
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlayerCardProps {
  name: string;
  label: string;
  isBlack: boolean;
  isActive: boolean;
  time: string;
  captures: number;
}

function PlayerCard({ name, label, isBlack, isActive, time, captures }: PlayerCardProps) {
  return (
    <div className={`
      flex flex-row lg:flex-col items-center gap-3 px-5 py-4 rounded-2xl bg-white
      border-2 transition-all duration-300 w-full lg:w-44 shadow-sm
      ${isActive ? 'border-[#F1B152] shadow-[0_4px_20px_rgba(241,177,82,0.25)] scale-105' : 'border-transparent'}
    `}>
      {/* Stone preview */}
      <div className="relative shrink-0">
        <div className={`w-12 h-12 rounded-full border-2 ${isBlack
          ? 'bg-gradient-to-br from-gray-600 to-black border-gray-300'
          : 'bg-gradient-to-br from-white to-gray-200 border-gray-300'
          } shadow-md`} />
        {isActive && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#F1B152] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border border-white">
            思考中
          </span>
        )}
      </div>
      <div className="flex-1 lg:text-center">
        <p className="font-bold text-slate-800 text-base leading-tight">{name}</p>
        <p className="text-slate-400 text-xs">{label} · 提子 {captures}</p>
      </div>
      <div className={`text-2xl font-mono font-bold px-3 py-1.5 rounded-xl ${isActive ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
        }`}>
        {time}
      </div>
    </div>
  );
}
