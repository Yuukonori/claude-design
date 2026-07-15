const jwt = require('jsonwebtoken');
const { query } = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-lattice-secret';
const COOKIE = 'lattice_session';
const MAX_AGE = 7 * 24 * 3600 * 1000; // 7 days
const ADMIN_LOGIN = process.env.ADMIN_GITHUB_LOGIN || 'Yuukonori';
const SECURE = (process.env.APP_URL || '').startsWith('https');

const signToken = (user) => jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
const isAdminLogin = (login) => !!login && login.toLowerCase() === ADMIN_LOGIN.toLowerCase();

function setSession(res, user) {
  res.cookie(COOKIE, signToken(user), { httpOnly: true, sameSite: 'lax', secure: SECURE, maxAge: MAX_AGE, path: '/' });
}
function clearSession(res) { res.clearCookie(COOKIE, { path: '/' }); }

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

// requireAuth + confirm the account's GitHub login is the configured admin.
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    query('SELECT github_login FROM users WHERE id=$1', [req.user.id])
      .then((r) => {
        const login = r.rows[0] && r.rows[0].github_login;
        if (!isAdminLogin(login)) return res.status(403).json({ error: 'Admin access required.' });
        next();
      })
      .catch(next);
  });
}

module.exports = { signToken, setSession, clearSession, requireAuth, requireAdmin, isAdminLogin, COOKIE };
