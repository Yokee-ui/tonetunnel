import { Search, Library, ListMusic, Settings, Activity } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

export default function Sidebar({ currentView, onViewChange }: { currentView: string; onViewChange: (v: string) => void }) {
  const accentColor = usePlayerStore(s => s.accentColor);

  const navs = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'history', label: 'History', icon: Activity },
    { id: 'library', label: 'Local Library', icon: Library }, // Optional, not truly local anymore
  ];

  return (
    <>
      <div className="flex-1 flex flex-col gap-1 px-4">
        <div className="text-[9.5px] uppercase tracking-widest text-t3 mb-2 px-4 mt-2 font-medium">Your Music</div>
        {navs.map(n => (
          <button
            key={n.id}
            onClick={() => onViewChange(n.id)}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-md text-[14px] transition-all
              ${currentView === n.id 
                ? 'bg-white/5 text-t1 font-medium' 
                : 'text-t2 hover:text-t1 hover:bg-white/5'}
            `}
            style={currentView === n.id ? { borderLeft: `3px solid ${accentColor}` } : { borderLeft: '3px solid transparent' }}
          >
            <n.icon size={18} />
            {n.label}
          </button>
        ))}
      </div>

      <div className="p-4 mb-4">
        <button
          onClick={() => onViewChange('settings')}
          className={`flex w-full items-center gap-4 px-4 py-2.5 rounded-md text-[14px] transition-all 
            ${currentView === 'settings' ? 'bg-white/5 text-t1 font-medium' : 'text-t2 hover:text-t1 hover:bg-white/5'}
          `}
          style={currentView === 'settings' ? { borderLeft: `3px solid ${accentColor}` } : { borderLeft: '3px solid transparent' }}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </>
  );
}
