import React from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Clock, Trophy, Trash2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export function History() {
  const { history, clearHistory } = useStore();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight flex items-center gap-3">
            <Clock className="text-rose-400" size={36} />
            战绩记录
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            回顾你的每一场精彩对局
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold transition-colors px-4 py-2 rounded-xl hover:bg-rose-50"
          >
            <Trash2 size={18} />
            清空记录
          </button>
        )}
      </motion.div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-slate-100 flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Trophy size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">暂无对局记录</h3>
          <p className="text-slate-400 font-medium">快去大厅开始你的第一场比赛吧！</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {history.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rose-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 font-bold text-xl">
                  {record.gameName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{record.gameName}</h3>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(record.date), 'yyyy-MM-dd HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {Math.floor(record.duration / 60)}分{record.duration % 60}秒
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`px-6 py-3 rounded-xl font-bold text-center min-w-[120px] ${
                record.result.includes('胜') || record.result.includes('Win')
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : record.result.includes('平') || record.result.includes('Draw')
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {record.result}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
