const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const ROLES = ['viewer', 'editor', 'admin'];
const intId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

router.get('/', async (req, res) => {
  const r = await query(
    'SELECT id, email, role, status, created_at FROM team_members WHERE owner_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ members: r.rows });
});

router.post('/', async (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  const role = ROLES.includes(req.body?.role) ? req.body.role : 'editor';
  if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const dup = await query('SELECT 1 FROM team_members WHERE owner_id=$1 AND email=$2', [req.user.id, email]);
  if (dup.rowCount) return res.status(409).json({ error: 'That person is already invited.' });
  const r = await query(
    `INSERT INTO team_members (owner_id, email, role, status) VALUES ($1,$2,$3,'invited')
     RETURNING id, email, role, status, created_at`,
    [req.user.id, email, role]
  );
  res.json({ member: r.rows[0] });
});

router.delete('/:id', async (req, res) => {
  const id = intId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found.' });
  await query('DELETE FROM team_members WHERE id=$1 AND owner_id=$2', [id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
