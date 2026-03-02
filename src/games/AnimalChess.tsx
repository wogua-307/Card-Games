import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AnimalChessProps {
  key?: number | string;
  onGameOver: (result: string) => void;
}

const BOARD_ROWS = 9;
const BOARD_COLS = 7;

type Piece = {
  type: number; // 1-8 (鼠-象)
  player: number; // 0: Red, 1: Blue
  name: string;
};

const INITIAL_BOARD: (Piece | null)[][] = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));

// Red pieces
INITIAL_BOARD[0][0] = { type: 6, player: 0, name: '狮' };
INITIAL_BOARD[0][6] = { type: 5, player: 0, name: '虎' };
INITIAL_BOARD[1][1] = { type: 2, player: 0, name: '狗' };
INITIAL_BOARD[1][5] = { type: 1, player: 0, name: '猫' };
INITIAL_BOARD[2][0] = { type: 0, player: 0, name: '鼠' };
INITIAL_BOARD[2][2] = { type: 4, player: 0, name: '豹' };
INITIAL_BOARD[2][4] = { type: 3, player: 0, name: '狼' };
INITIAL_BOARD[2][6] = { type: 7, player: 0, name: '象' };

// Blue pieces
INITIAL_BOARD[8][6] = { type: 6, player: 1, name: '狮' };
INITIAL_BOARD[8][0] = { type: 5, player: 1, name: '虎' };
INITIAL_BOARD[7][5] = { type: 2, player: 1, name: '狗' };
INITIAL_BOARD[7][1] = { type: 1, player: 1, name: '猫' };
INITIAL_BOARD[6][6] = { type: 0, player: 1, name: '鼠' };
INITIAL_BOARD[6][4] = { type: 4, player: 1, name: '豹' };
INITIAL_BOARD[6][2] = { type: 3, player: 1, name: '狼' };
INITIAL_BOARD[6][0] = { type: 7, player: 1, name: '象' };

export function AnimalChess({ onGameOver }: AnimalChessProps) {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [isRedTurn, setIsRedTurn] = useState(true);

  const isRiver = (r: number, c: number) => {
    return (r >= 3 && r <= 5) && ((c >= 1 && c <= 2) || (c >= 4 && c <= 5));
  };

  const isTrap = (r: number, c: number) => {
    return (r === 0 && (c === 2 || c === 4)) || (r === 1 && c === 3) ||
           (r === 8 && (c === 2 || c === 4)) || (r === 7 && c === 3);
  };

  const isDen = (r: number, c: number) => {
    return (r === 0 && c === 3) || (r === 8 && c === 3);
  };

  const handleCellClick = (r: number, c: number) => {
    const currentPlayer = isRedTurn ? 0 : 1;
    const piece = board[r][c];

    if (selected) {
      if (selected.r === r && selected.c === c) {
        setSelected(null); // Deselect
        return;
      }

      // Basic move logic (no complex rules for now, just allow moving to adjacent empty cells or capturing)
      const dr = Math.abs(r - selected.r);
      const dc = Math.abs(c - selected.c);
      
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        const selectedPiece = board[selected.r][selected.c]!;
        
        // Basic capture rule
        if (piece && piece.player === currentPlayer) {
          // Select another piece
          setSelected({ r, c });
          return;
        }

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = selectedPiece;
        newBoard[selected.r][selected.c] = null;
        setBoard(newBoard);
        setSelected(null);
        setIsRedTurn(!isRedTurn);

        // Check win condition (reached den)
        if ((currentPlayer === 0 && r === 8 && c === 3) || 
            (currentPlayer === 1 && r === 0 && c === 3)) {
          onGameOver(currentPlayer === 0 ? '红方胜' : '蓝方胜');
        }
      }
    } else {
      if (piece && piece.player === currentPlayer) {
        setSelected({ r, c });
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex items-center justify-between w-full max-w-md bg-white px-8 py-4 rounded-3xl shadow-sm border-2 border-slate-100">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isRedTurn ? 'bg-red-50' : ''}`}>
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
          <span className="font-bold text-red-600">红方</span>
        </div>
        <div className="text-xl font-black text-slate-300">VS</div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${!isRedTurn ? 'bg-blue-50' : ''}`}>
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="font-bold text-blue-600">蓝方</span>
        </div>
      </div>

      <div className="bg-[#FFE4B5] p-4 rounded-xl shadow-lg border-4 border-[#DEB887]">
        <div className="grid grid-cols-7 grid-rows-9 gap-1 w-[300px] h-[385px] sm:w-[420px] sm:h-[540px]">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const river = isRiver(r, c);
              const trap = isTrap(r, c);
              const den = isDen(r, c);
              const isSelected = selected?.r === r && selected?.c === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center border border-[#DEB887]/50 cursor-pointer transition-colors ${
                    river ? 'bg-blue-200/60' : 
                    trap ? 'bg-orange-200/60' : 
                    den ? 'bg-slate-800/20' : 'bg-transparent'
                  } ${isSelected ? 'ring-4 ring-yellow-400 ring-inset z-10' : ''}`}
                >
                  {trap && <span className="text-[10px] text-orange-800/50 font-bold absolute">陷阱</span>}
                  {den && <span className="text-[10px] text-slate-800/50 font-bold absolute">兽穴</span>}
                  
                  {piece && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isSelected ? 1.1 : 1 }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md border-2 font-bold text-sm sm:text-base z-20 bg-white ${
                        piece.player === 0 ? 'text-red-600 border-red-200' : 'text-blue-600 border-blue-200'
                      }`}
                    >
                      {piece.name}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
