const router = require('express').Router();

// POST /api/proxy — server-side fetch so the Workflow "API request" node can hit real endpoints
// from Preview without tripping browser CORS. Body: { url, method?, headers?, body? }.
// Returns { status, ok, headers, body } where body is parsed JSON when possible, else raw text.
// Intentionally unauthenticated (Preview runs standalone too); guarded against SSRF to local hosts.

const BLOCKED_HOST = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|::1|\[::1\])|^172\.(1[6-9]|2\d|3[01])\./i;

router.post('/', async (req, res) => {
  const { url, method = 'GET', headers = {}, body } = req.body || {};
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'A valid http(s) url is required.' });
  }
  let host;
  try { host = new URL(url).hostname; } catch { return res.status(400).json({ error: 'Malformed url.' }); }
  if (BLOCKED_HOST.test(host)) return res.status(403).json({ error: 'Requests to local/private hosts are blocked.' });

  const m = String(method).toUpperCase();
  const hdrs = {};
  if (headers && typeof headers === 'object') for (const k in headers) hdrs[k] = String(headers[k]);
  let payload;
  if (body != null && m !== 'GET' && m !== 'HEAD') {
    if (typeof body === 'string') { payload = body; }
    else { payload = JSON.stringify(body); if (!Object.keys(hdrs).some(k => k.toLowerCase() === 'content-type')) hdrs['Content-Type'] = 'application/json'; }
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { method: m, headers: hdrs, body: payload, redirect: 'follow', signal: ctrl.signal });
    clearTimeout(timer);
    const text = await r.text();
    let parsed = text;
    try { parsed = JSON.parse(text); } catch {}
    const outHeaders = {};
    r.headers.forEach((v, k) => { outHeaders[k] = v; });
    res.json({ status: r.status, ok: r.ok, headers: outHeaders, body: parsed });
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed: ' + (e.name === 'AbortError' ? 'timed out' : e.message), status: 0, ok: false, body: null });
  }
});

module.exports = router;
