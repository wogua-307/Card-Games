import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Flag, Share2, Settings, Bot, User, Users, ArrowLeft, Cpu } from 'lucide-react';
import { getBestMove, AIDifficulty } from './ai/GomokuAI';

interface GomokuProps {
  key?: number | string;
  onGameOver?: (result: string) => void;
  onBack?: () => void;
}

const BOARD_SIZE = 15;

type GameMode = 'pvp' | 'pve';

export function Gomoku({ onGameOver, onBack }: GomokuProps) {
  // ─── Game Mode State ─────────────────────────────────────────────────────
  const [gameMode, setGameMode] = useState<GameMode | null>(null); // null = on mode-selection screen
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<0 | 1>(0); // 0=black (goes first), 1=white

  // ─── Board State ──────────────────────────────────────────────────────────
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [winner, setWinner] = useState<number | null>(null);
  const [history, setHistory] = useState<{ r: number; c: number }[]>([]);
  const [blackTime, setBlackTime] = useState(600);
  const [whiteTime, setWhiteTime] = useState(600);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const aiPlayer = playerColor === 0 ? 1 : 0; // AI is opposite to player's chosen color
  const isAIMode = gameMode === 'pve';
  const isAITurn = isAIMode && isBlackTurn === (aiPlayer === 0) && winner === null;

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (winner !== null || gameMode === null) return;
    const timer = setInterval(() => {
      if (isBlackTurn) setBlackTime(p => Math.max(0, p - 1));
      else setWhiteTime(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isBlackTurn, winner, gameMode]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Win Check ────────────────────────────────────────────────────────────
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

  // ─── AI Move Trigger ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAITurn || isAIThinking) return;
    setIsAIThinking(true);
    const delay = aiDifficulty === 'easy' ? 300 : aiDifficulty === 'medium' ? 500 : 800;
    const t = setTimeout(() => {
      const [ar, ac] = getBestMove(board, aiPlayer, aiDifficulty);
      const newBoard = board.map(row => [...row]);
      newBoard[ar][ac] = aiPlayer;
      setBoard(newBoard);
      setHistory(prev => [...prev, { r: ar, c: ac }]);
      if (checkWin(ar, ac, aiPlayer, newBoard)) {
        setWinner(aiPlayer);
        onGameOver?.(aiPlayer === 0 ? '黑棋胜' : '白棋胜');
      } else {
        setIsBlackTurn(b => !b);
      }
      setIsAIThinking(false);
    }, delay);
    return () => { clearTimeout(t); setIsAIThinking(false); };
  }, [isAITurn, board, aiPlayer, aiDifficulty, checkWin, onGameOver]);

  // ─── Player Move ──────────────────────────────────────────────────────────
  const handleCellClick = (r: number, c: number) => {
    if (winner !== null || board[r][c] !== null || isAITurn || isAIThinking) return;
    const cur = isBlackTurn ? 0 : 1;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = cur;
    setBoard(newBoard);
    setHistory(prev => [...prev, { r, c }]);
    if (checkWin(r, c, cur, newBoard)) {
      setWinner(cur);
      onGameOver?.(cur === 0 ? '黑棋胜' : '白棋胜');
    } else if (newBoard.every(row => row.every(cell => cell !== null))) {
      onGameOver?.('平局');
    } else {
      setIsBlackTurn(b => !b);
    }
  };

  // ─── Undo: in AI mode, undo 2 moves (player + AI) ───────────────────────
  const handleUndo = () => {
    if (winner !== null || isAIThinking) return;
    const stepsToUndo = isAIMode ? 2 : 1;
    if (history.length < stepsToUndo) return;
    const newHistory = history.slice(0, -stepsToUndo);
    const newBoard = board.map(row => [...row]);
    for (let i = 0; i < stepsToUndo; i++) {
      const { r, c } = history[history.length - 1 - i];
      newBoard[r][c] = null;
    }
    setBoard(newBoard);
    setHistory(newHistory);
    // Restore whose turn it is (always player's turn after undo in AI mode)
    if (isAIMode) {
      setIsBlackTurn(playerColor === 0); // player's color goes first
    } else {
      setIsBlackTurn(b => stepsToUndo === 1 ? !b : b);
    }
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
    setIsAIThinking(false);
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
  };

  // Star points at 3, 7, 11 on a 15×15 grid
  const starPoints = [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]];

  // ─── Mode Selection Screen ────────────────────────────────────────────────
  if (gameMode === null) {
    return (
      <div className="flex flex-col items-center w-full min-h-full bg-[#F5F0E8] p-4 md:p-8">
        <header className="w-full max-w-md flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 rounded-full bg-white/80 shadow-sm text-slate-600 hover:bg-white transition-all">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-800">五子棋</h1>
              <p className="text-slate-500 text-xs">Gobang · 选择游戏模式</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {/* PvP Mode */}
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => startGame('pvp')}
            className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border-2 border-transparent hover:border-amber-300 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Users size={22} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-base">双人对战</p>
              <p className="text-slate-400 text-xs">与朋友同屏对弈</p>
            </div>
          </motion.button>

          {/* PvE Mode */}
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-amber-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                <Cpu size={22} className="text-sky-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-base">人机对战</p>
                <p className="text-slate-400 text-xs">挑战 AI 机器人</p>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">AI 难度</p>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setAIDifficulty(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${aiDifficulty === d
                        ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50'
                      }`}
                  >
                    {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">我方执色</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPlayerColor(0)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all ${playerColor === 0 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600" />
                  执黑（先手）
                </button>
                <button
                  onClick={() => setPlayerColor(1)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all ${playerColor === 1 ? 'bg-amber-400 border-amber-400 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white border border-slate-300" />
                  执白（后手）
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => startGame('pve')}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
            >
              开始挑战
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game Board Screen ────────────────────────────────────────────────────
  const playerName = isAIMode
    ? (playerColor === 0 ? '我方（黑）' : '我方（白）')
    : '玩家 一';
  const opponentName = isAIMode ? `AI (${aiDifficulty === 'easy' ? '简单' : aiDifficulty === 'medium' ? '中等' : '困难'})` : '玩家 二';

  return (
    <div className="flex flex-col items-center w-full min-h-full bg-[#F5F0E8] p-4 md:p-6">

      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setGameMode(null)} className="p-2 rounded-full bg-white/80 shadow-sm text-slate-600 hover:bg-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">五子棋</h1>
            <p className="text-slate-500 text-xs">
              {isAIMode ? `🤖 人机对战 · ${aiDifficulty === 'easy' ? '简单' : aiDifficulty === 'medium' ? '中等' : '困难'}` : '👥 双人对战'}
            </p>
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

        {/* Black Player Card */}
        <PlayerCard
          name={isAIMode && aiPlayer === 0 ? opponentName : playerName}
          label="执黑"
          isBlack
          isActive={isBlackTurn && winner === null}
          isAI={isAIMode && aiPlayer === 0}
          isAIThinking={isAIThinking && isBlackTurn}
          time={formatTime(blackTime)}
        />

        {/* ╔══════════════════════════════╗
            ║            BOARD             ║
            ╚══════════════════════════════╝ */}
        <div
          className="relative shrink-0 select-none"
          style={{
            background: '#F1B152',
            border: '2px solid #000000',
            padding: '3.5%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          <div
            className="relative"
            style={{
              background: '#FFF4E8',
              border: '5px solid #000000',
              width: 'min(74vw, 480px)',
              height: 'min(74vw, 480px)',
            }}
          >
            {/* Decorative borders */}
            <div className="absolute inset-0 pointer-events-none" style={{ border: '2px solid #000', margin: '12px' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ border: '1px solid #000', margin: '15px' }} />
            {[
              { top: 8, left: 8 }, { top: 8, right: 8 },
              { bottom: 8, left: 8 }, { bottom: 8, right: 8 }
            ].map((pos, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ ...pos, width: 10, height: 10, border: '2px solid #000' }} />
            ))}

            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 14 14" preserveAspectRatio="none">
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i + 1} x2={14} y2={i + 1} stroke="#000" strokeWidth="0.04" />
              ))}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={14} stroke="#000" strokeWidth="0.04" />
              ))}
              <line x1="0" y1="0" x2="14" y2="0" stroke="#000" strokeWidth="0.04" />
              <line x1="0" y1="14" x2="14" y2="14" stroke="#000" strokeWidth="0.04" />
              <line x1="0" y1="0" x2="0" y2="14" stroke="#000" strokeWidth="0.04" />
              <line x1="14" y1="0" x2="14" y2="14" stroke="#000" strokeWidth="0.04" />
            </svg>

            {/* Star points */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 14 14" preserveAspectRatio="none">
              {starPoints.map(([c, r], i) => (
                <circle key={i} cx={c} cy={r} r="0.22" fill="#000000" />
              ))}
            </svg>

            {/* AI Thinking Overlay */}
            <AnimatePresence>
              {isAIThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none rounded-sm"
                >
                  <div className="flex items-center gap-2 bg-white/90 px-4 py-2.5 rounded-full shadow-lg border border-amber-200">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Cpu size={16} className="text-amber-500" />
                    </motion.div>
                    <span className="text-sm font-bold text-slate-700">AI 思考中…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive board */}
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
                    className={`relative flex items-center justify-center group ${isAITurn || isAIThinking ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  >
                    {/* Hover preview */}
                    {cell === null && winner === null && !isAITurn && !isAIThinking && (
                      <div className={`absolute w-[65%] h-[65%] rounded-full opacity-0 group-hover:opacity-25 transition-opacity ${isBlackTurn ? 'bg-black' : 'bg-white border border-gray-400'}`} />
                    )}

                    {/* Piece */}
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
                              <div className="absolute inset-0 flex items-center justify-center">
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

        {/* White Player Card */}
        <PlayerCard
          name={isAIMode && aiPlayer === 1 ? opponentName : (isAIMode ? playerName : '玩家 二')}
          label="执白"
          isBlack={false}
          isActive={!isBlackTurn && winner === null}
          isAI={isAIMode && aiPlayer === 1}
          isAIThinking={isAIThinking && !isBlackTurn}
          time={formatTime(whiteTime)}
        />
      </main>

      {/* Controls */}
      <footer className="mt-8 flex gap-4">
        <button
          onClick={handleUndo}
          disabled={history.length < (isAIMode ? 2 : 1) || winner !== null || isAIThinking}
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
              <div className="text-5xl mb-4">
                {isAIMode
                  ? (winner === playerColor ? '🎉' : '🤖')
                  : '🎉'}
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-1">
                {isAIMode
                  ? (winner === playerColor ? '你赢了！' : 'AI 获胜！')
                  : `${winner === 0 ? '黑棋' : '白棋'} 胜出！`}
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                {isAIMode && winner !== playerColor ? '不要气馁，再来一局！' : '对局结束'}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={resetGame}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
                >
                  再来一局
                </button>
                <button
                  onClick={() => setGameMode(null)}
                  className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  返回选择
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PlayerCard Component ─────────────────────────────────────────────────────
interface PlayerCardProps {
  name: string;
  label: string;
  isBlack: boolean;
  isActive: boolean;
  isAI: boolean;
  isAIThinking: boolean;
  time: string;
}

function PlayerCard({ name, label, isBlack, isActive, isAI, isAIThinking, time }: PlayerCardProps) {
  return (
    <div className={`
      flex flex-row lg:flex-col items-center gap-3 px-5 py-4 rounded-2xl bg-white
      border-2 transition-all duration-300 w-full lg:w-44 shadow-sm
      ${isActive ? 'border-[#F1B152] shadow-[0_4px_20px_rgba(241,177,82,0.25)] scale-105' : 'border-transparent'}
    `}>
      {/* Stone / Avatar */}
      <div className="relative shrink-0">
        <div className={`w-12 h-12 rounded-full border-2 ${isBlack
          ? 'bg-gradient-to-br from-gray-600 to-black border-gray-300'
          : 'bg-gradient-to-br from-white to-gray-200 border-gray-300'
          } shadow-md flex items-center justify-center`}>
          {isAI && <Cpu size={20} className={isBlack ? 'text-gray-300' : 'text-slate-500'} />}
        </div>
        {isActive && (
          <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border border-white ${isAIThinking ? 'bg-sky-500' : 'bg-[#F1B152]'}`}>
            {isAIThinking ? 'AI 思考' : '思考中'}
          </span>
        )}
      </div>
      <div className="flex-1 lg:text-center">
        <p className="font-bold text-slate-800 text-base leading-tight">{name}</p>
        <p className="text-slate-400 text-xs">{label}</p>
      </div>
      <div className={`text-2xl font-mono font-bold px-3 py-1.5 rounded-xl ${isActive ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
        {time}
      </div>
    </div>
  );
}
