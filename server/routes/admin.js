// Admin API — mounted at /api/admin, gated to the configured GitHub admin (ADMIN_GITHUB_LOGIN).
const router = require('express').Router();
const { query } = require('../db');
const { requireAdmin, isAdminLogin } = require('../auth');

router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  const u = await query('SELECT count(*)::int AS n FROM users');
  const p = await query('SELECT count(*)::int AS n FROM projects');
  const byPlan = await query(
    `SELECT plan_id, count(*)::int AS n FROM subscriptions WHERE status='active' GROUP BY plan_id`
  );
  res.json({ users: u.rows[0].n, projects: p.rows[0].n, byPlan: byPlan.rows });
});

router.get('/users', async (req, res) => {
  const r = await query(
    `SELECT u.id, u.name, u.email, u.github_login, u.avatar_url, u.created_at,
            s.plan_id,
            (SELECT count(*)::int FROM projects pr WHERE pr.user_id = u.id) AS project_count
     FROM users u
     LEFT JOIN LATERAL (
       SELECT plan_id FROM subscriptions
       WHERE user_id = u.id AND status='active'
       ORDER BY created_at DESC LIMIT 1
     ) s ON true
     ORDER BY u.created_at DESC`
  );
  res.json({ users: r.rows.map((u) => ({ ...u, is_admin: isAdminLogin(u.github_login) })) });
});

// Admin override of a user's plan (the only path that can change a plan).
router.put('/users/:id/plan', async (req, res) => {
  const id = +req.params.id;
  const planId = req.body && req.body.plan_id;
  const p = await query('SELECT id FROM plans WHERE id=$1', [planId]);
  if (!p.rowCount) return res.status(400).json({ error: 'Unknown plan.' });
  const exists = await query('SELECT 1 FROM users WHERE id=$1', [id]);
  if (!exists.rowCount) return res.status(404).json({ error: 'User not found.' });

  await query(`UPDATE subscriptions SET status='canceled' WHERE user_id=$1 AND status='active'`, [id]);
  await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_end)
     VALUES ($1,$2,'active','monthly', now() + interval '30 days')`,
    [id, planId]
  );
  res.json({ ok: true, plan_id: planId });
});

router.delete('/users/:id', async (req, res) => {
  const id = +req.params.id;
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
  const r = await query('SELECT github_login FROM users WHERE id=$1', [id]);
  if (!r.rowCount) return res.status(404).json({ error: 'User not found.' });
  if (isAdminLogin(r.rows[0].github_login)) return res.status(400).json({ error: 'Cannot delete an admin account.' });
  await query('DELETE FROM users WHERE id=$1', [id]); // projects/subscriptions cascade
  res.json({ ok: true });
});

module.exports = router;
