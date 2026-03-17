import { useState } from 'react';
import AuthGate from './components/AuthGate';
import { useSocketInit } from './hooks/useSocket';
import { usePlayerStore } from './store/playerStore';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Search from './components/Search';
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';
import Equalizer from './components/Equalizer';
import Playlists from './components/Playlists';
import Settings from './components/Settings';
import { useAccentColor } from './hooks/useAccentColor';

function MainApp() {
  // ONE socket init here — no other component should call useSocketInit
  useSocketInit();
  useAccentColor();

  const accentColor = usePlayerStore(s => s.accentColor);
  const [view, setView] = useState('search');
  const [nowPlayingOpen, setNowPlaying] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  return (
    <div
      className="h-screen w-full bg-bg text-t1 overflow-hidden flex flex-col md:block"
      style={{ '--acc': accentColor } as React.CSSProperties}
    >
      {/* Dynamic background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 blur-[100px] transition-colors duration-1000"
        style={{ background: `radial-gradient(circle at 50% 10%, ${accentColor} 0%, transparent 60%)` }}
      />

      <div className="relative z-10 grid h-full grid-cols-1 grid-rows-[1fr_88px] md:grid-cols-[210px_1fr]">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col bg-s1/70 backdrop-blur-[30px] border-r border-border h-full relative z-20">
          <div className="p-6 font-serif text-xl font-semibold text-t1 mb-4 tracking-wide">
            ToneTunnel
          </div>
          <Sidebar currentView={view} onViewChange={setView} />
        </aside>

        {/* Main content */}
        <main className="relative overflow-y-auto pb-6 custom-scrollbar h-full w-full">
          <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-serif mb-8 capitalize">{view}</h1>
            {view === 'search' && <Search />}
            {view === 'settings' && <><Settings /><Equalizer /></>}
            {view === 'playlists' && <Playlists />}
            {view === 'history' && <div className="text-t3 italic">History coming soon.</div>}
          </div>
        </main>

        {/* Player bar */}
        <footer className="col-span-1 md:col-span-2 bg-s1/80 backdrop-blur-[40px] border-t border-border z-50 h-[88px] relative">
          <Player
            onToggleNowPlaying={() => setNowPlaying(true)}
            onToggleQueue={() => setQueueOpen(o => !o)}
          />
        </footer>

      </div>

      <NowPlaying isOpen={nowPlayingOpen} onClose={() => setNowPlaying(false)} />
      <Queue isOpen={queueOpen} />
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <MainApp />
    </AuthGate>
  );
}