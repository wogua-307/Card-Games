import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tutorials } from './pages/Tutorials';
import { History } from './pages/History';
import { GameRoom } from './pages/GameRoom';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleSelectGame = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleBackToLobby = () => {
    setActiveGame(null);
  };

  if (activeGame) {
    return <GameRoom gameId={activeGame} onBack={handleBackToLobby} />;
  }

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'home' && <Home onSelectGame={handleSelectGame} />}
      {currentTab === 'tutorials' && <Tutorials onPlayGame={handleSelectGame} />}
      {currentTab === 'history' && <History />}
      {currentTab === 'profile' && (
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">我的主页</h2>
          <p className="text-slate-500">个人资料与统计数据开发中...</p>
        </div>
      )}
    </Layout>
  );
}

