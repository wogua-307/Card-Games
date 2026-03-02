import React from 'react';
import { GameInfo } from '../data/games';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

interface GameCardProps {
  game: GameInfo;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const Icon = Icons[game.icon as keyof typeof Icons] as React.ElementType;

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative w-full text-left p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border-2 overflow-hidden ${game.color} bg-white`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-10 ${game.color.split(' ')[0]}`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${game.color.split(' ')[0]} shadow-inner`}>
          <Icon size={32} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
          <Icons.Users size={14} />
          <span>{game.players} 人</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-extrabold mb-2 tracking-tight">{game.name}</h3>
      <p className="text-sm opacity-80 font-medium leading-relaxed line-clamp-2">
        {game.description}
      </p>
    </motion.button>
  );
}
