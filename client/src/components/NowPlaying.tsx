import { ChevronDown } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NowPlaying({ isOpen, onClose }: Props) {
  const { track, accentColor } = usePlayerStore();

  if (!isOpen || !track) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-[250ms] ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      
      {/* Background layer with heavy blur and dark overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-[1.4s]"
        style={{ backgroundImage: `url(${track.thumbnail})` }}
      >
        <div className="absolute inset-0 bg-bg/85 backdrop-blur-[60px]" />
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <button onClick={onClose} className="p-2 bg-s2 rounded-full hover:bg-white/10 transition">
          <ChevronDown size={24} className="text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-8">
        
        {/* Glow halo behind art */}
        <div className="relative w-full aspect-square mb-12">
          <div 
            className="absolute inset-x-8 -inset-y-4 blur-[80px] opacity-40 transition-colors duration-[1.4s] rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <img 
            src={track.thumbnail} 
            alt={track.title} 
            className="relative z-10 w-full h-full object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border/30"
          />
        </div>

        {/* Info */}
        <div className="w-full text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-3 truncate leading-tight drop-shadow-md">
            {track.title}
          </h1>
          <h2 className="text-xl text-white/70 font-sans truncate drop-shadow-sm">
            {track.artist}
          </h2>
        </div>

      </div>
    </div>
  );
}
