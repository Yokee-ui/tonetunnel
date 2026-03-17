import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import TrackRow from './TrackRow';

export default function Search() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  // Debounce: only update the actual query 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const token = localStorage.getItem('tonetunnel_token');
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.length > 1,
    staleTime: 1000 * 60 * 5, // cache results 5 mins — same query won't re-fetch
  });

  const busy = isLoading || isFetching;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search songs, albums, artists..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full max-w-xl bg-s2 border border-border rounded-xl px-5 py-4 text-t1 placeholder-t3 focus:border-acc focus:outline-none transition-colors text-lg"
          autoFocus
        />
        {busy && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-t3 text-sm animate-pulse">
            Searching...
          </div>
        )}
      </div>

      {!busy && query.length > 1 && data?.songs?.length === 0 && (
        <div className="text-t2 italic">No results for "{query}"</div>
      )}

      {data?.songs?.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-t3 mb-3 pl-2">
            Songs
          </h2>
          <div className="flex flex-col">
            {data.songs.map((song: any, i: number) => (
              <TrackRow
                key={song.videoId}
                track={song}
                index={i}
                queueContext={data.songs}
              />
            ))}
          </div>
        </section>
      )}

      {data?.albums?.length > 0 && (
        <section className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-t3 mb-3 pl-2">
            Albums
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.albums.map((album: any) => (
              <div
                key={album.albumId}
                className="group p-3 rounded-lg hover:bg-s2 transition cursor-pointer"
              >
                <img
                  src={album.thumbnail}
                  alt={album.title}
                  className="w-full aspect-square object-cover rounded-md mb-3 shadow-md border border-border/50"
                />
                <div className="font-medium text-t1 truncate">{album.title}</div>
                <div className="text-sm text-t2 truncate">{album.artist}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}