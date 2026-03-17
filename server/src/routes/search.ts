import { Hono } from 'hono';
import { searchMusic, getArtistData, getAlbumData } from '../lib/ytmusic.js';

const search = new Hono();

search.get('/search', async (c) => {
  const q = c.req.query('q') ?? '';
  if (!q.trim()) return c.json({ songs: [], albums: [], artists: [] });
  const results = await searchMusic(q);
  return c.json(results);
});

search.get('/artist/:id', async (c) => {
  const id = c.req.param('id');
  const data = await getArtistData(id);
  return c.json(data);
});

search.get('/album/:id', async (c) => {
  const id = c.req.param('id');
  const data = await getAlbumData(id);
  return c.json(data);
});

// Thumbnail proxy — lets the frontend read pixel colors without CORS issues
search.get('/thumbnail', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ error: 'Missing url' }, 400);

  const res = await fetch(decodeURIComponent(url));
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

export default search;
