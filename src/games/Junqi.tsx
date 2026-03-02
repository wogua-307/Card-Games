import React, { useState } from 'react';
import { motion } from 'motion/react';

interface JunqiProps {
  key?: number | string;
  onGameOver: (result: string) => void;
}

const BOARD_ROWS = 12; // 6 rows per side, with a river in between (actually 6x5 per side, so 12x5)
const BOARD_COLS = 5;

type Piece = {
  type: number; // 0-8 (工兵-司令), 9: 炸弹, 10: 地雷, 11: 军旗
  player: number; // 0: Red, 1: Black
  name: string;
  revealed: boolean; // For dark chess mode, but let's do open chess for simplicity
};

// Simplified initial board setup for demonstration
const INITIAL_BOARD: (Piece | null)[][] = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));

// Red pieces (bottom)
INITIAL_BOARD[11][1] = { type: 11, player: 0, name: '军旗', revealed: true };
INITIAL_BOARD[11][3] = { type: 10, player: 0, name: '地雷', revealed: true };
INITIAL_BOARD[10][2] = { type: 8, player: 0, name: '司令', revealed: true };
INITIAL_BOARD[9][1] = { type: 9, player: 0, name: '炸弹', revealed: true };
INITIAL_BOARD[8][0] = { type: 0, player: 0, name: '工兵', revealed: true };

// Black pieces (top)
INITIAL_BOARD[0][1] = { type: 11, player: 1, name: '军旗', revealed: true };
INITIAL_BOARD[0][3] = { type: 10, player: 1, name: '地雷', revealed: true };
INITIAL_BOARD[1][2] = { type: 8, player: 1, name: '司令', revealed: true };
INITIAL_BOARD[2][1] = { type: 9, player: 1, name: '炸弹', revealed: true };
INITIAL_BOARD[3][0] = { type: 0, player: 1, name: '工兵', revealed: true };

export function Junqi({ onGameOver }: JunqiProps) {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [isRedTurn, setIsRedTurn] = useState(true);

  const isCamp = (r: number, c: number) => {
    return ((r === 2 || r === 4 || r === 7 || r === 9) && (c === 1 || c === 3)) ||
           ((r === 3 || r === 8) && c === 2);
  };

  const isHeadquarters = (r: number, c: number) => {
    return (r === 0 || r === 11) && (c === 1 || c === 3);
  };

  const handleCellClick = (r: number, c: number) => {
    const currentPlayer = isRedTurn ? 0 : 1;
    const piece = board[r][c];

    if (selected) {
      if (selected.r === r && selected.c === c) {
        setSelected(null); // Deselect
        return;
      }

      // Basic move logic (allow moving to adjacent empty cells)
      const dr = Math.abs(r - selected.r);
      const dc = Math.abs(c - selected.c);
      
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        const selectedPiece = board[selected.r][selected.c]!;
        
        // Cannot move into a camp if it's occupied
        if (isCamp(r, c) && piece) return;
        
        // Cannot move landmines or flags
        if (selectedPiece.type === 10 || selectedPiece.type === 11) return;

        // Basic capture
        if (piece && piece.player === currentPlayer) {
          setSelected({ r, c });
          return;
        }

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = selectedPiece;
        newBoard[selected.r][selected.c] = null;
        setBoard(newBoard);
        setSelected(null);
        setIsRedTurn(!isRedTurn);

        // Check win condition (captured flag)
        if (piece && piece.type === 11) {
          onGameOver(currentPlayer === 0 ? '红方胜' : '黑方胜');
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
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${!isRedTurn ? 'bg-slate-100' : ''}`}>
          <div className="w-4 h-4 rounded-full bg-slate-800 shadow-sm" />
          <span className="font-bold text-slate-800">黑方</span>
        </div>
      </div>

      <div className="bg-[#FFE4B5] p-4 rounded-xl shadow-lg border-4 border-[#DEB887]">
        <div className="grid grid-cols-5 grid-rows-12 gap-1 w-[250px] h-[600px] sm:w-[300px] sm:h-[720px]">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const camp = isCamp(r, c);
              const hq = isHeadquarters(r, c);
              const isSelected = selected?.r === r && selected?.c === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center border border-[#DEB887]/50 cursor-pointer transition-colors ${
                    camp ? 'rounded-full bg-orange-200/60' : 
                    hq ? 'bg-yellow-200/60 border-2 border-yellow-500' : 'bg-transparent'
                  } ${isSelected ? 'ring-4 ring-yellow-400 ring-inset z-10' : ''}`}
                >
                  {camp && <span className="text-[10px] text-orange-800/50 font-bold absolute">行营</span>}
                  {hq && <span className="text-[10px] text-yellow-800/50 font-bold absolute">大本营</span>}
                  
                  {piece && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isSelected ? 1.1 : 1 }}
                      className={`w-10 h-6 sm:w-12 sm:h-8 rounded-sm flex items-center justify-center shadow-md border-2 font-bold text-xs sm:text-sm z-20 bg-[#FDF5E6] ${
                        piece.player === 0 ? 'text-red-600 border-red-200' : 'text-slate-800 border-slate-300'
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
