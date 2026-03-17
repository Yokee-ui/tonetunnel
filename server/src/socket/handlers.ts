import type { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { getState, setState } from '../lib/state.js';
import db from '../lib/db.js';
import type { QueueTrack } from '../lib/state.js';

const AUTH_TOKEN = process.env['AUTH_TOKEN'] ?? '';

// 200ms debounce for seek to avoid ping-pong
let seekTimer: ReturnType<typeof setTimeout> | null = null;

export function attachSocket(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token || token !== AUTH_TOKEN) {
      next(new Error('Unauthorized'));
      return;
    }
    next();
  });

  io.on('connection', (socket) => {
    const clientId = socket.id;
    console.log(`[socket] connected: ${clientId}`);

    // Send full state snapshot on connect
    socket.emit('state_snapshot', { ...getState(), clientId });

    // ── play ──────────────────────────────────────────────────
    socket.on('play', (data: { track: QueueTrack; position?: number }) => {
      const { track, position = 0 } = data;
      const newState = setState({
        videoId:   track.videoId,
        title:     track.title,
        artist:    track.artist,
        thumbnail: track.thumbnail,
        position,
        isPlaying: true,
      });

      // Log to history
      db.prepare(
        'INSERT INTO play_history (video_id, title, artist, thumbnail, played_at, device) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(track.videoId, track.title, track.artist, track.thumbnail, Date.now(), clientId);

      socket.broadcast.emit('play', { ...newState, masterId: clientId });
    });

    // ── pause ─────────────────────────────────────────────────
    socket.on('pause', (data: { position: number }) => {
      const newState = setState({ isPlaying: false, position: data.position });
      socket.broadcast.emit('pause', { position: newState.position });
    });

    // ── seek (debounced 200ms) ────────────────────────────────
    socket.on('seek', (data: { position: number }) => {
      if (seekTimer) clearTimeout(seekTimer);
      seekTimer = setTimeout(() => {
        setState({ position: data.position });
        socket.broadcast.emit('seek', { position: data.position });
      }, 200);
    });

    // ── next ──────────────────────────────────────────────────
    socket.on('next', () => {
      const s = getState();
      const nextIndex = Math.min(s.queueIndex + 1, s.queue.length - 1);
      const nextTrack = s.queue[nextIndex];
      if (!nextTrack) return;

      const newState = setState({
        videoId:    nextTrack.videoId,
        title:      nextTrack.title,
        artist:     nextTrack.artist,
        thumbnail:  nextTrack.thumbnail,
        queueIndex: nextIndex,
        position:   0,
        isPlaying:  true,
      });
      io.emit('track_change', { track: nextTrack, queue: newState.queue, index: nextIndex });
    });

    // ── prev ──────────────────────────────────────────────────
    socket.on('prev', () => {
      const s = getState();
      const prevIndex = Math.max(s.queueIndex - 1, 0);
      const prevTrack = s.queue[prevIndex];
      if (!prevTrack) return;

      const newState = setState({
        videoId:    prevTrack.videoId,
        title:      prevTrack.title,
        artist:     prevTrack.artist,
        thumbnail:  prevTrack.thumbnail,
        queueIndex: prevIndex,
        position:   0,
        isPlaying:  true,
      });
      io.emit('track_change', { track: prevTrack, queue: newState.queue, index: prevIndex });
    });

    // ── queue_set ─────────────────────────────────────────────
    socket.on('queue_set', (data: { tracks: QueueTrack[]; index: number }) => {
      const newState = setState({ queue: data.tracks, queueIndex: data.index });
      io.emit('queue_update', { queue: newState.queue, index: newState.queueIndex });
    });

    // ── take_control ──────────────────────────────────────────
    socket.on('take_control', () => {
      setState({ masterId: clientId });
      io.emit('master_change', { masterId: clientId });
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${clientId}`);
    });
  });

  return io;
}
