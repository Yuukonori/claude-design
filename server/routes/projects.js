const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

const intId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

router.get('/', async (req, res) => {
  const r = await query(
    'SELECT id, name, updated_at, created_at FROM projects WHERE user_id=$1 ORDER BY updated_at DESC',
    [req.user.id]
  );
  res.json({ projects: r.rows });
});

router.post('/', async (req, res) => {
  const name = (req.body?.name || 'Untitled project').toString().trim().slice(0, 120) || 'Untitled project';
  const canvas = req.body?.canvas ?? {};
  const r = await query(
    'INSERT INTO projects (user_id, name, canvas) VALUES ($1,$2,$3) RETURNING id, name, updated_at, created_at',
    [req.user.id, name, canvas]
  );
  res.json({ project: r.rows[0] });
});

router.get('/:id', async (req, res) => {
  const id = intId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found.' });
  const r = await query('SELECT id, name, canvas, updated_at FROM projects WHERE id=$1 AND user_id=$2', [id, req.user.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ project: r.rows[0] });
});

router.put('/:id', async (req, res) => {
  const id = intId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found.' });
  const sets = [], vals = []; let i = 1;
  if (req.body?.name !== undefined) { sets.push(`name=$${i++}`); vals.push(String(req.body.name).trim().slice(0, 120)); }
  if (req.body?.canvas !== undefined) { sets.push(`canvas=$${i++}`); vals.push(req.body.canvas); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });
  sets.push('updated_at=now()');
  vals.push(id, req.user.id);
  const r = await query(
    `UPDATE projects SET ${sets.join(', ')} WHERE id=$${i++} AND user_id=$${i} RETURNING id, name, updated_at`,
    vals
  );
  if (!r.rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ project: r.rows[0] });
});

router.delete('/:id', async (req, res) => {
  const id = intId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found.' });
  await query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
