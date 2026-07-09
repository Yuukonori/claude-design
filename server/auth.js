const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-lattice-secret';
const COOKIE = 'lattice_session';
const MAX_AGE = 7 * 24 * 3600 * 1000; // 7 days

const hashPassword = (pw) => bcrypt.hash(pw, 10);
const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);
const signToken = (user) => jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });

function setSession(res, user) {
  res.cookie(COOKIE, signToken(user), { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/' });
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

module.exports = { hashPassword, verifyPassword, signToken, setSession, clearSession, requireAuth, COOKIE };
