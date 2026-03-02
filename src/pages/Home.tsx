import React from 'react';
import { GAMES } from '../data/games';
import { GameCard } from '../components/GameCard';
import { motion } from 'motion/react';

interface HomeProps {
  onSelectGame: (gameId: string) => void;
}

export function Home({ onSelectGame }: HomeProps) {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
          今天想玩点什么？<span className="text-rose-400">👋</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          选择一个棋类游戏开始对战或学习
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <GameCard game={game} onClick={() => onSelectGame(game.id)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
