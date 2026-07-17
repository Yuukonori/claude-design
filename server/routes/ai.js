// AI Helper — tool catalog, per-user token usage, and the model call itself. Mounted at /api/ai.
const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');
const { AI_TOOLS, toolById, DEFAULT_TOOL_ID, AI_EFFORTS, DEFAULT_EFFORT_ID, effortById, costFor } = require('../ai_tools');
const { stageById, composeUser } = require('../ai_prompts');
const ai = require('../ai_provider');
const learning = require('../ai_learning');

// The design-assistance tool catalog + the effort levels. requireAuth so only signed-in users pull it.
router.get('/tools', requireAuth, (req, res) => {
  res.json({ tools: AI_TOOLS, efforts: AI_EFFORTS, defaultEffort: DEFAULT_EFFORT_ID });
});

// A user's usage snapshot: their limit, total tokens used, remaining, and a per-tool breakdown.
async function usageFor(userId) {
  const lim = await query('SELECT ai_token_limit FROM users WHERE id=$1', [userId]);
  const limit = lim.rows[0] ? lim.rows[0].ai_token_limit : 500000;
  const agg = await query(
    `SELECT tool, COALESCE(SUM(tokens),0)::int AS tokens, COUNT(*)::int AS count
     FROM ai_usage WHERE user_id=$1 GROUP BY tool ORDER BY tokens DESC`,
    [userId]
  );
  const used = agg.rows.reduce((a, r) => a + r.tokens, 0);
  return { limit, used, remaining: Math.max(0, limit - used), byTool: agg.rows };
}

router.get('/usage', requireAuth, async (req, res) => {
  res.json(await usageFor(req.user.id));
});

// Check-and-charge: the editor calls this before hitting the webhook. Charges the tool's cost at the
// chosen effort, or returns 402 (recording nothing) when it would exceed the user's limit. Returns the
// inserted row's id so a cancelled/failed call can be refunded (see /refund).
router.post('/usage', requireAuth, async (req, res) => {
  const body = req.body || {};
  const tool = toolById(body.tool);
  if (!tool) return res.status(400).json({ error: 'Unknown tool.' });
  const effort = effortById(body.effort || DEFAULT_EFFORT_ID);
  if (!effort) return res.status(400).json({ error: 'Unknown effort level.' });
  const cost = costFor(tool, effort);

  const cur = await usageFor(req.user.id);
  if (cur.used + cost > cur.limit) {
    return res.status(402).json({ error: 'Token limit reached.', used: cur.used, limit: cur.limit, remaining: cur.remaining });
  }
  const ins = await query(
    'INSERT INTO ai_usage (user_id, tool, tokens, effort) VALUES ($1,$2,$3,$4) RETURNING id',
    [req.user.id, tool.id, cost, effort.id]
  );
  const next = await usageFor(req.user.id);
  res.json({
    ok: true, usage_id: ins.rows[0].id, charged: cost, effort: effort.id,
    used: next.used, limit: next.limit, remaining: next.remaining, byTool: next.byTool,
  });
});

// Undo a charge when the user got nothing back (they cancelled, or the model errored/rate-limited).
// Scoped to the caller's own rows — a user must never be able to refund someone else's usage.
router.post('/refund', requireAuth, async (req, res) => {
  const id = +((req.body || {}).usage_id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'A usage_id is required.' });
  const del = await query('DELETE FROM ai_usage WHERE id=$1 AND user_id=$2 RETURNING id', [id, req.user.id]);
  const next = await usageFor(req.user.id);
  res.json({ ok: true, refunded: del.rowCount > 0, used: next.used, limit: next.limit, remaining: next.remaining, byTool: next.byTool });
});

// --- the model call -----------------------------------------------------------------------------
// Everything the client is allowed to say about HOW the model runs. Anything outside this is either
// server-chosen (model, system prompt, thinking budget) or ignored — see the 400 below.
const MAX_MESSAGE = 8000;
const MAX_STATE = 256000;      // editor_state is the big one; buildAgentContext already caps at 40 nodes
const MAX_HISTORY = 6;         // turns
const MAX_HISTORY_CHARS = 4000;
const CLIENT_MAY_NOT_SET = ['model', 'system', 'generationConfig', 'thinkingLevel', 'maxOutputTokens', 'temperature', 'tools'];

const clip = (v, n) => (v == null ? '' : String(v).slice(0, n));

