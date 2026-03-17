// Module-level singleton — only ONE socket connection per browser tab, ever.
// Every component that calls useSocket() gets the same instance.
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePlayerStore, Track } from '../store/playerStore';

let _socket: Socket | null = null;

function getOrCreateSocket(token: string): Socket {
  if (_socket?.connected) return _socket;

  // Clean up stale socket if disconnected
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  _socket = io('/', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  });

  return _socket;
}

// Call this once at the top of the app (in App.tsx) to wire up all listeners
export function useSocketInit() {
  const initialized = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('tonetunnel_token');
    if (!token || initialized.current) return;
    initialized.current = true;

    const socket = getOrCreateSocket(token);

    socket.on('state_snapshot', (state: any) => {
      const store = usePlayerStore.getState();
      store.syncState({
        queue: state.queue ?? [],
        queueIndex: state.queueIndex ?? 0,
        position: state.position ?? 0,
        isPlaying: false, // never auto-play on connect
      });
      if (state.videoId) {
        store.setTrack({
          videoId: state.videoId,
          title: state.title ?? '',
          artist: state.artist ?? '',
          thumbnail: state.thumbnail ?? '',
          duration: 0,
        });
      }
    });

    socket.on('play', (state: any) => {
      const store = usePlayerStore.getState();
      // Only apply remote play if it's from a different master device
      if (state.masterId && state.masterId === socket.id) return;
      store.syncState({ position: state.position, isPlaying: true });
    });

    socket.on('pause', (state: any) => {
      usePlayerStore.getState().syncState({ isPlaying: false, position: state.position });
    });

    socket.on('seek', (state: any) => {
      usePlayerStore.getState().syncState({ position: state.position });
    });

    socket.on('track_change', (data: { track: Track; queue: Track[]; index: number }) => {
      const store = usePlayerStore.getState();
      store.setQueue(data.queue, data.index);
      store.setTrack(data.track);
      store.syncState({ isPlaying: true });
    });

    socket.on('queue_update', (data: { queue: Track[]; index: number }) => {
      usePlayerStore.getState().setQueue(data.queue, data.index);
    });

    return () => {
      initialized.current = false;
    };
  }, []);
}

// All components use this — returns the singleton, never creates a new connection
export function useSocket(): Socket | null {
  const token = localStorage.getItem('tonetunnel_token');
  if (!token) return null;
  return getOrCreateSocket(token);
}