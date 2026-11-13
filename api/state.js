import { Redis } from '@upstash/redis';

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const validVector = (a, max = 999) => Array.isArray(a) && a.length === 5 && a.every(n => Number.isInteger(n) && n >= 0 && n <= max);
const validRecipe = r => r && typeof r.id === 'string' && r.id.length <= 100 && typeof r.name === 'string' && r.name.trim().length > 0 && r.name.length <= 60 && validVector(r.cost, 30) && validVector(r.gain, 30) && r.cost.some(Boolean) && r.gain.some(Boolean);
function validState(s) {
  if (!s || typeof s !== 'object' || !validVector(s.inventory) || !validVector(s.requirements)) return false;
  if (!Array.isArray(s.recipes) || s.recipes.length > 500 || !s.recipes.every(validRecipe)) return false;
  const ids = s.recipes.map(r => r.id);
  const names = s.recipes.map(r => r.name.trim().toLowerCase());
  const signatures = s.recipes.map(r => JSON.stringify([r.cost, r.gain]));
  if (new Set(ids).size !== ids.length || new Set(names).size !== names.length || new Set(signatures).size !== signatures.length) return false;
  if (!Array.isArray(s.activeIds) || s.activeIds.length > 500 || new Set(s.activeIds).size !== s.activeIds.length || !s.activeIds.every(id => ids.includes(id))) return false;
  return Array.isArray(s.history) && s.history.length <= 100 && s.history.every(h => h && typeof h.name === 'string' && h.name.length <= 100 && validVector(h.before) && validVector(h.after));
}

// Web-standard handler supported by Vercel's current Node.js functions runtime.
// Future authentication belongs here, before reading or writing the workspace key.
export default {
  async fetch(request) {
    if (!['GET', 'PUT'].includes(request.method)) return json(405, { error: 'Method not allowed' });
    const workspace = request.headers.get('x-workspace-id');
    if (!workspace || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspace)) return json(400, { error: 'Invalid workspace identifier' });
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return json(503, { error: 'Database not configured. Connect Upstash Redis to Vercel.' });
    try {
      const redis = Redis.fromEnv();
      const key = `dark-carnival:v1:${workspace}`;
      if (request.method === 'GET') return json(200, { state: await redis.get(key) });
      const raw = await request.text();
      if (raw.length > 100000) return json(413, { error: 'Payload too large' });
      let state;
      try { state = JSON.parse(raw); } catch { return json(400, { error: 'Invalid JSON' }); }
      if (!validState(state)) return json(422, { error: 'Invalid planner state' });
      await redis.set(key, state);
      return json(200, { ok: true });
    } catch (error) {
      console.error('State API failed', error);
      return json(500, { error: 'Unable to access the database' });
    }
  }
};
