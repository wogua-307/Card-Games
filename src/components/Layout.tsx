import React from 'react';
import { Home, BookOpen, Clock, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Layout({ children, currentTab, setCurrentTab }: LayoutProps) {
  const tabs = [
    { id: 'home', icon: Home, label: '大厅' },
    { id: 'tutorials', icon: BookOpen, label: '教学' },
    { id: 'history', icon: Clock, label: '战绩' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#FFFDF9] md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-rose-100 p-6 shadow-sm z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-rose-200 rounded-xl flex items-center justify-center text-rose-600 font-bold text-xl shadow-sm">
            趣
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">趣玩棋牌</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-bold ${isActive
                    ? 'bg-rose-100 text-rose-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Contact Info - Desktop Sidebar */}
        <div className="mt-6 pt-5 border-t border-rose-100 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">联系我们</p>
          <a href="mailto:1587337963@qq.com" className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-500 transition-colors">
            <span className="text-base">📧</span>
            <span className="truncate">1587337963@qq.com</span>
          </a>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-base">💬</span>
            <span>微信：zs15988164970</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-base">📱</span>
            <span>公众号：AI 智绘漫界</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0 flex flex-col">
        <div className="flex-1">
          {children}
        </div>

        {/* Footer - visible on desktop in main area */}
        <footer className="hidden md:block border-t border-slate-100 px-8 py-4 bg-white/50">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <a href="mailto:1587337963@qq.com" className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
              <span>📧</span> 1587337963@qq.com
            </a>
            <span className="flex items-center gap-1.5">
              <span>💬</span> 微信：zs15988164970
            </span>
            <span className="flex items-center gap-1.5">
              <span>📱</span> 公众号：AI 智绘漫界
            </span>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 px-6 py-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 rounded-t-3xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${isActive ? 'text-rose-500 scale-110' : 'text-slate-400'
                }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? 'bg-rose-50' : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-rose-600' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
