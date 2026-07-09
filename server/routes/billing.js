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

router.post('/subscription', requireAuth, async (req, res) => {
  const planId = req.body?.plan_id;
  const cycle = req.body?.billing_cycle === 'annual' ? 'annual' : 'monthly';
  const p = await query('SELECT id, name, price_monthly, price_annual FROM plans WHERE id=$1', [planId]);
  if (!p.rowCount) return res.status(400).json({ error: 'Unknown plan.' });
  const plan = p.rows[0];

  await query(`UPDATE subscriptions SET status='canceled' WHERE user_id=$1 AND status='active'`, [req.user.id]);
  const interval = cycle === 'annual' ? "interval '1 year'" : "interval '30 days'";
  const s = await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_end)
     VALUES ($1,$2,'active',$3, now() + ${interval})
     RETURNING id, plan_id, status, billing_cycle, current_period_end`,
    [req.user.id, planId, cycle]
  );

  const amount = cycle === 'annual' ? plan.price_annual : plan.price_monthly;
  if (amount > 0) {
    await query(
      `INSERT INTO invoices (user_id, plan_id, amount, period, status) VALUES ($1,$2,$3,$4,'paid')`,
      [req.user.id, planId, amount, cycle]
    );
  }
  res.json({ subscription: { ...s.rows[0], name: plan.name } });
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
