import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';

interface GomokuProps {
  key?: number | string;
  onGameOver: (result: string) => void;
}

const BOARD_SIZE = 15;

export function Gomoku({ onGameOver }: GomokuProps) {
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [winner, setWinner] = useState<number | null>(null);

  const checkWin = useCallback((r: number, c: number, player: number, currentBoard: (number | null)[][]) => {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal \
      [1, -1]  // diagonal /
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      // Check forward
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === player) {
          count++;
        } else break;
      }
      // Check backward
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === player) {
          count++;
        } else break;
      }

      if (count >= 5) return true;
    }
    return false;
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (winner !== null || board[r][c] !== null) return;

    const newBoard = board.map(row => [...row]);
    const currentPlayer = isBlackTurn ? 0 : 1;
    newBoard[r][c] = currentPlayer;
    setBoard(newBoard);

    if (checkWin(r, c, currentPlayer, newBoard)) {
      setWinner(currentPlayer);
      onGameOver(currentPlayer === 0 ? '黑棋胜' : '白棋胜');
    } else {
      // Check draw
      if (newBoard.every(row => row.every(cell => cell !== null))) {
        onGameOver('平局');
      } else {
        setIsBlackTurn(!isBlackTurn);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex items-center gap-6 bg-white px-8 py-4 rounded-3xl shadow-sm border-2 border-slate-100">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${isBlackTurn && winner === null ? 'bg-slate-100' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-slate-900 shadow-sm" />
          <span className="font-bold text-slate-700">黑棋</span>
        </div>
        <div className="text-2xl font-black text-slate-300">VS</div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${!isBlackTurn && winner === null ? 'bg-slate-100' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 shadow-sm" />
          <span className="font-bold text-slate-700">白棋</span>
        </div>
      </div>

      <div className="relative bg-[#E6C280] p-4 rounded-xl shadow-lg border-4 border-[#C19A5B]">
        {/* Grid lines */}
        <div className="absolute inset-4 grid pointer-events-none" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gridTemplateRows: 'repeat(14, minmax(0, 1fr))' }}>
          {Array.from({ length: 14 }).map((_, r) => (
            <div key={`row-${r}`} className="flex">
              {Array.from({ length: 14 }).map((_, c) => (
                <div key={`cell-${r}-${c}`} className="flex-1 border-r border-b border-[#8C6239] opacity-60" />
              ))}
            </div>
          ))}
        </div>
        {/* Top and Left borders for the grid */}
        <div className="absolute inset-4 border-t border-l border-[#8C6239] opacity-60 pointer-events-none" />

        {/* Star points (Tengen and Hoshi) */}
        {[
          [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ].map(([r, c], i) => (
          <div
            key={`star-${i}`}
            className="absolute w-2 h-2 bg-[#8C6239] rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              top: `calc(1rem + ${r * (100 / 14)}%)`,
              left: `calc(1rem + ${c * (100 / 14)}%)`,
            }}
          />
        ))}

        {/* Interactive cells */}
        <div className="relative grid grid-cols-15 grid-rows-15 gap-0 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px]" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gridTemplateRows: 'repeat(15, minmax(0, 1fr))' }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="relative flex items-center justify-center cursor-pointer group"
              >
                {/* Hover indicator */}
                {cell === null && winner === null && (
                  <div className={`absolute w-3/4 h-3/4 rounded-full opacity-0 group-hover:opacity-40 transition-opacity ${
                    isBlackTurn ? 'bg-slate-900' : 'bg-white'
                  }`} />
                )}
                
                {/* Placed stone */}
                {cell !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute w-[80%] h-[80%] rounded-full shadow-md ${
                      cell === 0 
                        ? 'bg-gradient-to-br from-slate-700 to-slate-900' 
                        : 'bg-gradient-to-br from-white to-slate-200 border border-slate-300'
                    }`}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {winner !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-2xl font-extrabold text-rose-500 bg-rose-50 px-8 py-3 rounded-full border-2 border-rose-100"
        >
          {winner === 0 ? '黑棋' : '白棋'} 获胜！🎉
        </motion.div>
      )}
    </div>
  );
}
