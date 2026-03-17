import { usePlayerStore, Track } from '../store/playerStore';

interface Props {
  track: Track;
  index: number;
  queueContext?: Track[];
}

export default function TrackRow({ track, index, queueContext = [] }: Props) {
  const currentTrack = usePlayerStore(s => s.track);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const playTrack = usePlayerStore(s => s.playTrack);
  const play = usePlayerStore(s => s.play);

  const isActive = currentTrack?.videoId === track.videoId;

  const handlePlay = () => {
    if (isActive) {
      if (!isPlaying) play();
    } else {
      playTrack(
        track,
        queueContext.length > 0 ? queueContext : [track],
        index
      );
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={handlePlay}
      onContextMenu={(e) => { e.preventDefault(); }}
      className={`group grid grid-cols-[36px_48px_1fr_140px_60px] md:grid-cols-[36px_48px_1fr_180px_60px] items-center gap-3 p-[9px_12px] rounded-lg transition-colors cursor-pointer animate-fade-up
        ${isActive ? 'bg-white/5' : 'hover:bg-s2'}
      `}
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
    >
      {/* 1. Number or Eq bars */}
      <div className="flex justify-center text-sm font-mono text-t3 group-hover:text-t1 transition-colors">
        {isActive ? (
          <div className="flex items-end gap-[2px] h-[14px]">
            <div className={`w-[3px] bg-acc rounded-sm ${isPlaying ? 'animate-eq-1' : 'h-[6px]'}`} />
            <div className={`w-[3px] bg-acc rounded-sm ${isPlaying ? 'animate-eq-2' : 'h-[10px]'}`} />
            <div className={`w-[3px] bg-acc rounded-sm ${isPlaying ? 'animate-eq-3' : 'h-[4px]'}`} />
          </div>
        ) : (
          index + 1
        )}
      </div>

      {/* 2. Thumbnail */}
      <img
        src={track.thumbnail}
        alt={track.title}
        className="w-10 h-10 rounded object-cover shadow-sm bg-black border border-border/50"
      />

      {/* 3. Title / Artist */}
      <div className="flex flex-col overflow-hidden whitespace-nowrap">
        <span className={`truncate font-medium transition-colors ${isActive ? 'text-acc' : 'text-t1'}`}>
          {track.title}
        </span>
        <span className="truncate text-sm text-t2 mt-0.5">{track.artist}</span>
      </div>

      {/* 4. Album */}
      <div className="hidden md:block truncate text-sm text-t2 whitespace-nowrap pr-4">
        {track.album ?? ''}
      </div>

      {/* 5. Duration */}
      <div className="text-sm font-mono text-t3 text-right">
        {formatTime(track.duration)}
      </div>
    </div>
  );
}