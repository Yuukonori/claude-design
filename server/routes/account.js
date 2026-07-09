const router = require('express').Router();
const { query } = require('../db');
const { requireAuth, hashPassword, verifyPassword } = require('../auth');

router.use(requireAuth);

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

router.put('/', async (req, res) => {
  const sets = [], vals = []; let i = 1;
  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) return res.status(400).json({ error: 'Name cannot be empty.' });
    sets.push(`name=$${i++}`); vals.push(name);
  }
  if (req.body?.email !== undefined) {
    const email = String(req.body.email).toLowerCase().trim();
    if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    const dup = await query('SELECT 1 FROM users WHERE email=$1 AND id<>$2', [email, req.user.id]);
    if (dup.rowCount) return res.status(409).json({ error: 'That email is already in use.' });
    sets.push(`email=$${i++}`); vals.push(email);
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(req.user.id);
  const r = await query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${i} RETURNING id, name, email, created_at`, vals);
  res.json({ user: r.rows[0] });
});

router.put('/password', async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  const r = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!r.rowCount || !(await verifyPassword(current || '', r.rows[0].password_hash)))
    return res.status(401).json({ error: 'Current password is incorrect.' });
  const hash = await hashPassword(next);
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
