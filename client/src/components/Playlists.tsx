import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Trash2 } from 'lucide-react';
import TrackRow from './TrackRow';

export default function Playlists() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');

  const { data: playlists } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const res = await fetch('/api/playlists', {
        headers: { Authorization: `Bearer ${localStorage.getItem('tonetunnel_token')}` }
      });
      return res.json();
    }
  });

  const { data: tracks } = useQuery({
    queryKey: ['playlist_tracks', selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${selectedId}/tracks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tonetunnel_token')}` }
      });
      return res.json();
    },
    enabled: !!selectedId
  });

  const importMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch('/api/playlists/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('tonetunnel_token')}`
        },
        body: JSON.stringify({ url })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setImportUrl('');
    }
  });

  return (
    <div className="flex gap-8 h-full animate-fade-up">
      {/* List */}
      <div className="w-64 border-r border-border pr-8 flex flex-col gap-4">
        <h2 className="text-xl font-serif mb-2">Your Playlists</h2>
        
        <form 
          onSubmit={e => { e.preventDefault(); if (importUrl) importMutation.mutate(importUrl); }}
          className="flex flex-col gap-2 mb-4"
        >
          <input 
            type="text" 
            placeholder="Paste YT Playlist URL" 
            value={importUrl}
            onChange={e => setImportUrl(e.target.value)}
            className="w-full bg-s2 border border-border rounded-lg px-3 py-2 text-sm text-t1 placeholder-t3 focus:border-acc outline-none"
          />
          <button type="submit" disabled={importMutation.isPending} className="flex items-center gap-2 text-sm text-acc hover:text-t1 font-medium px-2 py-1">
            <FolderPlus size={16} /> 
            {importMutation.isPending ? 'Importing...' : 'Import'}
          </button>
        </form>

        <div className="flex flex-col gap-1">
          {playlists?.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm truncate transition ${selectedId === p.id ? 'bg-s2 text-t1 font-medium' : 'text-t2 hover:bg-white/5 hover:text-t1'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col custom-scrollbar">
        {selectedId ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif">{playlists?.find((p: any) => p.id === selectedId)?.name}</h2>
              <button className="text-t3 hover:text-red-400 transition" title="Delete Playlist">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex flex-col pb-24">
              {tracks?.map((t: any, i: number) => (
                <TrackRow 
                  key={t.video_id} 
                  track={{
                    videoId: t.video_id,
                    title: t.title,
                    artist: t.artist,
                    thumbnail: t.thumbnail,
                    duration: t.duration
                  }} 
                  index={i} 
                  queueContext={tracks.map((ct: any) => ({
                    videoId: ct.video_id,
                    title: ct.title,
                    artist: ct.artist,
                    thumbnail: ct.thumbnail,
                    duration: ct.duration
                  }))}
                />
              ))}
              {!tracks?.length && <div className="text-t3 italic mt-4">Empty playlist.</div>}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-t3 text-sm italic">
            Select a playlist to view tracks
          </div>
        )}
      </div>
    </div>
  );
}
