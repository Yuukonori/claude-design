const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');
const { initSchema } = require('./db');

const app = express();
app.set('trust proxy', true); // behind Render's TLS proxy: honor x-forwarded-proto for OAuth redirects
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

// --- API ---
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/library', require('./routes/library'));
app.use('/api', require('./routes/billing')); // /api/plans, /api/subscription, /api/invoices
app.use('/api/team', require('./routes/team'));
app.use('/api/account', require('./routes/account'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/proxy', require('./routes/proxy'));

// Unknown API route -> JSON 404 (before static, so /api/* never serves files)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// API error handler
app.use('/api', (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[api error]', err.message);
  res.status(500).json({ error: 'Server error.' });
});

// --- Static (serve the whole repo: styles.css, _ds_bundle.js, ui_kits/**, assets/**) ---
const ROOT = path.join(__dirname, '..');
const DEV = process.env.NODE_ENV !== 'production';
app.get('/', (req, res) => res.redirect('/ui_kits/lattice-app/'));
app.use(express.static(ROOT, {
  extensions: ['html'],
  // In local dev the editor loads ~25 in-browser-transpiled source files (no build step). Browsers
  // cache them aggressively, so after an edit you can end up running a stale App.jsx alongside fresh
  // siblings — the editor then "breaks after an update" until a hard refresh. Disable caching for
  // source files in dev so a plain reload always runs the latest code. Production (Render) is untouched.
  setHeaders: (res, filePath) => {
    if (DEV && /\.(jsx|js|mjs|html|css)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }
  },
}));

const PORT = +(process.env.PORT || 5050);
initSchema()
  .then(() => app.listen(PORT, () => {
    console.log(`Lattice server running → http://localhost:${PORT}/`);
    console.log(`  App:    http://localhost:${PORT}/ui_kits/lattice-app/`);
    console.log(`  Editor: http://localhost:${PORT}/ui_kits/lattice/`);
  }))
  .catch((e) => { console.error('Schema init failed:', e.message); process.exit(1); });
