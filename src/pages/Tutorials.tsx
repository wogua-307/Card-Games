import React, { useState } from 'react';
import { TUTORIALS, GAMES } from '../data/games';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, PlayCircle } from 'lucide-react';

interface TutorialsProps {
  onPlayGame: (gameId: string) => void;
}

export function Tutorials({ onPlayGame }: TutorialsProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight flex items-center gap-3">
          <BookOpen className="text-rose-400" size={36} />
          棋类小课堂
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          从零开始，成为棋盘大师！
        </p>
      </motion.div>

      <div className="space-y-4">
        {GAMES.map((game, index) => {
          const isSelected = selectedGame === game.id;
          const tutorial = TUTORIALS[game.id];

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-3xl overflow-hidden shadow-sm border-2 transition-all duration-300 ${
                isSelected ? 'border-rose-300 shadow-md' : 'border-slate-100 hover:border-rose-100'
              }`}
            >
              <button
                onClick={() => setSelectedGame(isSelected ? null : game.id)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${game.color.split(' ')[0]} ${game.color.split(' ')[1]}`}>
                    <span className="font-bold text-xl">{game.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{game.name}</h3>
                    <p className="text-sm text-slate-400 font-medium">点击查看规则</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isSelected ? 90 : 0 }}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
                >
                  <ChevronRight size={20} />
                </motion.div>
              </button>

              <AnimatePresence>
                {isSelected && tutorial && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6"
                  >
                    <div className="pt-4 border-t-2 border-slate-50">
                      <h4 className="text-lg font-bold text-slate-700 mb-4">{tutorial.title}</h4>
                      <ul className="space-y-3 mb-6">
                        {tutorial.content.map((line, i) => (
                          <li key={i} className="flex gap-3 text-slate-600 font-medium leading-relaxed">
                            <span className="text-rose-400 font-bold mt-0.5">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <button
                        onClick={() => onPlayGame(game.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-bold transition-colors shadow-sm shadow-rose-200"
                      >
                        <PlayCircle size={20} />
                        去实战练习
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
