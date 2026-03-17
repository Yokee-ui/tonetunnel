import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'tonetunnel.db');

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS playlists (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id  TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    video_id     TEXT NOT NULL,
    title        TEXT,
    artist       TEXT,
    thumbnail    TEXT,
    duration     INTEGER,
    position     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (playlist_id, video_id)
  );

  CREATE TABLE IF NOT EXISTS play_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id   TEXT NOT NULL,
    title      TEXT,
    artist     TEXT,
    thumbnail  TEXT,
    played_at  INTEGER NOT NULL,
    device     TEXT
  );

  CREATE TABLE IF NOT EXISTS playback_state (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    video_id   TEXT,
    title      TEXT,
    artist     TEXT,
    thumbnail  TEXT,
    position   REAL DEFAULT 0,
    queue      TEXT DEFAULT '[]',
    queue_index INTEGER DEFAULT 0,
    updated_at INTEGER
  );

  INSERT OR IGNORE INTO playback_state (id, position, queue, queue_index, updated_at)
  VALUES (1, 0, '[]', 0, 0);
`);

export default db;
