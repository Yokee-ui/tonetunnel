import { Hono } from 'hono';
import { resolveStream } from '../lib/ytdlp.js';
import { getCached, setCache } from '../lib/cache.js';
import { getRelatedTracks } from '../lib/ytmusic.js';

const resolve = new Hono();

resolve.post('/resolve', async (c) => {
  let body: { videoId?: string; quality?: string };
  try {
    body = await c.req.json() as { videoId?: string; quality?: string };
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { videoId, quality = 'best' } = body;
  if (!videoId) return c.json({ error: 'videoId is required' }, 400);

  const cached = getCached(videoId);
  if (cached) return c.json({ url: cached, cached: true });

  try {
    const { url } = await resolveStream(videoId, quality);
    setCache(videoId, url);
    return c.json({ url, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: `Track unavailable: ${message}` }, 503);
  }
});

resolve.get('/related/:videoId', async (c) => {
  const videoId = c.req.param('videoId');
  const tracks = await getRelatedTracks(videoId);
  return c.json(tracks);
});

export default resolve;
