import { useEffect, useRef } from 'react';
import { Play, ListPlus, FolderPlus } from 'lucide-react';
import { Track } from '../store/playerStore';

interface Props {
  x: number;
  y: number;
  track: Track;
  onClose: () => void;
  onPlayNext: () => void;
  onAddQueue: () => void;
  onAddPlaylist: (playlistId: string) => void;
}

export default function ContextMenu({ x, y, track, onClose, onPlayNext, onAddQueue, onAddPlaylist }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUp = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to stay on screen
  let finalX = x;
  let finalY = y;
  const menuWidth = 220;
  const menuHeight = 160;

  if (x + menuWidth > window.innerWidth) finalX = window.innerWidth - menuWidth - 10;
  if (y + menuHeight > window.innerHeight) finalY = window.innerHeight - menuHeight - 10;

  return (
    <div 
      ref={menuRef}
      className="fixed z-[9999] w-[220px] bg-s1 border border-border rounded-lg shadow-2xl py-1 animate-fade-up text-sm text-t1 backdrop-blur-3xl"
      style={{ left: finalX, top: finalY, animationDuration: '0.15s' }}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="px-3 py-2 border-b border-border/50 truncate font-medium text-t2 mb-1">
        {track.title}
      </div>

      <button onClick={() => { onPlayNext(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors">
        <Play size={16} /> Play Next
      </button>
      
      <button onClick={() => { onAddQueue(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors">
        <ListPlus size={16} /> Add to Queue
      </button>

      <button onClick={() => { onAddPlaylist('fake-id'); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors group relative">
        <FolderPlus size={16} /> Add to Playlist...
        {/* Placeholder for sub-menu if desired */}
      </button>
    </div>
  );
}
