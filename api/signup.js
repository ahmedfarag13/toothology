import crypto from 'node:crypto';
import { emailKey, hashPassword, setSession, writeJSON, readJSON, body, publicUser } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name = '', email = '', password = '', school = '', examDate = '' } = await body(req);
  const n = String(name).trim().slice(0, 60), e = String(email).trim().toLowerCase().slice(0, 120);
  if (n.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Please enter a valid email.' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const path = `users/${emailKey(e)}.json`;
  if (await readJSON(path)) return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
  const { salt, hash } = hashPassword(String(password));
  const user = { id: crypto.randomUUID(), name: n, email: e, school: String(school).slice(0, 80), examDate: String(examDate).slice(0, 10), salt, hash, created: new Date().toISOString() };
  try { await writeJSON(path, user, { overwrite: false }); }
  catch { return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' }); }
  setSession(res, user);
  return res.status(200).json({ user: publicUser(user) });
}
