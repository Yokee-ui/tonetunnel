import { Hono } from 'hono';
import { getCached, setCache } from '../lib/cache.js';
import { resolveStream } from '../lib/ytdlp.js';
import https from 'https';
import http from 'http';

const proxy = new Hono();

proxy.get('/proxy/:videoId', async (c) => {
  const videoId = c.req.param('videoId');

  let streamUrl = getCached(videoId);
  if (!streamUrl) {
    try {
      const { url } = await resolveStream(videoId);
      setCache(videoId, url);
      streamUrl = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: msg }, 503);
    }
  }

  const rangeHeader = c.req.header('Range') ?? '';

  return new Promise<Response>((res) => {
    const parsed = new URL(streamUrl!);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(streamUrl!, {
      headers: {
        'Range':       rangeHeader,
        'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':      '*/*',
        'Connection':  'keep-alive',
      },
    }, (upstream) => {
      const status = upstream.statusCode ?? 200;
      const headers: Record<string, string> = {
        'Content-Type':   (upstream.headers['content-type'] as string | undefined) ?? 'audio/mpeg',
        'Accept-Ranges':  'bytes',
      };

      const cl = upstream.headers['content-length'];
      if (cl) headers['Content-Length'] = cl as string;
      const cr = upstream.headers['content-range'];
      if (cr) headers['Content-Range'] = cr as string;

      // Stream using ReadableStream
      const readable = new ReadableStream({
        start(controller) {
          upstream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
          upstream.on('end', () => controller.close());
          upstream.on('error', (e) => controller.error(e));
        },
      });

      res(new Response(readable, { status, headers }));
    });

    req.on('error', (e) => {
      res(new Response(JSON.stringify({ error: e.message }), { status: 502 }));
    });
  });
});

export default proxy;
