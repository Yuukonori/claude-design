const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

const intId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
const TYPES = new Set(['component', 'shader', 'animation', 'template', 'plugin']);

// List this user's installed/owned library items.
router.get('/', async (req, res) => {
  const r = await query(
    'SELECT id, type, name, data, source, created_at FROM library_items WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ items: r.rows });
});

// Install (from market) or create a custom item.
router.post('/', async (req, res) => {
  const type = String(req.body?.type || '');
  if (!TYPES.has(type)) return res.status(400).json({ error: 'Invalid item type.' });
  const name = (req.body?.name || 'Untitled').toString().trim().slice(0, 120) || 'Untitled';
  const data = req.body?.data ?? {};
  const source = req.body?.source != null ? String(req.body.source).slice(0, 120) : null;
  const r = await query(
    'INSERT INTO library_items (user_id, type, name, data, source) VALUES ($1,$2,$3,$4,$5) RETURNING id, type, name, data, source, created_at',
    [req.user.id, type, name, data, source]
  );
  res.json({ item: r.rows[0] });
});

// Modify name and/or data (rename / edit an owned item).
router.put('/:id', async (req, res) => {
  const id = intId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found.' });
  const sets = [], vals = []; let i = 1;
  if (req.body?.name !== undefined) { sets.push(`name=$${i++}`); vals.push(String(req.body.name).trim().slice(0, 120)); }
  if (req.body?.data !== undefined) { sets.push(`data=$${i++}`); vals.push(req.body.data); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.id);
  const r = await query(
    `UPDATE library_items SET ${sets.join(', ')} WHERE id=$${i++} AND user_id=$${i} RETURNING id, type, name, data, source, created_at`,
    vals
  );
  if (!r.rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ item: r.rows[0] });
});

// Delete an owned item.
router.delete('/:id', async (req, res) => {
  const id = intId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found.' });
  await query('DELETE FROM library_items WHERE id=$1 AND user_id=$2', [id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
