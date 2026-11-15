import { getSession } from './_lib/auth.js';
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const s = getSession(req);
  if (!s) return res.status(401).json({ user: null });
  return res.status(200).json({ user: { id: s.uid, name: s.name, email: s.email } });
}
