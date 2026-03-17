import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { usePlayerStore } from '../store/playerStore';
import { useSocket } from './useSocket';

Howler.html5PoolSize = 10;

export function usePlayer() {
  const track = usePlayerStore(s => s.track);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const position = usePlayerStore(s => s.position);
  const proxyMode = usePlayerStore(s => s.proxyMode);
  const quality = usePlayerStore(s => s.quality);
  const next = usePlayerStore(s => s.next);
  const prev = usePlayerStore(s => s.prev);
  const seek = usePlayerStore(s => s.seek);
  const socket = useSocket();

  const howlRef = useRef<Howl | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeId = useRef<string | null>(null); // videoId of the howl currently playing

  // Mobile unlock
  useEffect(() => {
    const unlock = () => { Howler.ctx?.resume(); };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }, []);

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album ?? '',
      artwork: track.thumbnail
        ? [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
    navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().play());
    navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().pause());
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [track?.videoId, next, prev]);

  // ── Load track ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!track) return;

    // Cancel any previous in-flight resolve
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Destroy old howl synchronously — .off() removes all listeners first
    // so the old onend can never fire and corrupt the new track
    if (howlRef.current) {
      howlRef.current.off();
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    activeId.current = null;

    const videoId = track.videoId; // capture for closure

    async function loadTrack() {
      try {
        const token = localStorage.getItem('tonetunnel_token');
        let srcUrl: string;

        if (proxyMode) {
          srcUrl = `/proxy/${videoId}`;
        } else {
          const res = await fetch('/api/resolve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ videoId, quality }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Resolve ${res.status}`);
          const data = await res.json() as { url: string };
          srcUrl = data.url;
        }

        // Bail if this request was superseded by a newer track click
        if (controller.signal.aborted) return;

        const howl = new Howl({
          src: [srcUrl],
          html5: true,
          format: ['webm', 'mp3', 'm4a', 'aac', 'flac'],
          volume: 1,
          pool: 1,
          onend() {
            // Only advance queue if this howl is still the active one
            if (activeId.current === videoId) {
              usePlayerStore.getState().next();
              socket?.emit('next');
            }
          },
          onloaderror(_: number, err: unknown) {
            console.error('Load error:', err);
            if (activeId.current === videoId) {
              usePlayerStore.getState().next();
            }
          },
        });

        howlRef.current = howl;
        activeId.current = videoId;

        // Play immediately if the store says we should be playing
        if (usePlayerStore.getState().isPlaying) howl.play();

        // Notify other devices
        socket?.emit('play', { track: usePlayerStore.getState().track, position: 0 });

        // Pre-warm next track's URL in server cache (fire and forget)
        const state = usePlayerStore.getState();
        const nextTrack = state.queue[state.queueIndex + 1];
        if (nextTrack) {
          fetch('/api/resolve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ videoId: nextTrack.videoId, quality }),
          }).catch(() => { });
        }

      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Playback error:', err);
        // Skip broken track
        if (activeId.current === null) usePlayerStore.getState().next();
      }
    }

    loadTrack();

    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.videoId]);

  // ── Play / Pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const h = howlRef.current;
    if (!h) return;
    if (isPlaying && !h.playing()) h.play();
    else if (!isPlaying && h.playing()) h.pause();
  }, [isPlaying]);

  // ── Seek ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = howlRef.current;
    if (!h) return;
    if (Math.abs((h.seek() as number) - position) > 2) h.seek(position);
  }, [position]);

  // ── Progress ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const h = howlRef.current;
      if (h?.playing()) seek(h.seek() as number);
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, seek]);
}