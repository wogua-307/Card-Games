import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';

interface GoProps {
  key?: number | string;
  onGameOver: (result: string) => void;
}

const BOARD_SIZE = 19;

export function Go({ onGameOver }: GoProps) {
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [captures, setCaptures] = useState({ black: 0, white: 0 });

  // Basic implementation without full Ko rule and complex liberties for now
  // Just placement and a resign button
  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] !== null) return;

    const newBoard = board.map(row => [...row]);
    const currentPlayer = isBlackTurn ? 0 : 1;
    newBoard[r][c] = currentPlayer;
    
    // TODO: Implement full capture logic (liberties)
    
    setBoard(newBoard);
    setIsBlackTurn(!isBlackTurn);
  };

  const handleResign = () => {
    onGameOver(isBlackTurn ? '白棋胜' : '黑棋胜');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex items-center justify-between w-full max-w-md bg-white px-8 py-4 rounded-3xl shadow-sm border-2 border-slate-100">
        <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${isBlackTurn ? 'bg-slate-100' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 shadow-sm" />
            <span className="font-bold text-slate-700">黑棋</span>
          </div>
          <span className="text-xs text-slate-400 font-bold">提子: {captures.black}</span>
        </div>
        
        <button 
          onClick={handleResign}
          className="px-4 py-2 bg-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-200 transition-colors"
        >
          认输
        </button>

        <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${!isBlackTurn ? 'bg-slate-100' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 shadow-sm" />
            <span className="font-bold text-slate-700">白棋</span>
          </div>
          <span className="text-xs text-slate-400 font-bold">提子: {captures.white}</span>
        </div>
      </div>

      <div className="relative bg-[#E6C280] p-4 rounded-xl shadow-lg border-4 border-[#C19A5B] overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-4 grid pointer-events-none" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(18, minmax(0, 1fr))' }}>
          {Array.from({ length: 18 }).map((_, r) => (
            <div key={`row-${r}`} className="flex">
              {Array.from({ length: 18 }).map((_, c) => (
                <div key={`cell-${r}-${c}`} className="flex-1 border-r border-b border-[#8C6239] opacity-60" />
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-4 border-t border-l border-[#8C6239] opacity-60 pointer-events-none" />

        {/* Star points */}
        {[
          [3, 3], [3, 9], [3, 15],
          [9, 3], [9, 9], [9, 15],
          [15, 3], [15, 9], [15, 15]
        ].map(([r, c], i) => (
          <div
            key={`star-${i}`}
            className="absolute w-2 h-2 bg-[#8C6239] rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              top: `calc(1rem + ${r * (100 / 18)}%)`,
              left: `calc(1rem + ${c * (100 / 18)}%)`,
            }}
          />
        ))}

        {/* Interactive cells */}
        <div className="relative grid gap-0 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px]" style={{ gridTemplateColumns: 'repeat(19, minmax(0, 1fr))', gridTemplateRows: 'repeat(19, minmax(0, 1fr))' }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="relative flex items-center justify-center cursor-pointer group"
              >
                {cell === null && (
                  <div className={`absolute w-3/4 h-3/4 rounded-full opacity-0 group-hover:opacity-40 transition-opacity ${
                    isBlackTurn ? 'bg-slate-900' : 'bg-white'
                  }`} />
                )}
                
                {cell !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute w-[85%] h-[85%] rounded-full shadow-sm ${
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
    </div>
  );
}
