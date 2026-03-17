import { spawn } from 'child_process';

const YTDLP = process.env['YTDLP_PATH'] ?? 'yt-dlp';

const QUALITY_FORMAT: Record<string, string> = {
  best:   'bestaudio',
  medium: 'bestaudio[abr<=128]',
  low:    'bestaudio[abr<=64]',
};

export interface StreamResult {
  url: string;
  format: string;
}

export function resolveStream(videoId: string, quality = 'best'): Promise<StreamResult> {
  return new Promise((resolve, reject) => {
    const format = QUALITY_FORMAT[quality] ?? 'bestaudio';
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const args = ['-f', format, '--get-url', '--no-playlist', ytUrl];

    const proc = spawn(YTDLP, args, { shell: false });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
        return;
      }
      const url = stdout.trim().split('\n')[0]?.trim();
      if (!url) {
        reject(new Error('yt-dlp returned no URL'));
        return;
      }
      resolve({ url, format });
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}. Make sure yt-dlp is installed and on PATH.`));
    });
  });
}

export function resolvePlaylistEntries(playlistUrl: string): Promise<PlaylistEntry[]> {
  return new Promise((resolve, reject) => {
    const args = ['--flat-playlist', '-J', '--no-warnings', playlistUrl];
    const proc = spawn(YTDLP, args, { shell: false });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp playlist fetch failed: ${stderr.trim()}`));
        return;
      }
      try {
        const data = JSON.parse(stdout) as { entries?: RawEntry[] };
        const entries = (data.entries ?? []).map((e, i) => ({
          videoId:   e.id ?? '',
          title:     e.title ?? 'Unknown',
          artist:    e.uploader ?? e.channel ?? '',
          thumbnail: e.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
          duration:  e.duration ?? 0,
          position:  i,
        }));
        resolve(entries);
      } catch (err) {
        reject(new Error('Failed to parse yt-dlp playlist JSON'));
      }
    });

    proc.on('error', (err) => reject(new Error(`Failed to spawn yt-dlp: ${err.message}`)));
  });
}

interface PlaylistEntry {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  position: number;
}

interface RawEntry {
  id?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnails?: { url?: string }[];
}
