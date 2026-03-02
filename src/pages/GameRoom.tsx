import React, { useState } from 'react';
import { GAMES } from '../data/games';
import { ArrowLeft, RotateCcw, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';

// Import games (we'll create these next)
import { Gomoku } from '../games/Gomoku';
import { ChessGame } from '../games/Chess';
import { Go } from '../games/Go';
import { AnimalChess } from '../games/AnimalChess';
import { Junqi } from '../games/Junqi';

interface GameRoomProps {
  gameId: string;
  onBack: () => void;
}

export function GameRoom({ gameId, onBack }: GameRoomProps) {
  const game = GAMES.find((g) => g.id === gameId);
  const addMatchRecord = useStore((state) => state.addMatchRecord);
  const [startTime] = useState(Date.now());
  const [showRules, setShowRules] = useState(false);
  const [key, setKey] = useState(0); // For restarting

  if (!game) return <div>Game not found</div>;

  const handleGameOver = (result: string) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    addMatchRecord({
      gameId: game.id,
      gameName: game.name,
      result,
      duration,
    });
    
    if (result.includes('胜') || result.includes('Win')) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF9B9B', '#FFD6A5', '#CBFFA9']
      });
    }
  };

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  const renderGame = () => {
    switch (gameId) {
      case 'gomoku':
        return <Gomoku key={key} onGameOver={handleGameOver} />;
      case 'chess':
        return <ChessGame key={key} onGameOver={handleGameOver} />;
      case 'go':
        return <Go key={key} onGameOver={handleGameOver} />;
      case 'animal-chess':
        return <AnimalChess key={key} onGameOver={handleGameOver} />;
      case 'junqi':
        return <Junqi key={key} onGameOver={handleGameOver} />;
      default:
        return <div className="p-10 text-center text-slate-500 font-bold">游戏开发中...</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFDF9]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-rose-100 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{game.name}</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <HelpCircle size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleRestart}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <RotateCcw size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 overflow-auto relative flex items-center justify-center p-4">
        {renderGame()}
      </main>
    </div>
  );
}
