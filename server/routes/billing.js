// Plans (public), subscription, and invoices — mounted at /api
const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

router.get('/plans', async (req, res) => {
  const r = await query('SELECT id, name, price_monthly, price_annual, tagline, features FROM plans ORDER BY price_monthly ASC');
  res.json({ plans: r.rows });
});

router.get('/subscription', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT s.id, s.plan_id, s.status, s.billing_cycle, s.current_period_end,
            p.name, p.price_monthly, p.price_annual
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id=$1 AND s.status='active'
     ORDER BY s.created_at DESC LIMIT 1`,
    [req.user.id]
  );
  res.json({ subscription: r.rows[0] || null });
});

// Self-serve plan changes are disabled — plans are view-only and every account is on Free.
// (An admin can override a user's plan via /api/admin/users/:id/plan.)
router.post('/subscription', requireAuth, (req, res) => {
  res.status(403).json({ error: 'Plan changes are disabled. Every account is on the Free plan.' });
});

router.get('/invoices', requireAuth, async (req, res) => {
  const r = await query(
    `SELECT i.id, i.plan_id, i.amount, i.period, i.status, i.created_at, p.name AS plan_name
     FROM invoices i LEFT JOIN plans p ON p.id = i.plan_id
     WHERE i.user_id=$1 ORDER BY i.created_at DESC`,
    [req.user.id]
  );
  res.json({ invoices: r.rows });
});

module.exports = router;
