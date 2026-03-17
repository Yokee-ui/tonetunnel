import { Hono } from 'hono';
import { getState } from '../lib/state.js';
import db from '../lib/db.js';

const stateRoute = new Hono();

stateRoute.get('/state', (c) => {
  return c.json(getState());
});

stateRoute.get('/history', (c) => {
  const rows = db.prepare(
    'SELECT * FROM play_history ORDER BY played_at DESC LIMIT 50'
  ).all();
  return c.json(rows);
});

export default stateRoute;
