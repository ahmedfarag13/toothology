import { getSession, readJSON, writeJSON, body } from './_lib/auth.js';

const shortName = (n = '') => { const p = n.trim().split(/\s+/); return p[0] + (p[1] ? ' ' + p[1][0].toUpperCase() + '.' : ''); };

async function updateBoard(s, p) {
  try {
    const board = (await readJSON('leaderboard.json').catch(() => null)) || { users: {} };
    if (p.board === false) delete board.users[s.uid];
    else board.users[s.uid] = { n: shortName(s.name), xp: +p.xp || 0, wk: p.wk || '', wkxp: +p.wkxp || 0, st: +p.streak || 0, t: Date.now() };
    await writeJSON('leaderboard.json', board);
  } catch (e) { /* leaderboard is best-effort */ }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'Not logged in' });
  const path = `progress/${s.uid}.json`;
  if (req.method === 'GET') return res.status(200).json({ progress: await readJSON(path).catch(() => null) });
  if (req.method === 'PUT' || req.method === 'POST') {
    const p = await body(req);
    if (JSON.stringify(p).length > 200000) return res.status(413).json({ error: 'Too large' });
    await writeJSON(path, { ...p, savedAt: new Date().toISOString() });
    await updateBoard(s, p);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
