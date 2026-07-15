const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// Display name only — email/identity come from GitHub and are read-only. No passwords anymore.
router.put('/', async (req, res) => {
  if (req.body?.name === undefined) return res.status(400).json({ error: 'Nothing to update.' });
  const name = String(req.body.name).trim();
  if (!name) return res.status(400).json({ error: 'Name cannot be empty.' });
  const r = await query(
    'UPDATE users SET name=$1 WHERE id=$2 RETURNING id, name, email, github_login, avatar_url, created_at',
    [name, req.user.id]
  );
  res.json({ user: r.rows[0] });
});

module.exports = router;
