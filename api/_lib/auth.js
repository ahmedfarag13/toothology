import crypto from 'node:crypto';
import { put, get } from '@vercel/blob';

const SECRET = process.env.AUTH_SECRET || '';
const COOKIE = 'tt_sess';
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export const emailKey = (email) => crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

export function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { salt, hash };
}
export function checkPassword(pw, salt, hash) {
  const h = Buffer.from(hashPassword(pw, salt).hash, 'hex');
  const want = Buffer.from(hash, 'hex');
  return h.length === want.length && crypto.timingSafeEqual(h, want);
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

export function setSession(res, user) {
  const body = b64(JSON.stringify({ uid: user.id, name: user.name, email: user.email, exp: Date.now() + MAX_AGE * 1000 }));
  const token = `${body}.${sign(body)}`;
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}
export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
export function getSession(req) {
  if (!SECRET) return null;
  const raw = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const [body, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!body || !sig) return null;
  const expect = sign(body);
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString());
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}

export async function readJSON(path) {
  const r = await get(path, { access: 'private', useCache: false });
  if (!r) return null;
  const txt = await new Response(r.stream).text();
  return JSON.parse(txt);
}
export async function writeJSON(path, obj, { overwrite = true } = {}) {
  return put(path, JSON.stringify(obj), {
    access: 'private', addRandomSuffix: false, allowOverwrite: overwrite, contentType: 'application/json', cacheControlMaxAge: 60,
  });
}

export async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, created: u.created });
