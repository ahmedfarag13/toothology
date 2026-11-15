import { getSession, readJSON } from './_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'Not logged in' });
  const wk = String(req.query?.wk || '');
  const board = (await readJSON('leaderboard.json').catch(() => null)) || { users: {} };
  const rows = Object.entries(board.users).map(([id, u]) => ({ me: id === s.uid, n: u.n, xp: u.xp, week: u.wk === wk ? u.wkxp : 0, st: u.st }));
  const top = (key) => rows.filter((r) => r[key] > 0 || r.me).sort((a, b) => b[key] - a[key]).map((r, i) => ({ ...r, rank: i + 1 }));
  const cut = (list) => { const t = list.slice(0, 25); const me = list.find((r) => r.me); if (me && !t.includes(me)) t.push(me); return t; };
  return res.status(200).json({ week: cut(top('week')), all: cut(top('xp')), total: rows.length });
}
