import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, ListVideo, Volume2, Maximize2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { usePlayer } from '../hooks/usePlayer';
import { useEffect } from 'react';

interface Props {
  onToggleNowPlaying: () => void;
  onToggleQueue: () => void;
}

export default function Player({ onToggleNowPlaying, onToggleQueue }: Props) {
  const { track, isPlaying, position, play, pause, next, prev, repeat, setRepeat, shuffle, toggleShuffle, seek } = usePlayerStore();
  
  // init player logic
  usePlayer();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? pause() : play();
      } else if (e.code === 'KeyN') {
        next();
      } else if (e.code === 'ArrowRight') {
        if (track) seek(Math.min(position + 10, track.duration));
      } else if (e.code === 'ArrowLeft') {
        seek(Math.max(position - 10, 0));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, next, position, track, seek]);

  if (!track) return null;

  const durationStr = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const pct = track.duration > 0 ? (position / track.duration) * 100 : 0;

  return (
    <div className="flex h-full w-full items-center justify-between text-t1">
      
      {/* 1. Track Info (260px) */}
      <div onClick={onToggleNowPlaying} className="flex w-[260px] items-center gap-4 cursor-pointer group pl-4">
        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-black border border-border/50">
          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 size={20} className="text-white" />
          </div>
        </div>
        <div className="flex flex-col truncate">
          <span className="font-serif text-lg leading-tight truncate">{track.title}</span>
          <span className="text-sm text-t2 truncate mt-0.5 font-sans">{track.artist}</span>
        </div>
      </div>

      {/* 2. Controls (1fr) */}
      <div className="flex flex-1 flex-col items-center justify-center max-w-2xl px-8">
        <div className="flex items-center gap-6 mb-2">
          <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-acc' : 'text-t3 hover:text-t1'}`}>
            <Shuffle size={18} />
          </button>
          
          <button onClick={prev} className="text-t2 hover:text-t1 transition">
            <SkipBack size={24} fill="currentColor" />
          </button>
          
          <button 
            onClick={() => isPlaying ? pause() : play()} 
            className="w-10 h-10 rounded-full bg-t1 text-bg flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          
          <button onClick={next} className="text-t2 hover:text-t1 transition">
            <SkipForward size={24} fill="currentColor" />
          </button>

          <button 
            onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
            className={`transition ${repeat !== 'off' ? 'text-acc' : 'text-t3 hover:text-t1'}`}
          >
            {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Seek Bar */}
        <div className="flex w-full items-center gap-3 text-xs font-mono text-t3">
          <span className="w-10 text-right">{durationStr(position)}</span>
          <div className="group relative h-2 flex-1 cursor-pointer flex items-center">
            <div className="absolute w-full h-[3px] bg-s2 rounded-full overflow-hidden">
              <div className="h-full bg-acc transition-all duration-500 linear" style={{ width: `${pct}%` }} />
            </div>
            {/* Thumb on hover */}
            <div className="absolute w-3 h-3 bg-t1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" style={{ left: `calc(${pct}% - 6px)` }} />
          </div>
          <span className="w-10">{durationStr(track.duration)}</span>
        </div>
      </div>

      {/* 3. Extras (220px) */}
      <div className="flex w-[220px] items-center justify-end gap-5 text-t2 pr-4">
        <Volume2 size={20} className="hover:text-t1 cursor-pointer transition" />
        <div className="w-24 h-[3px] bg-s2 rounded-full cursor-pointer relative hidden md:block group">
          <div className="h-full bg-t2 group-hover:bg-acc rounded-full" style={{ width: '100%' }} />
        </div>
        <ListVideo 
          size={20} 
          onClick={onToggleQueue}
          className="hover:text-t1 cursor-pointer transition ml-2" 
        />
      </div>

    </div>
  );
}