const MAX_IMAGES = 2;
const MAX_IMAGE_B64 = 2500000;   // ~1.8MB decoded; express.json caps the whole body at 4mb (index.js)
const IMAGE_MIME = { 'image/png': 1, 'image/jpeg': 1, 'image/webp': 1 };
// Validate rather than forward. This base64 comes from a browser and goes straight to a paid upstream:
// a bad mime or a padded megabyte of junk should die here, not become an opaque 400 from the provider.
// Returns only well-formed images; anything malformed is dropped silently (the picture is an
// enhancement to the audit, never the reason a turn fails).
function sanitizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length && out.length < MAX_IMAGES; i++) {
    const im = raw[i];
    if (!im || typeof im !== 'object') continue;
    const mime = String(im.mimeType || '').toLowerCase();
    if (!IMAGE_MIME[mime]) continue;
    // Tolerate a full data: URL as well as bare base64 — the client sends bare, but this is the kind of
    // detail that silently breaks when someone reuses the endpoint.
    let data = String(im.data || '');
    const comma = data.indexOf(',');
    if (data.slice(0, 5) === 'data:' && comma > 0) data = data.slice(comma + 1);
    data = data.replace(/\s/g, '');
    if (!data || data.length > MAX_IMAGE_B64) continue;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) continue;
    out.push({ mimeType: mime, data: data });
  }
  return out;
}

// Every id a set of actions points at, that exists neither on the canvas nor in the same block.
//
// This is the guard for a real, reported failure: the model emits well-formed ids it invented
// ("cmp_lkkeg"), buildAgentPages resolves none of them, and the user gets "those changes referenced
// nodes that aren't on the canvas" having paid for the turn. The prompts forbid it, but a prompt is a
// probability and this is cheap certainty. Only possible now that the model call lives here rather
// than inside n8n.
function ghostTargets(text, editorState) {
  const m = String(text || '').match(/```(?:lattice|json)?\s*([\s\S]*?)```/i);
  if (!m) return [];
  let actions;
  try {
    const o = JSON.parse(m[1].trim());
    actions = Array.isArray(o) ? o : (o && o.actions);
  } catch (e) { return []; }              // unparseable/truncated: the client salvages, not our problem
  if (!Array.isArray(actions)) return [];

  const real = new Set();
  try {
    const st = JSON.parse(editorState);
    (st.nodes || []).forEach(n => n && n.id && real.add(n.id));
    (st.pages || []).forEach(p => p && p.id && real.add(p.id));
    if (st.activePage && st.activePage.id) real.add(st.activePage.id);
  } catch (e) { return []; }              // no state to check against — nothing to assert
  if (!real.size) return [];              // empty canvas: every ref is created in-block by definition

  const created = new Set(actions.map(a => a && a.id).filter(Boolean));
  const out = [];
  actions.forEach(a => {
    if (!a || typeof a !== 'object') return;
    ['target', 'parent', 'from', 'to', 'page'].forEach(k => {
      const v = a[k];
      if (typeof v === 'string' && v && !real.has(v) && !created.has(v)) out.push(v);
    });
  });
  return Array.from(new Set(out));
}

