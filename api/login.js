import { emailKey, checkPassword, setSession, readJSON, body, publicUser } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email = '', password = '' } = await body(req);
  const user = await readJSON(`users/${emailKey(String(email))}.json`).catch(() => null);
  if (!user || !checkPassword(String(password), user.salt, user.hash)) {
    await new Promise((r) => setTimeout(r, 400));
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  setSession(res, user);
  return res.status(200).json({ user: publicUser(user) });
}
