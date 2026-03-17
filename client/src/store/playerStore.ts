import { create } from 'zustand';

export interface Track {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  duration: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  track: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  repeat: RepeatMode;
  shuffle: boolean;
  masterId: string | null;
  accentColor: string;
  crossfadeSec: number;
  proxyMode: boolean;
  quality: string;

  // Actions
  playTrack: (track: Track, queue: Track[], index: number) => void;
  setTrack: (t: Track | null) => void;
  setQueue: (q: Track[], idx: number) => void;
  play: () => void;
  pause: () => void;
  seek: (pos: number) => void;
  next: () => void;
  prev: () => void;
  setRepeat: (r: RepeatMode) => void;
  toggleShuffle: () => void;
  setAccentColor: (rgb: string) => void;

  // Sync
  syncState: (state: Partial<PlayerState>) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  position: 0,
  repeat: 'off',
  shuffle: false,
  masterId: null,
  accentColor: 'rgb(136, 136, 170)',
  crossfadeSec: 3,
  proxyMode: false,
  quality: 'best',

  // Atomic: sets track + queue + playing in one update so usePlayer
  // never sees isPlaying=true with a stale track reference
  playTrack: (track, queue, index) => set({
    track,
    queue,
    queueIndex: index,
    isPlaying: true,
    position: 0,
  }),

  setTrack: (t) => set({ track: t, position: 0 }),
  setQueue: (q, idx) => set({ queue: q, queueIndex: idx }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (pos) => set({ position: pos }),

  next: () => {
    const { queue, queueIndex, repeat } = get();
    if (queue.length === 0) return;
    if (repeat === 'one') {
      set({ position: 0, isPlaying: true });
      return;
    }
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      set({ track: queue[nextIdx], queueIndex: nextIdx, position: 0, isPlaying: true });
    } else if (repeat === 'all') {
      set({ track: queue[0], queueIndex: 0, position: 0, isPlaying: true });
    } else {
      set({ isPlaying: false, position: 0 });
    }
  },

  prev: () => {
    const { queue, queueIndex, position } = get();
    if (queue.length === 0) return;
    if (position > 5) {
      set({ position: 0 });
      return;
    }
    const prevIdx = Math.max(queueIndex - 1, 0);
    set({ track: queue[prevIdx], queueIndex: prevIdx, position: 0, isPlaying: true });
  },

  setRepeat: (r) => set({ repeat: r }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  setAccentColor: (rgb) => set({ accentColor: rgb }),
  syncState: (patch) => set({ ...patch }),
}));