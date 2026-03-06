import React, { useState, useEffect, useRef } from 'react';
import { GAMES } from '../data/games';
import { ArrowLeft, RotateCcw, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

// Import games (we'll create these next)
import { Gomoku } from '../games/Gomoku';
import { ChessGame } from '../games/Chess';
import { Go } from '../games/Go';
import { AnimalChess } from '../games/AnimalChess';
import { Junqi } from '../games/Junqi';
import { Ludo } from '../games/Ludo';
import { CodingRabbit } from '../games/CodingRabbit';

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

  // Audio state
  const bgmRef = useRef<Howl | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Classify game types for BGM
    const isBoardGame = ['gomoku', 'go', 'chess', 'animal-chess', 'junqi', 'ludo'].includes(gameId || '');
    const bgmSrc = isBoardGame ? '/audio/board_bgm.mp3' : '/audio/puzzle_bgm.mp3';
    const initialVolume = isBoardGame ? 0.2 : 0.5;

    // Initialize BGM
    bgmRef.current = new Howl({
      src: [bgmSrc],
      loop: true,
      volume: initialVolume,
      html5: true, // Force HTML5 Audio to allow playing before interaction if possible, or handle autoplay block
    });

    // Try to play immediately (might be blocked by browser policy)
    bgmRef.current.play();

    return () => {
      // Cleanup on unmount
      if (bgmRef.current) {
        bgmRef.current.stop();
        bgmRef.current.unload();
      }
    };
  }, [gameId]); // re-run if gameId changes

  const toggleMute = () => {
    if (bgmRef.current) {
      const newMutedState = !isMuted;
      bgmRef.current.mute(newMutedState);
      setIsMuted(newMutedState);

      // If the browser blocked autoplay, the first click on the mute button 
      // can serve as the user interaction to start it if it's not playing
      if (!newMutedState && !bgmRef.current.playing()) {
        bgmRef.current.play();
      }
    }
  };

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
      case 'ludo':
        return <Ludo key={key} onGameOver={handleGameOver} onBack={onBack} />;
      case 'coding-rabbit':
        return <CodingRabbit
          key={key}
          onGameOver={handleGameOver}
          onBack={onBack}
          toggleMute={toggleMute}
          isMuted={isMuted}
          onRestart={handleRestart}
        />;
      default:
        return <div className="p-10 text-center text-slate-500 font-bold">游戏开发中...</div>;
    }
  };

  const hideDefaultHeader = gameId === 'coding-rabbit';

  return (
    <div className="flex flex-col h-full bg-[#FFFDF9]">
      {/* Conditionally render default Header */}
      {!hideDefaultHeader && (
        <header className="flex items-center justify-between px-3 py-2 md:p-6 bg-white border-b border-rose-100 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight">{game.name}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleMute}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              title={isMuted ? "取消静音" : "静音"}
            >
              {isMuted ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
            </button>
            <button
              onClick={() => setShowRules(!showRules)}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <HelpCircle size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleRestart}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <RotateCcw size={18} strokeWidth={2.5} />
            </button>
          </div>
        </header>
      )}

      {/* Game Area - full bleed on mobile */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {renderGame()}
      </main>
    </div>
  );
}
