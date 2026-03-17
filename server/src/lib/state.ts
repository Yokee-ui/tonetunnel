import db from './db.js';

export interface PlaybackState {
  videoId:    string | null;
  title:      string | null;
  artist:     string | null;
  thumbnail:  string | null;
  position:   number;
  queue:      QueueTrack[];
  queueIndex: number;
  masterId:   string | null;
  isPlaying:  boolean;
  updatedAt:  number;
}

export interface QueueTrack {
  videoId:   string;
  title:     string;
  artist:    string;
  thumbnail: string;
  duration:  number;
}

let state: PlaybackState = loadState();

function loadState(): PlaybackState {
  const row = db.prepare('SELECT * FROM playback_state WHERE id = 1').get() as Record<string, unknown> | undefined;
  if (!row) {
    return {
      videoId: null, title: null, artist: null, thumbnail: null,
      position: 0, queue: [], queueIndex: 0,
      masterId: null, isPlaying: false, updatedAt: 0,
    };
  }
  let queue: QueueTrack[] = [];
  try { queue = JSON.parse(row['queue'] as string); } catch { /* empty */ }
  return {
    videoId:    (row['video_id'] as string | null) ?? null,
    title:      (row['title'] as string | null) ?? null,
    artist:     (row['artist'] as string | null) ?? null,
    thumbnail:  (row['thumbnail'] as string | null) ?? null,
    position:   (row['position'] as number) ?? 0,
    queue,
    queueIndex: (row['queue_index'] as number) ?? 0,
    masterId:   null,
    isPlaying:  false,
    updatedAt:  (row['updated_at'] as number) ?? 0,
  };
}

export function getState(): PlaybackState {
  return { ...state };
}

export function setState(patch: Partial<PlaybackState>): PlaybackState {
  state = { ...state, ...patch, updatedAt: Date.now() };
  persistState();
  return state;
}

function persistState(): void {
  db.prepare(`
    UPDATE playback_state SET
      video_id    = @videoId,
      title       = @title,
      artist      = @artist,
      thumbnail   = @thumbnail,
      position    = @position,
      queue       = @queue,
      queue_index = @queueIndex,
      updated_at  = @updatedAt
    WHERE id = 1
  `).run({
    videoId:    state.videoId,
    title:      state.title,
    artist:     state.artist,
    thumbnail:  state.thumbnail,
    position:   state.position,
    queue:      JSON.stringify(state.queue),
    queueIndex: state.queueIndex,
    updatedAt:  state.updatedAt,
  });
}