router.post('/chat', requireAuth, async (req, res) => {
  const body = req.body || {};

  // Reject rather than ignore. Silently dropping a client-supplied `model` would hide an attempt to
  // pick an expensive one; a 400 makes it visible. (ai_tools.js documents why this stays server-side.)
  for (let i = 0; i < CLIENT_MAY_NOT_SET.length; i++) {
    if (body[CLIENT_MAY_NOT_SET[i]] !== undefined) {
      return res.status(400).json({ error: 'The ' + CLIENT_MAY_NOT_SET[i] + ' parameter is chosen by the server.' });
    }
  }
  if (!ai.configured()) return res.status(503).json({ error: 'The AI is not configured on this server.' });

  const tool = toolById(body.tool || DEFAULT_TOOL_ID);
  if (!tool) return res.status(400).json({ error: 'Unknown tool.' });
  const effort = effortById(body.effort || DEFAULT_EFFORT_ID);
  if (!effort) return res.status(400).json({ error: 'Unknown effort level.' });
  const stage = body.stage ? stageById(body.stage) : null;
  if (body.stage && !stage) return res.status(400).json({ error: 'Unknown stage.' });

  // Charging (POST /usage) and generating are separate calls the client makes in sequence, so nothing
  // stops a signed-in user calling /chat directly and never charging themselves — on our key. This is
  // a coarse gate, not per-stage accounting: it bounds abuse to the user's existing token limit.
  const cur = await usageFor(req.user.id);
  if (cur.remaining <= 0) {
    return res.status(402).json({ error: 'Token limit reached.', used: cur.used, limit: cur.limit, remaining: 0 });
  }

  const editorState = clip(body.editor_state, MAX_STATE);
  const payload = {
    message: clip(body.message, MAX_MESSAGE),
    editor_state: editorState,
    audit: clip(body.audit, MAX_STATE),
    style: clip(body.style, MAX_MESSAGE),
    analysis: clip(body.analysis, MAX_STATE),
    spec: clip(body.spec, MAX_STATE),
    prev_spec: clip(body.prev_spec, MAX_STATE),
    critique: clip(body.critique, MAX_MESSAGE),
    // What this stage has been caught getting wrong before. Server-owned: the client never supplies it,
    // or a crafted request could put words in the model's mouth. Degrades to '' with no DB.
    lessons: stage ? await learning.blockFor(body.stage) : '',
  };

  // A stage runs the agent pipeline; no stage means a one-shot tool, whose framing is the tool's own
  // prompt from the catalog. That framing is the SYSTEM instruction now — under n8n the client pasted
  // it onto the front of the user's message, which put our words in the user's mouth.
  const system = stage ? stage.system : String(tool.prompt || '').replace(/\s*Request:\s*$/, '').trim();
  const composed = stage ? composeUser(body.stage, payload) : payload.message;
  if (!composed.trim()) return res.status(400).json({ error: 'A message is required.' });

  // History only where the stage asks for it. audit must stay a pure function of editor_state — the
  // client caches it against a hash of the canvas, so a history-dependent audit would poison that cache.
  const contents = [];
  if ((!stage || stage.useHistory) && Array.isArray(body.history)) {
    body.history.slice(-MAX_HISTORY).forEach(h => {
      if (!h || !h.text) return;
      contents.push({ role: (h.role === 'model' || h.role === 'assistant') ? 'model' : 'user', text: clip(h.text, MAX_HISTORY_CHARS) });
    });
  }
  // A picture of the canvas rides with the LAST user turn. Gated on the stage declaring `images: true`
  // so a client can't attach one to every stage and quietly multiply our bill; a provider that can't
  // see drops them lower down. Validated, not trusted: this is base64 arriving from a browser.
  const images = (stage && stage.images) ? sanitizeImages(body.images) : [];
  contents.push({ role: 'user', text: composed, images: images.length ? images : undefined });

  // The user hitting Stop closes the request; carry that through so the upstream call is actually
  // cancelled instead of being left to run and bill us for a reply nobody will read.
  const ctrl = new AbortController();
  req.on('close', () => { if (!res.writableEnded) ctrl.abort(); });

  const opts = {
    effort: effort.id, system: system, contents: contents, signal: ctrl.signal,
    maxOutputTokens: stage ? stage.maxOutputTokens : 4096,
    thinkingLevel: stage ? stage.thinkingLevel : 'low',
    temperature: stage ? stage.temperature : 0.5,
    search: stage ? !!stage.search : false,
  };

  try {
    let r = await ai.generate(opts);

    // Auto-capture, from what this server ALREADY knows went wrong — no extra model call, no judge.
    // Fire-and-forget: a learning write must never delay or fail the reply the user is waiting on.
    if (r.truncated) learning.record([{ type: 'truncated' }]).catch(() => {});

    if (body.stage === 'implement' && editorState) {
      const ghosts = ghostTargets(r.text, editorState);
      if (ghosts.length) {
        learning.record([{ type: 'ghostId' }]).catch(() => {});
        // One corrective re-ask, naming the offenders. One only: if it invents ids twice the request
        // is genuinely ambiguous, and the client's own refund-and-report path is the right answer.
        console.warn('[ai] implement invented ids (' + ghosts.slice(0, 3).join(', ') + ') — re-asking once');
        const fixed = contents.slice();
        fixed[fixed.length - 1] = { role: 'user', text: composed +
          '\n\n## CORRECTION\nYour previous attempt targeted ids that do not exist on this canvas: ' +
          ghosts.slice(0, 8).join(', ') +
          '\nUse ONLY ids listed in the CANVAS section above, or refs you create in this same block. ' +
          'If nothing on the canvas matches, say so in prose and emit no action for it.' };
        r = await ai.generate(Object.assign({}, opts, { contents: fixed }));
      }
    }

    // { output } is what the editor's aihExtractReply already reads, so no client parsing changes.
    res.json({ output: r.text, provider: r.provider, model: r.model, truncated: !!r.truncated });
  } catch (e) {
    const status = e && e.status ? e.status : 502;
    if (status !== 504) console.error('[ai] /chat ' + status + ' — ' + (e && e.message));
    res.status(status).json({ error: (e && e.message) || 'The AI request failed.' });
  }
});

// Report a mistake the CLIENT detected. Some failures are only knowable after the executor runs the
// batch against the real canvas — an op with no handler (`unknownOps`), a target that resolved to
// nothing — so the browser is the only place that sees them.
//
// The client sends a SIGNAL ({type, detail}), never a lesson: the wording is chosen server-side from a
// fixed catalog (ai_learning.lessonFor). Otherwise this endpoint would let any signed-in user write
// arbitrary text straight into every other user's prompts — a global prompt-injection hole.
router.post('/learn', requireAuth, async (req, res) => {
  const body = req.body || {};
  const raw = Array.isArray(body.signals) ? body.signals.slice(0, 10) : [];
  const signals = raw
    .filter(s => s && typeof s === 'object')
    .map(s => ({ type: clip(s.type, 40), detail: clip(s.detail, 80) }));
  const out = await learning.record(signals);
  res.json(out);
});

// What the agent has learned: the curated seed, plus every runtime lesson and whether it has cleared
// the evidence gate yet. Read-only introspection — this is the "is it actually learning?" answer.
router.get('/lessons', requireAuth, async (req, res) => {
  res.json(await learning.all());
});

module.exports = router;
// Exported for tests: sanitizeImages is the boundary between browser-supplied base64 and a paid
// upstream, so it is worth exercising directly rather than through a live request.
module.exports.sanitizeImages = sanitizeImages;
