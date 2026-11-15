import { getSession, readJSON, writeJSON, body } from './_lib/auth.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'Not logged in' });
  const path = `progress/${s.uid}.json`;
  if (req.method === 'GET') return res.status(200).json({ progress: await readJSON(path).catch(() => null) });
  if (req.method === 'PUT' || req.method === 'POST') {
    const p = await body(req);
    const txt = JSON.stringify(p);
    if (txt.length > 200000) return res.status(413).json({ error: 'Too large' });
    await writeJSON(path, { ...p, savedAt: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
