const router = require('express').Router();
const { query } = require('../db');
const { hashPassword, verifyPassword, setSession, clearSession, requireAuth } = require('../auth');

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Enter your name.' });
  if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const lower = email.toLowerCase().trim();
  const exists = await query('SELECT 1 FROM users WHERE email=$1', [lower]);
  if (exists.rowCount) return res.status(409).json({ error: 'That email is already registered.' });

  const hash = await hashPassword(password);
  const r = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, created_at',
    [name.trim(), lower, hash]
  );
  const user = r.rows[0];
  await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_end)
     VALUES ($1,'free','active','monthly', now() + interval '30 days')`,
    [user.id]
  );
  setSession(res, user);
  res.json({ user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const r = await query('SELECT id, name, email, password_hash FROM users WHERE email=$1', [(email || '').toLowerCase().trim()]);
  const u = r.rows[0];
  if (!u || !(await verifyPassword(password || '', u.password_hash)))
    return res.status(401).json({ error: 'Invalid email or password.' });
  setSession(res, u);
  res.json({ user: { id: u.id, name: u.name, email: u.email } });
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const r = await query('SELECT id, name, email, created_at FROM users WHERE id=$1', [req.user.id]);
  if (!r.rowCount) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({ user: r.rows[0] });
});

module.exports = router;
