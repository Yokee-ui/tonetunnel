import { usePlayerStore } from '../store/playerStore';

export default function Settings() {
  const { proxyMode, quality, crossfadeSec, syncState } = usePlayerStore();

  return (
    <div className="max-w-2xl animate-fade-up flex flex-col gap-8">
      
      <section>
        <h2 className="text-xl font-serif text-t1 mb-4 border-b border-border pb-2">Playback Settings</h2>
        
        {/* Quality */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-sm font-medium text-t2">Audio Quality (yt-dlp format)</label>
          <div className="flex gap-2">
            {['best', 'medium', 'low'].map(q => (
              <button
                key={q}
                onClick={() => syncState({ quality: q })}
                className={`px-4 py-2 rounded-md text-sm capitalize transition 
                  ${quality === q ? 'bg-acc text-bg font-medium' : 'bg-s2 text-t1 hover:bg-white/10'}
                `}
              >
                {q}
              </button>
            ))}
          </div>
          <p className="text-xs text-t3 mt-1">
            Best (original Opus/AAC), Medium (≤128kbps), Low (≤64kbps). Takes effect next track.
          </p>
        </div>

        {/* Crossfade */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-sm font-medium text-t2 flex justify-between">
            Crossfade Duration <span>{crossfadeSec}s</span>
          </label>
          <input 
            type="range" 
            min="0" max="8" step="1"
            value={crossfadeSec}
            onChange={(e) => syncState({ crossfadeSec: Number(e.target.value) })}
            className="w-full h-1 bg-s2 rounded-full appearance-none cursor-pointer range-slider"
          />
        </div>

      </section>

      <section>
        <h2 className="text-xl font-serif text-t1 mb-4 border-b border-border pb-2">Network</h2>
        
        {/* Proxy Mode */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col">
            <span className="font-medium text-t1">Server Proxy Mode</span>
            <span className="text-sm text-t3">Route YouTube CDN traffic through your server.</span>
          </div>
          <button 
            onClick={() => syncState({ proxyMode: !proxyMode })}
            className={`w-12 h-6 rounded-full relative transition-colors ${proxyMode ? 'bg-acc' : 'bg-s2'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${proxyMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

    </div>
  );
}
