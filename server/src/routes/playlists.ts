import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import db from '../lib/db.js';
import { resolvePlaylistEntries } from '../lib/ytdlp.js';

const playlists = new Hono();

// List all playlists
playlists.get('/', (c) => {
  const rows = db.prepare('SELECT * FROM playlists ORDER BY created_at DESC').all();
  return c.json(rows);
});

// Create playlist
playlists.post('/', async (c) => {
  let body: { name?: string };
  try { body = await c.req.json() as { name?: string }; }
  catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { name } = body;
  if (!name?.trim()) return c.json({ error: 'name is required' }, 400);

  const id = nanoid();
  db.prepare('INSERT INTO playlists (id, name, created_at) VALUES (?, ?, ?)')
    .run(id, name.trim(), Date.now());

  return c.json({ id, name: name.trim(), created_at: Date.now() }, 201);
});

// Rename playlist
playlists.patch('/:id', async (c) => {
  const id = c.req.param('id');
  let body: { name?: string };
  try { body = await c.req.json() as { name?: string }; }
  catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { name } = body;
  if (!name?.trim()) return c.json({ error: 'name is required' }, 400);

  db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run(name.trim(), id);
  return c.json({ id, name: name.trim() });
});

// Delete playlist
playlists.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
  return c.json({ ok: true });
});

// Get tracks in playlist
playlists.get('/:id/tracks', (c) => {
  const id = c.req.param('id');
  const tracks = db.prepare(
    'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC'
  ).all(id);
  return c.json(tracks);
});

// Add track to playlist
playlists.post('/:id/tracks', async (c) => {
  const playlist_id = c.req.param('id');
  let body: {
    videoId?: string; title?: string; artist?: string;
    thumbnail?: string; duration?: number;
  };
  try { body = await c.req.json() as typeof body; }
  catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { videoId, title = '', artist = '', thumbnail = '', duration = 0 } = body;
  if (!videoId) return c.json({ error: 'videoId required' }, 400);

  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position), -1) as m FROM playlist_tracks WHERE playlist_id = ?'
  ).get(playlist_id) as { m: number };

  db.prepare(`
    INSERT OR REPLACE INTO playlist_tracks
      (playlist_id, video_id, title, artist, thumbnail, duration, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(playlist_id, videoId, title, artist, thumbnail, duration, maxPos.m + 1);

  return c.json({ ok: true }, 201);
});

// Remove track from playlist
playlists.delete('/:id/tracks/:videoId', (c) => {
  const playlist_id = c.req.param('id');
  const video_id = c.req.param('videoId');
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?')
    .run(playlist_id, video_id);
  return c.json({ ok: true });
});

// Import YouTube playlist by URL
playlists.post('/import', async (c) => {
  let body: { url?: string; name?: string };
  try { body = await c.req.json() as { url?: string; name?: string }; }
  catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const { url, name } = body;
  if (!url) return c.json({ error: 'url is required' }, 400);

  const entries = await resolvePlaylistEntries(url).catch((e: Error) => {
    throw new Error(`Failed to import playlist: ${e.message}`);
  });

  const id = nanoid();
  const playlistName = name?.trim() || `Imported ${new Date().toLocaleString()}`;

  db.prepare('INSERT INTO playlists (id, name, created_at) VALUES (?, ?, ?)').run(
    id, playlistName, Date.now()
  );

  const insert = db.prepare(
    'INSERT OR IGNORE INTO playlist_tracks (playlist_id, video_id, title, artist, thumbnail, duration, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((items: typeof entries) => {
    for (const e of items) {
      insert.run(id, e.videoId, e.title, e.artist, e.thumbnail, e.duration, e.position);
    }
  });
  insertMany(entries);

  return c.json({ id, name: playlistName, trackCount: entries.length }, 201);
});

export default playlists;
