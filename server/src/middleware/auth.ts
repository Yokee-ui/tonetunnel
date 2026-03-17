import type { Context, Next } from 'hono';

const AUTH_TOKEN = process.env['AUTH_TOKEN'] ?? '';

export async function authMiddleware(c: Context, next: Next) {
  // Accept token from Authorization header OR query param (needed for img src requests)
  const header = c.req.header('Authorization');
  const queryToken = c.req.query('token');

  const token = header?.replace('Bearer ', '').trim() ?? queryToken?.trim() ?? '';

  if (!token || token !== AUTH_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
}