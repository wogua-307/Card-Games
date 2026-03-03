import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Flag, Share2, Settings, User, ArrowLeft } from 'lucide-react';

interface GomokuProps {
  key?: number | string;
  onGameOver?: (result: string) => void;
  onBack?: () => void;
}

const BOARD_SIZE = 15;
const CELL_SIZE_PX = 32; // px per cell on desktop

// From Figma API:
// 外方 fill: #F1B152 (outer wooden border)
// 内方 fill: #FFF4E8, stroke: #000000 5px (inner board)
// Grid lines: #000000, 2px
// Star dots: #000000, 24x24 (relative to 1600px board → in 15-unit grid)
// Border decoration: two concentric rectangle outlines + corner squares

export function Gomoku({ onGameOver, onBack }: GomokuProps) {
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [winner, setWinner] = useState<number | null>(null);
  const [history, setHistory] = useState<{ r: number; c: number }[]>([]);
  const [blackTime, setBlackTime] = useState(600);
  const [whiteTime, setWhiteTime] = useState(600);

  useEffect(() => {
    if (winner !== null) return;
    const timer = setInterval(() => {
      if (isBlackTurn) setBlackTime(p => Math.max(0, p - 1));
      else setWhiteTime(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isBlackTurn, winner]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const checkWin = useCallback((r: number, c: number, player: number, b: (number | null)[][]) => {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
      let cnt = 1;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === player) cnt++; else break;
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === player) cnt++; else break;
      }
      if (cnt >= 5) return true;
    }
    return false;
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (winner !== null || board[r][c] !== null) return;
    const newBoard = board.map(row => [...row]);
    const cur = isBlackTurn ? 0 : 1;
    newBoard[r][c] = cur;
    setBoard(newBoard);
    setHistory([...history, { r, c }]);
    if (checkWin(r, c, cur, newBoard)) {
      setWinner(cur);
      onGameOver?.(cur === 0 ? '黑棋胜' : '白棋胜');
    } else if (newBoard.every(row => row.every(cell => cell !== null))) {
      onGameOver?.('平局');
    } else {
      setIsBlackTurn(!isBlackTurn);
    }
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
    setBlackTime(600);
    setWhiteTime(600);
  };

  // Star points: in the Figma design they sit at intersections (counting from 0 at row/col 0)
  // On a 15×15 grid (indices 0–14): positions at 3,7,11
  const starPoints = [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]];

  return (
    <div className="flex flex-col items-center w-full min-h-full bg-[#F5F0E8] p-4 md:p-6">

      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full bg-white/80 shadow-sm text-slate-600 hover:bg-white transition-all">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">五子棋</h1>
            <p className="text-slate-500 text-xs">Gobang · Classic</p>
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

      <main className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center w-full max-w-5xl">

        {/* Player 1 (Black) Card */}
        <PlayerCard
          name="玩家 一"
          label="执黑"
          isBlack
          isActive={isBlackTurn && winner === null}
          time={formatTime(blackTime)}
        />

        {/* ╔══════════════════════════════╗
            ║   THE BOARD — Figma Accurate ║
            ╚══════════════════════════════╝
            Figma structure:
            • 外方 (outer frame): fill #F1B152, stroke #000000 2px
            • 内方 (inner board): fill #FFF4E8, stroke #000000 5px
            • border frame: two concentric border-only rectangles + 4 corner squares
            • grid lines: 13 horizontal + 13 vertical, stroke #000 2px
            • 星 (stars): 5 solid black circles 24x24 at specific intersections
        */}
        <div
          className="relative shrink-0 select-none"
          style={{
            /* Outer frame — #F1B152 fill with black outline */
            background: '#F1B152',
            border: '2px solid #000000',
            padding: '3.5%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {/* Inner board — #FFF4E8 fill with thick black stroke */}
          <div
            className="relative"
            style={{
              background: '#FFF4E8',
              border: '5px solid #000000',
              width: 'min(74vw, 480px)',
              height: 'min(74vw, 480px)',
            }}
          >
            {/* Decorative double-border overlay (from Figma "border" frame) */}
            <div className="absolute inset-0 pointer-events-none" style={{ border: '2px solid #000', margin: '12px' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ border: '1px solid #000', margin: '15px' }} />
            {/* Corner accent squares (4 corners) */}
            {[
              { top: 8, left: 8 }, { top: 8, right: 8 },
              { bottom: 8, left: 8 }, { bottom: 8, right: 8 }
            ].map((pos, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ ...pos, width: 10, height: 10, border: '2px solid #000' }} />
            ))}

            {/* Grid lines — rendered as SVG for pixel-perfect 2px lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 14 14" preserveAspectRatio="none">
              {/* 13 horizontal lines (rows 1–13, between row 0 and row 14) */}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i + 1} x2={14} y2={i + 1} stroke="#000" strokeWidth="0.04" />
              ))}
              {/* 13 vertical lines */}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={14} stroke="#000" strokeWidth="0.04" />
              ))}
              {/* Outer border grid lines (row 0, row 14, col 0, col 14) */}
              <line x1="0" y1="0" x2="14" y2="0" stroke="#000" strokeWidth="0.04" />
              <line x1="0" y1="14" x2="14" y2="14" stroke="#000" strokeWidth="0.04" />
              <line x1="0" y1="0" x2="0" y2="14" stroke="#000" strokeWidth="0.04" />
              <line x1="14" y1="0" x2="14" y2="14" stroke="#000" strokeWidth="0.04" />
            </svg>

            {/* Star points as SVG dots */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 14 14" preserveAspectRatio="none">
              {starPoints.map(([c, r], i) => (
                <circle key={i} cx={c} cy={r} r="0.22" fill="#000000" />
              ))}
            </svg>

            {/* Interactive board grid of 15×15 cells
                To align perfectly with the intersections, we expand the clicking area slightly
                outside the 14x14 visual grid by extending it by half a cell on all sides.
            */}
            <div
              className="absolute pointer-events-auto grid"
              style={{
                top: '-3.57%', left: '-3.57%', width: '107.14%', height: '107.14%',
                gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)'
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className="relative flex items-center justify-center cursor-pointer group"
                  >
                    {/* Hover preview */}
                    {cell === null && winner === null && (
                      <div className={`absolute w-[65%] h-[65%] rounded-full opacity-0 group-hover:opacity-25 transition-opacity ${isBlackTurn ? 'bg-black' : 'bg-white border border-gray-400'
                        }`} />
                    )}

                    {/* Chess piece */}
                    <AnimatePresence>
                      {cell !== null && (
                        <motion.div
                          initial={{ scale: 0.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                          className="absolute w-[80%] h-[80%] rounded-full"
                          style={cell === 0
                            ? {
                              background: 'radial-gradient(circle at 33% 30%, #6B6B6B, #1A1A1A 55%, #000000)',
                              boxShadow: '1px 2px 5px rgba(0,0,0,0.55)',
                            }
                            : {
                              background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #F0F0F0 50%, #D8D8D8)',
                              boxShadow: '0px 1px 4px rgba(0,0,0,0.18)',
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
                ))
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
              <div className="text-5xl mb-4">🎉</div>
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
}

function PlayerCard({ name, label, isBlack, isActive, time }: PlayerCardProps) {
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
        <p className="text-slate-400 text-xs">{label}</p>
      </div>
      <div className={`text-2xl font-mono font-bold px-3 py-1.5 rounded-xl ${isActive ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
        }`}>
        {time}
      </div>
    </div>
  );
}
