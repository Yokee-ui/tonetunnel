import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { attachSocket } from './socket/handlers.js';
import { authMiddleware } from './middleware/auth.js';
import searchRoutes from './routes/search.js';
import resolveRoutes from './routes/resolve.js';
import proxyRoute from './routes/proxy.js';
import playlistRoutes from './routes/playlists.js';
import stateRoutes from './routes/stateRoute.js';

const PORT = Number(process.env['PORT'] ?? 3000);

const app = new Hono();

// CORS for dev (Vite runs on 5173)
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowHeaders: ['Authorization', 'Content-Type'],
}));

// ── Protected API routes ─────────────────────────────────────
app.use('/api/*', authMiddleware);
app.use('/proxy/*', authMiddleware);

app.route('/api', searchRoutes);
app.route('/api', resolveRoutes);
app.route('/proxy', proxyRoute);
app.route('/api/playlists', playlistRoutes);
app.route('/api', stateRoutes);

// ── Serve client in production ───────────────────────────────
app.use('/*', serveStatic({ root: '../client/dist' }));
// SPA fallback
app.get('*', serveStatic({ path: '../client/dist/index.html' }));

// ── Start ────────────────────────────────────────────────────
const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`\n🎵  ToneTunnel server running on http://localhost:${info.port}`);
  console.log(`   Auth token: ${process.env['AUTH_TOKEN'] ?? '(not set)'}`);
});

attachSocket(server as any);
