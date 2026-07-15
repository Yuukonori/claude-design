const crypto = require('crypto');
const router = require('express').Router();
const { query } = require('../db');
const { setSession, clearSession, requireAuth, isAdminLogin } = require('../auth');

const GH_ID = process.env.GITHUB_CLIENT_ID;
const GH_SECRET = process.env.GITHUB_CLIENT_SECRET;
const STATE_COOKIE = 'lattice_oauth_state';

// Base URL for building the OAuth callback + post-login redirect. APP_URL wins (must match the
// callback registered on the GitHub OAuth App); otherwise derive from the (proxied) request.
function appBase(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}`;
}
const callbackUrl = (req) => appBase(req) + '/api/auth/github/callback';
const appHome = (req) => appBase(req) + '/ui_kits/lattice-app/';

// --- Step 1: send the user to GitHub ---
router.get('/github', (req, res) => {
  if (!GH_ID || !GH_SECRET) return res.status(500).send('GitHub sign-in is not configured on this server.');
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, { httpOnly: true, sameSite: 'lax', secure: appBase(req).startsWith('https'), maxAge: 10 * 60 * 1000, path: '/' });
  const params = new URLSearchParams({
    client_id: GH_ID,
    redirect_uri: callbackUrl(req),
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  });
  res.redirect('https://github.com/login/oauth/authorize?' + params.toString());
});

// --- Step 2: GitHub redirects back here ---
router.get('/github/callback', async (req, res) => {
  const fail = (msg) => res.redirect(appHome(req) + '#/login?error=' + encodeURIComponent(msg));
  try {
    const { code, state } = req.query;
    const saved = req.cookies && req.cookies[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { path: '/' });
    if (!code || !state || !saved || state !== saved) return fail('Sign-in was interrupted. Please try again.');

    // Exchange the code for an access token.
    const tokRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: GH_ID, client_secret: GH_SECRET, code, redirect_uri: callbackUrl(req) }),
    });
    const tok = await tokRes.json();
    if (!tok || !tok.access_token) return fail('GitHub did not grant access.');

    const gh = (path) => fetch('https://api.github.com' + path, {
      headers: { Authorization: 'Bearer ' + tok.access_token, Accept: 'application/vnd.github+json', 'User-Agent': 'lattice-app' },
    }).then((r) => r.json());

    const profile = await gh('/user');
    if (!profile || !profile.id) return fail('Could not read your GitHub profile.');

    let email = profile.email;
    if (!email) {
      const emails = await gh('/user/emails');
      if (Array.isArray(emails)) {
        const pick = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
        email = pick && pick.email;
      }
    }
    const name = profile.name || profile.login;

    // Upsert by github_id. New accounts get a Free plan (self-serve plan changes are disabled).
    const existing = await query('SELECT id FROM users WHERE github_id=$1', [profile.id]);
    let user;
    if (existing.rowCount) {
      const u = await query(
        `UPDATE users SET name=$1, email=$2, github_login=$3, avatar_url=$4 WHERE github_id=$5
         RETURNING id, name, email`,
        [name, email || null, profile.login, profile.avatar_url || null, profile.id]
      );
      user = u.rows[0];
    } else {
      const u = await query(
        `INSERT INTO users (name, email, github_id, github_login, avatar_url) VALUES ($1,$2,$3,$4,$5)
         RETURNING id, name, email`,
        [name, email || null, profile.id, profile.login, profile.avatar_url || null]
      );
      user = u.rows[0];
      await query(
        `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_end)
         VALUES ($1,'free','active','monthly', now() + interval '30 days')`,
        [user.id]
      );
    }
    setSession(res, user);
    res.redirect(appHome(req) + '#/projects');
  } catch (e) {
    console.error('[oauth]', e.message);
    fail('Something went wrong signing in.');
  }
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const r = await query('SELECT id, name, email, github_login, avatar_url, created_at FROM users WHERE id=$1', [req.user.id]);
  if (!r.rowCount) return res.status(401).json({ error: 'Not authenticated.' });
  const u = r.rows[0];
  res.json({ user: { ...u, is_admin: isAdminLogin(u.github_login) } });
});

module.exports = router;
