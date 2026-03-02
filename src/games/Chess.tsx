import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'motion/react';

interface ChessGameProps {
  key?: number | string;
  onGameOver: (result: string) => void;
}

export function ChessGame({ onGameOver }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [winner, setWinner] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <div className="mb-6 flex items-center gap-6 bg-white px-8 py-4 rounded-3xl shadow-sm border-2 border-slate-100">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${game.turn() === 'w' && !winner ? 'bg-slate-100' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 shadow-sm" />
          <span className="font-bold text-slate-700">白方</span>
        </div>
        <div className="text-2xl font-black text-slate-300">VS</div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${game.turn() === 'b' && !winner ? 'bg-slate-100' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-slate-900 shadow-sm" />
          <span className="font-bold text-slate-700">黑方</span>
        </div>
      </div>

      <div className="w-full aspect-square bg-white p-4 rounded-3xl shadow-lg border-4 border-slate-100">
        <Chessboard 
          options={{
            position: game.fen(),
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (winner) return false;
              const gameCopy = new Chess(game.fen());
              try {
                const move = gameCopy.move({
                  from: sourceSquare,
                  to: targetSquare,
                  promotion: 'q',
                });
                if (move === null) return false;
                setGame(gameCopy);
                
                if (gameCopy.isGameOver()) {
                  if (gameCopy.isCheckmate()) {
                    const winnerColor = gameCopy.turn() === 'w' ? '黑方' : '白方';
                    setWinner(winnerColor);
                    onGameOver(`${winnerColor}胜`);
                  } else if (gameCopy.isDraw()) {
                    setWinner('平局');
                    onGameOver('平局');
                  }
                }
                return true;
              } catch (e) {
                return false;
              }
            },
            darkSquareStyle: { backgroundColor: '#FFD6A5' },
            lightSquareStyle: { backgroundColor: '#FFFDF9' },
            animationDurationInMs: 300
          }}
        />
      </div>

      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-2xl font-extrabold text-rose-500 bg-rose-50 px-8 py-3 rounded-full border-2 border-rose-100"
        >
          {winner === '平局' ? '游戏平局！' : `${winner} 获胜！🎉`}
        </motion.div>
      )}
    </div>
  );
}
