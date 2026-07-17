/* global React */
// AI Helper — a floating design-assistance panel for the editor (Plan Pro feature). The user picks a
// tool, an effort level and a mode, types a message, and we POST it to our own /api/ai/chat. The
// Design Agent's reply carries a ```lattice action block which is parsed and applied to the canvas.
//
// Effort (low/medium/high) is the token lever: it scales how much editor state we ship, which model
// the server picks (server/geminis.js and server/groq.js each map effort -> model; the client never
// names a model, and /api/ai/chat 400s if it tries), and what the call costs.
//
// No-build file: registered as a <script> in index.html BEFORE App.jsx. All private helpers/styles
// are prefixed `aih`/`AIH` to avoid the shared-global-scope name collisions this codebase is prone to.
// No object-rest destructuring anywhere (PreviewCanvas.jsx is the sole `_excluded` emitter).

// The Design Agent runs as a pipeline of stages, each its own round-trip to /api/ai/chat with a
// `stage` field. Splitting reasoning from JSON emission is the point: AUDIT states what's on the
// canvas, ANALYZE works out what the user wants, RESEARCH fixes the palette, PREPARE does the layout
// arithmetic, CRITIQUE reviews it, and IMPLEMENT only transcribes the spec into actions — so no single
// model has to think and format at once (that combination is what produced the overlapping,
// default-sized output this panel started with).
//
// The server owns the stage prompts (server/prompts/*.txt), the effort->model map, and provider
// fallback across Gemini and Groq key pools. This panel only says WHICH stage it wants.
const AIH_STAGE_IMPLEMENT = 'implement';   // also: all non-agent tools (they send no stage at all)
const AIH_STAGE_ANALYZE = 'analyze';       // request-analysis stage
const AIH_STAGE_PREPARE = 'prepare';       // planning / calculation stage
const AIH_STAGE_AUDIT = 'audit';           // canvas-audit stage
const AIH_STAGE_RESEARCH = 'research';     // style-research stage (Google Search grounding, when quota allows)
const AIH_STAGE_CRITIQUE = 'critique';     // design-critic stage (reviews the spec before it is built)
// Reviewing is a far easier task than generating, so one critic pass reliably catches what the
// planner misses (measured on a shop build: 6 kinds/1 image -> 11 kinds/4 images).
//
// How many passes is now the EFFORT's call (server/ai_tools.js AI_EFFORTS[].rounds): Low skips review,
// Medium/High take one, Max two, Extreme keeps going until the critic approves. The old hard cap of 1
// was set because a second pass measurably regressed a spec on Groq llama under n8n (11 kinds/4 images
// -> 9/2): the critic invents faults and the reviser deletes real content to satisfy them.
//
// That failure is now guarded structurally rather than by refusing to loop — a revision is only
// accepted if it keeps at least as many nodes as it replaced (see the specNodeCount check below), so a
// destructive round is discarded and the loop stops. The cap remains as a backstop against a critic
// that never approves.
const AIH_MAX_CRITIQUE_ROUNDS = 6;
const AIH_API = '/api/ai';
const AIH_MAX_HISTORY_TURNS = 6;   // prior turns shipped as chat memory; the server ignores them per-stage
const AIH_MAX_CHATS = 30;        // localStorage keeps the 30 most recent conversations per project
const AIH_MAX_MSGS = 100;        // …and at most this many messages per conversation
const AIH_MAX_MSG_CHARS = 4000;  // …with each stored message clipped, to stay well under the ~5MB quota

// Fallback catalogs — mirror server/ai_tools.js. Used when the editor is served without the backend
// (e.g. `npm run static`), so tools still render and chat still works (unenforced).
const AIH_TOOLS_FALLBACK = [
  // The agent's role + action protocol live server-side (server/prompts/*.txt), composed fresh with
  // editor_state each turn — so no client-side prompt framing is needed here.
  { id: 'agent', name: 'Design Agent', icon: 'wand-sparkles', cost: 12000, mode: 'agent', description: 'Builds & edits on your canvas', prompt: '' },
  { id: 'layout', name: 'Layout Assistant', icon: 'layout-template', cost: 8000, description: 'Structure pages, sections & grids', prompt: 'You are a senior UI layout designer. Propose a concrete, well-structured layout (sections, visual hierarchy, spacing and grid/columns) for the request below. Be specific and practical.\n\nRequest: ' },
  { id: 'color', name: 'Color Palette', icon: 'palette', cost: 6000, description: 'Generate & refine color schemes', prompt: 'You are a senior product designer specializing in color. Suggest a cohesive, accessible color palette with hex values and where each color should be used.\n\nRequest: ' },
  { id: 'copy', name: 'Copywriting', icon: 'pen-line', cost: 5000, description: 'Headlines, microcopy & CTAs', prompt: 'You are a UX writer. Write clear, on-brand copy (headlines, subheads, button labels, microcopy) for the request below.\n\nRequest: ' },
  { id: 'component', name: 'Component Advisor', icon: 'blocks', cost: 5000, description: 'Recommend components & patterns', prompt: 'You are a design-systems expert. Recommend the right UI components and interaction patterns for the request below, and note trade-offs.\n\nRequest: ' },
  { id: 'a11y', name: 'Accessibility Check', icon: 'accessibility', cost: 7000, description: 'Review for a11y issues', prompt: 'You are an accessibility (WCAG) specialist. Review the request below for accessibility issues and give concrete, prioritized fixes.\n\nRequest: ' },
  { id: 'responsive', name: 'Responsive Advisor', icon: 'smartphone', cost: 6000, description: 'Breakpoints & adaptive layout', prompt: 'You are a responsive-design expert. Advise how the request below should adapt across desktop, tablet and mobile.\n\nRequest: ' },
  { id: 'motion', name: 'Animation Ideas', icon: 'sparkles', cost: 5000, description: 'Motion & interaction suggestions', prompt: 'You are a motion designer. Suggest tasteful animation and micro-interaction ideas for the request below — triggers, easing, duration and purpose.\n\nRequest: ' },
  { id: 'critique', name: 'Design Critique', icon: 'search-check', cost: 9000, description: 'Structured feedback on a design', prompt: 'You are a design critique partner. Give structured, actionable feedback on the design described below — what works, what to improve, and next steps.\n\nRequest: ' },
  { id: 'chat', name: 'General Chat', icon: 'message-circle', cost: 3000, description: 'Ask anything about your design', prompt: '' },
];
const AIH_EFFORTS_FALLBACK = [
  { id: 'low', name: 'Low', scope: 'low', mult: 0.5, rounds: 0, description: 'Selection only · no review · fastest & cheapest' },
  { id: 'medium', name: 'Medium', scope: 'medium', mult: 1, rounds: 1, description: 'Current page · one review pass · balanced' },
  { id: 'high', name: 'High', scope: 'high', mult: 1.75, rounds: 1, description: 'Page + variables & workflows · one review pass' },
  { id: 'max', name: 'Max', scope: 'high', mult: 3, rounds: 2, description: 'Two review passes · slower, more polished' },
  { id: 'extreme', name: 'Extreme', scope: 'high', mult: 5, rounds: 4, description: 'Reviews until the critic approves · slowest, best result' },
];
const AIH_DEFAULT_TOOL = 'agent';
const AIH_DEFAULT_EFFORT = 'medium';

// Plan mode asks for steps and nothing else. Kept short deliberately: it rides in the user message
// (and therefore the chat history), unlike the protocol which is the server-side system prompt.
const AIH_PLAN_DIRECTIVE = '\n\n(Respond with a short numbered plan only. Do NOT emit a lattice block.)';
const AIH_IMPLEMENT_MSG = 'Implement the plan you just described.';

// Extract an agent action list from a model reply. Prefers a fenced ```lattice/```json block, else the
// first balanced {...} that parses. Returns an array of actions or null.
function aihParseActions(text) {
  if (!text) return null;
  let raw = null;
  const m = text.match(/```(?:lattice|json)?\s*([\s\S]*?)```/i);
  if (m) raw = m[1];
  else { const i = text.indexOf('{'); const j = text.lastIndexOf('}'); if (i >= 0 && j > i) raw = text.slice(i, j + 1); }
  if (raw) {
    try {
      const obj = JSON.parse(raw.trim());
      const actions = Array.isArray(obj) ? obj : (obj && Array.isArray(obj.actions) ? obj.actions : null);
      if (actions && actions.length) return actions;
    } catch (e) { /* fall through to salvage */ }
  }
  // Salvage a TRUNCATED reply: a big styled page can exceed the model's output limit, leaving an
  // unterminated ```lattice block that JSON.parse rejects wholesale — so nothing built. Instead pull
  // out every COMPLETE {…} action object and keep those, dropping only the final half-written one.
  // Turns "0 nodes" into "26 of 29 nodes" — a page instead of a blank canvas.
  return aihSalvageActions(text);
}
// Brace-match complete top-level objects inside the actions array, string-aware, tolerant of a missing
// closing bracket/fence. Returns the objects that parsed, or null.
function aihSalvageActions(text) {
  const keyAt = text.search(/"actions"\s*:\s*\[/);
  let i = keyAt >= 0 ? text.indexOf('[', keyAt) + 1 : text.indexOf('[');
  if (i < 1) return null;
  const objs = [];
  while (i < text.length) {
    while (i < text.length && text[i] !== '{' && text[i] !== ']') i++;
    if (i >= text.length || text[i] === ']') break;
    let depth = 0, inStr = false, esc = false, end = -1, j = i;
    for (; j < text.length; j++) {
      const c = text[j];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
      else if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end < 0) break;                       // truncated mid-object — keep everything before it
    try { objs.push(JSON.parse(text.slice(i, end + 1))); } catch (e) {}
    i = end + 1;
  }
  return objs.length ? objs : null;
}
// The audit's first line is written for the user ("I can see 2 frames and a heading, all on a dark
// navy palette") — the rest of it is a data dump for the later stages. Split them so the panel can say
// what it noticed out loud instead of the whole turn looking like a silent spinner.
function aihObservation(audit) {
  const first = String(audit || '').trim().split('\n')[0].trim();
  if (!first || first.length > 220) return '';
  return /^i can see/i.test(first) ? first : '';
}

// The human-readable prose with any fenced action block removed.
function aihStripActions(text) {
  return (text || '').replace(/```(?:lattice|json)?\s*[\s\S]*?```/i, '').trim();
}
// Make sure the agent tool keeps its mode flag whatever the server catalog says — `mode` is what
// switches the client into "send editor_state + parse/apply actions" behaviour.
function aihNormalizeTools(list) {
  return (list || []).map(t => t.id === 'agent' ? { ...t, mode: 'agent' } : t);
}
// What a tool costs at a given effort (mirrors server ai_tools.costFor).
function aihCostFor(tool, effort) {
  if (!tool) return 0;
  return Math.round(tool.cost * (effort ? effort.mult : 1));
}

// The critic is told to answer exactly "APPROVED" when the spec passes; anything else is a fault list.
function aihIsApproved(text) {
  return /^\s*APPROVED\b/i.test(text || '');
}

// Count the node lines in a spec's TREE (any line that begins with a component kind). Used as a hard
// guard: the critique loop is only allowed to make a spec RICHER. On this model the critic keeps
// finding ways to delete content ("hero is out of scope") and a revision has gutted a good page more
// than once — so a revision with fewer nodes than the original is discarded, no matter what it claims.
const AIH_SPEC_KIND_RE = /^\s*(?:frame|stack|grid|card|heading|text|button|input|select|switch|checkbox|image|icon|avatar|badge|link|list|divider|chart|alert|table|stat|tabs|slider|progress|rect|ellipse)\b/i;
function aihSpecNodeCount(spec) {
  return (spec || '').split('\n').filter(l => AIH_SPEC_KIND_RE.test(l)).length;
}

// Read the SCOPE the analyze stage reports, so we only pay for the stages a request actually needs:
// deleting a button needs no style research and no layout arithmetic. Tolerant of "SCOPE — edit of
// existing nodes" as well as "SCOPE: edit". Unknown falls back to the full pipeline (safe, not cheap).
function aihScopeOf(text) {
  const m = /SCOPE\s*[:—\-]*\s*([^\n]*)/i.exec(text || '');
  const v = (m ? m[1] : '').toLowerCase();
  if (/question|ask|explain/.test(v)) return 'question';
  if (/edit|modif|updat|delet|remov|rename|recolour|recolor|adjust|tweak|restyle/.test(v)) return 'edit';
  return 'build';
}

// Cheap stable hash (djb2) of the serialized canvas — the audit is a pure function of editor_state,
// so an unchanged canvas can reuse the previous audit instead of paying for the call again. This is
// what keeps Plan -> Implement (canvas untouched between them) from auditing twice.
function aihHash(s) {
  let h = 5381;
  for (let i = 0; i < (s || '').length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
}

// A unique id per message — sent as message_id so the workflow can key its stored history.
function aihNewId() {
  try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (e) {}
  return 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Compact token count: 500000 → "500K", 5500 → "5.5K", 0 → "0".
function aihFmtTokens(n) {
  n = Math.max(0, Math.round(n || 0));
  if (n >= 1000) { const k = n / 1000; return (k >= 100 || k % 1 === 0 ? Math.round(k) : Math.round(k * 10) / 10) + 'K'; }
  return String(n);
}
function aihRelTime(ts) {
  const s = Math.max(0, Math.round((Date.now() - (ts || 0)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

// --- history (localStorage, per project) --------------------------------------------------------
function aihProjectKey() {
  try { return new URLSearchParams(window.location.search).get('project') || 'standalone'; } catch (e) { return 'standalone'; }
}
function aihLoadChats() {
  try {
    const a = JSON.parse(localStorage.getItem('lattice_ai_chats_' + aihProjectKey()) || '[]');
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function aihSaveChats(list) {
  // Chat text is small, but the origin quota is shared with everything else this editor stores —
  // cap conversations, messages and per-message length rather than risk a QuotaExceededError.
  try { localStorage.setItem('lattice_ai_chats_' + aihProjectKey(), JSON.stringify(list.slice(0, AIH_MAX_CHATS))); } catch (e) {}
}
function aihTrimMessages(msgs) {
  // `trace` bubbles are ephemeral pipeline diagnostics — don't persist them (and dropping them keeps
  // a restored chat from rendering an empty trace with no steps).
  return msgs.slice(-AIH_MAX_MSGS).filter(m => m.role !== 'trace').map(m => {
    const o = { id: m.id, role: m.role, text: (m.text || '').slice(0, AIH_MAX_MSG_CHARS) };
    if (m.cost) o.cost = m.cost;
    if (m.plan) o.plan = m.plan;
    return o; // actionsRaw is deliberately not persisted — it can be large and is only useful live
  });
}
function aihChatTitle(msgs) {
  const first = msgs.find(m => m.role === 'user');
  const t = (first && first.text ? first.text : 'New chat').replace(/\s+/g, ' ').trim();
  return t.length > 40 ? t.slice(0, 40) + '…' : t;
}

// --- network ------------------------------------------------------------------------------------
// Pull the assistant's text out of the response body. /api/ai/chat returns { output }, but the other
// shapes are still accepted: they cost nothing and keep this tolerant of a body we didn't author.
function aihExtractReply(body) {
  let obj = body;
  if (Array.isArray(body)) obj = body[0];
  if (obj && typeof obj === 'object') {
    if (typeof obj.output === 'string' && obj.output.trim()) return { text: obj.output };
    if (typeof obj.reply === 'string' && obj.reply.trim()) return { text: obj.reply };
    if (typeof obj.text === 'string' && obj.text.trim()) return { text: obj.text };
    const err = obj.error || obj.message;
    if (err) return { error: aihFriendlyError(typeof err === 'string' ? err : JSON.stringify(err)) };
  }
  if (typeof body === 'string' && body.trim()) return { text: body };
  // The server classifies an empty completion itself and returns a non-2xx with a real reason, so
  // reaching here means a 200 with nothing usable in it — rare, and worth a plain retry.
  return { error: 'The AI returned an empty reply. Wait a moment, then Retry — dropping Effort to Medium or Low also helps.' };
}

// Turn the server's error sentence into something a designer can act on. The common one is a
// tokens-per-minute cap: the request is simply bigger than the provider's per-minute budget, which is
// why server/groq.js and server/geminis.js keep the words "rate limit"/"too large" in those messages.
function aihFriendlyError(msg) {
  const m = String(msg);
  if (/too large|tokens per minute|TPM|rate.?limit|429/i.test(m)) {
    return 'The request was too big for the AI model\'s rate limit. Try again in a moment, or drop Effort to Low so less of the page is sent. (Upstream: ' + m.slice(0, 140) + ')';
  }
  return 'The AI workflow reported an error (' + m.slice(0, 200) + ').';
}

// POST the turn to our own /api/ai/chat. Same-origin and requireAuth, so credentials must ride along.
// `stage` selects the pipeline step (the server holds that stage's prompt, model and thinking budget);
// omitting it means a one-shot tool, framed server-side from the tool catalog. `signal` lets the user
// cancel an in-flight call — the server threads that abort through to the model provider.
async function aihAsk(opts) {
  const payload = {
    message: opts.message, stage: opts.stage || undefined,
    tool: opts.toolId || AIH_DEFAULT_TOOL, effort: opts.effortId || AIH_DEFAULT_EFFORT,
    mode: opts.mode || 'build', editor_state: opts.editorState || '',
    history: opts.history || undefined,
    // stage hand-offs (see the pipeline above): audit -> {style, analysis} -> spec -> critique -> spec'
    audit: opts.audit || '', style: opts.style || '', analysis: opts.analysis || '', spec: opts.spec || '',
    critique: opts.critique || '', prev_spec: opts.prevSpec || '',
    // [{ mimeType, data }] with `data` as raw base64 (no data: prefix). Only the audit stage sends one;
    // the server drops them for a stage that doesn't accept images or a provider that can't see.
    images: (opts.images && opts.images.length) ? opts.images : undefined,
    // Vestigial: chat memory is no longer keyed server-side (history rides in `history` instead), but
    // they cost nothing to send and identify a turn in the server log.
    message_id: opts.messageId, session_id: opts.sessionId,
  };
  try {
    const r = await fetch(AIH_API + '/chat', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: opts.signal,
    });
    const raw = await r.text();
    let data = raw;
    try { data = JSON.parse(raw); } catch (e) {}
    if (!r.ok) {
      // Surface the server's own sentence (it already says "rate limit" / "too large" where that's the
      // truth) so aihFriendlyError can turn it into advice. Passing a bare "HTTP 429" here instead
      // would never match that regex, and the user would get a generic error for a fixable problem.
      const em = (data && typeof data === 'object' && data.error) ? data.error : ('HTTP ' + r.status);
      return { error: aihFriendlyError(em) };
    }
    return aihExtractReply(data);
  } catch (e) {
    if (e && e.name === 'AbortError') return { aborted: true };
    return { error: 'Could not reach the AI assistant. Check your connection and try again.' };
  }
}

// The last few turns, as chat memory for the stages that want it. Called before the current message is
// pushed, so it naturally yields only PRIOR turns. Drops trace/action/note/error bubbles — they're UI
// artefacts, not conversation.
function aihRecentTurns(msgs, n) {
  return (msgs || [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.text)
    .slice(-n)
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', text: String(m.text).slice(0, AIH_MAX_MSG_CHARS) }));
}

// Load the server catalog (tools + effort levels); null when unavailable.
async function aihFetchCatalog() {
  try {
    const r = await fetch(AIH_API + '/tools', { credentials: 'include' });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || !Array.isArray(d.tools) || !d.tools.length) return null;
    return { tools: d.tools, efforts: (Array.isArray(d.efforts) && d.efforts.length) ? d.efforts : null };
  } catch (e) { return null; }
}
// Current user's usage snapshot, or null when unavailable (no backend / not signed in).
async function aihFetchUsage() {
  try {
    const r = await fetch(AIH_API + '/usage', { credentials: 'include' });
    if (!r.ok) return null;
    return await r.json(); // { limit, used, remaining, byTool }
  } catch (e) { return null; }
}
// Check-and-charge server-side. → { status:'ok'|'over'|'unavailable', usage }
async function aihCharge(toolId, effortId) {
  try {
    const r = await fetch(AIH_API + '/usage', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolId, effort: effortId }),
    });
    const d = await r.json().catch(() => null);
    if (r.status === 402) return { status: 'over', usage: d };
    if (!r.ok) return { status: 'unavailable' };
    return { status: 'ok', usage: d };
  } catch (e) { return { status: 'unavailable' }; }
}
// Undo a charge when the call was cancelled or failed — the user got nothing, so they shouldn't pay.
async function aihRefund(usageId) {
  if (!usageId) return null;
  try {
    const r = await fetch(AIH_API + '/refund', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usage_id: usageId }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}
// Report mistakes the executor caught, so the agent stops repeating them. Signals only — {type, detail}
// from a fixed server-side catalog — never lesson text: this feeds every user's prompts, so letting the
// client author the wording would be a global prompt-injection hole. Deliberately not awaited and
// silent on failure: the user's reply must never wait on, or be broken by, bookkeeping. In standalone
// mode (no /api/ai) it just no-ops.
function aihReportSignals(signals) {
  const list = (signals || []).filter(s => s && s.type);
  if (!list.length) return;
  try {
    fetch(AIH_API + '/learn', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signals: list.slice(0, 10) }),
    }).catch(() => {});
  } catch (e) {}
}
// --- User-attached reference images -------------------------------------------------------------
// A real screenshot is nothing like the canvas schematic: a phone grab is easily 3000px and several MB,
// and base64 inflates it another third against a 4mb body cap (express.json in server/index.js). It is
// also billed per pixel. So every attachment is re-encoded to a sane size BEFORE it ever leaves the
// browser — the model reads a 1400px reference exactly as well as a 4000px one.
const AIH_MAX_IMAGES = 2;            // the server sanitizer caps at 2; refuse here so the UI can say why
const AIH_IMG_MAX_EDGE = 1400;
const AIH_IMG_QUALITY = 0.85;

function aihReadImage(file) {
  return new Promise((resolve) => {
    if (!file || !/^image\//.test(file.type || '')) return resolve(null);
    const fr = new FileReader();
    fr.onerror = () => resolve(null);
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        try {
          const scale = Math.min(1, AIH_IMG_MAX_EDGE / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, w, h);
          // WebP is markedly smaller than JPEG at the same quality and the server accepts it; if the
          // browser silently ignores the type (it returns a PNG data URL instead), fall back to JPEG
          // rather than ship a needlessly huge PNG.
          let url = cv.toDataURL('image/webp', AIH_IMG_QUALITY);
          if (url.indexOf('data:image/webp') !== 0) url = cv.toDataURL('image/jpeg', AIH_IMG_QUALITY);
          const mime = url.slice(5, url.indexOf(';'));
          resolve({ mimeType: mime, base64: url.slice(url.indexOf(',') + 1), dataUrl: url, w: w, h: h,
            name: (file.name || 'image').slice(0, 40) });
        } catch (e) { resolve(null); }
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
// Pull image files out of a paste or a drop. Pasting a screenshot is the whole point — that is how the
// user already shares one — so the clipboard path matters more than the file picker.
function aihImageFiles(dt) {
  const out = [];
  if (!dt) return out;
  const items = dt.items ? Array.from(dt.items) : [];
  for (const it of items) {
    if (it.kind === 'file' && /^image\//.test(it.type || '')) { const f = it.getAsFile(); if (f) out.push(f); }
  }
  if (!out.length && dt.files) Array.from(dt.files).forEach(f => { if (/^image\//.test(f.type || '')) out.push(f); });
  return out;
}
function aihCopy(text) {
  try { if (navigator.clipboard) navigator.clipboard.writeText(text || ''); } catch (e) {}
}

// --- styles -------------------------------------------------------------------------------------
const aihShell = (open) => ({
  position: 'fixed', top: 'var(--topbar-h, 52px)', right: 0, bottom: 0, width: 366, maxWidth: '92vw',
  display: 'flex', flexDirection: 'column', background: 'var(--surface)',
  borderLeft: '1px solid var(--border-subtle)', boxShadow: '-14px 0 40px rgba(0,0,0,0.28)',
  zIndex: 40, transform: open ? 'translateX(0)' : 'translateX(102%)',
  transition: 'transform .22s cubic-bezier(.4,0,.2,1)', pointerEvents: open ? 'auto' : 'none',
});
const aihHeader = {
  flex: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 10px 12px 14px',
  borderBottom: '1px solid var(--border-subtle)',
};
const aihMark = {
  width: 30, height: 30, flex: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--action-solid), var(--blue-base))', color: 'var(--action-solid-text, #fff)',
};
const aihProTag = {
  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 5px', borderRadius: 4,
  background: 'linear-gradient(135deg, var(--action-solid), var(--blue-base))', color: 'var(--action-solid-text, #fff)',
};
const aihIconBtn = {
  width: 28, height: 28, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: 0, borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
};
const aihScroll = { flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 };
const aihBubble = (role) => {
  const base = {
    maxWidth: '84%', padding: '9px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  };
  if (role === 'user') return { ...base, alignSelf: 'flex-end', background: 'var(--action-solid)', color: 'var(--action-solid-text, #fff)', borderBottomRightRadius: 4 };
  if (role === 'error') return { ...base, alignSelf: 'flex-start', background: 'var(--surface-inset)', color: 'var(--text-primary)', borderLeft: '2px solid var(--red-base)', borderBottomLeftRadius: 4, display: 'flex', gap: 8, alignItems: 'flex-start' };
  return { ...base, alignSelf: 'flex-start', background: 'var(--surface-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderBottomLeftRadius: 4 };
};
const aihComposer = { flex: 'none', borderTop: '1px solid var(--border-subtle)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' };
const aihThumb = {
  position: 'relative', width: 52, height: 52, borderRadius: 6, overflow: 'hidden',
  border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', flex: 'none',
};
const aihThumbX = {
  position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7, border: 0,
  background: 'rgba(0,0,0,0.66)', color: '#fff', cursor: 'pointer', padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const aihTextarea = {
  width: '100%', boxSizing: 'border-box', resize: 'none', maxHeight: 132, minHeight: 42,
  border: '1px solid var(--border-default)', borderRadius: 8, background: 'var(--surface-inset)',
  color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5,
  padding: '10px 12px', outline: 'none',
};
const aihToolRow = (active) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 11px',
  borderRadius: 9, cursor: 'pointer',
  border: active ? '1px solid var(--action-solid)' : '1px solid var(--border-subtle)',
  background: active ? 'var(--surface-hover)' : 'var(--surface-inset)',
});
const aihToolIcon = (active) => ({
  width: 30, height: 30, flex: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: active ? 'linear-gradient(135deg, var(--action-solid), var(--blue-base))' : 'var(--surface)',
  color: active ? 'var(--action-solid-text, #fff)' : 'var(--text-secondary)',
});
const aihCostChip = {
  flex: 'none', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
  background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '2px 5px',
};
const aihChip = {
  display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid var(--border-subtle)',
  background: 'var(--surface-inset)', borderRadius: 20, padding: '3px 8px', cursor: 'pointer',
  fontSize: 12, color: 'var(--text-primary)', flex: 'none',
};
const aihMenu = {
  position: 'absolute', bottom: '100%', left: 10, marginBottom: 6, zIndex: 3, minWidth: 210,
  background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 9,
  boxShadow: '0 10px 30px rgba(0,0,0,0.4)', padding: 5, display: 'flex', flexDirection: 'column', gap: 2,
};
const aihMenuItem = (active) => ({
  display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left', width: '100%', padding: '7px 9px',
  border: 0, borderRadius: 6, cursor: 'pointer',
  background: active ? 'var(--surface-hover)' : 'transparent',
});
const aihMiniBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-subtle)',
  background: 'var(--surface)', color: 'var(--text-muted)', borderRadius: 6, padding: '3px 7px',
  fontSize: 11, cursor: 'pointer',
};

// Usage-bar fill color by how much budget remains.
function aihMeterColor(remaining, limit) {
  const frac = limit > 0 ? remaining / limit : 0;
  if (frac <= 0.1) return 'var(--red-base)';
  if (frac <= 0.25) return 'var(--amber-base)';
  return 'var(--action-solid)';
}

function AIHelper({ open, onClose, agent }) {
  const { Button } = window.LatticeDesignSystem_e801cb;
  const [messages, setMessages] = React.useState([]); // { id, role:'user'|'assistant'|'error'|'action'|'note', text, cost?, plan?, actionsRaw? }
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [stage, setStage] = React.useState('');        // which pipeline stage is running, for the indicator
  // The pipeline is several model calls per turn but used to show one spinner line, so a 90-second
  // six-stage build looked identical to a hung request. `steps` is the live checklist: each stage is
  // appended as it starts and ticked as it finishes, so the work is visible while it happens rather
  // than only in the trace afterwards.
  const [steps, setSteps] = React.useState([]);        // [{ label, status:'run'|'done'|'skip', ms, note }]
  const [tools, setTools] = React.useState(AIH_TOOLS_FALLBACK);
  const [efforts, setEfforts] = React.useState(AIH_EFFORTS_FALLBACK);
  const [usage, setUsage] = React.useState(undefined); // undefined = loading, null = unavailable, obj = loaded
  const [activeToolId, setActiveToolId] = React.useState(AIH_DEFAULT_TOOL);
  const [effortId, setEffortId] = React.useState(AIH_DEFAULT_EFFORT);
  const [mode, setMode] = React.useState('build');     // 'build' | 'plan'
  const [view, setView] = React.useState('chat');      // 'chat' | 'tools' | 'history'
  const [menu, setMenu] = React.useState(null);        // null | 'mode' | 'effort'
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [expandedTrace, setExpandedTrace] = React.useState({});   // trace id -> expanded?
  const [chats, setChats] = React.useState(() => aihLoadChats());
  const scrollRef = React.useRef(null);
  const taRef = React.useRef(null);
  const fileRef = React.useRef(null);
  // Reference images the user attached for THIS turn: [{ mimeType, base64, dataUrl, w, h, name }].
  // Never persisted (see aihTrimMessages) — base64 in localStorage is what blew the origin quota once
  // already, and a reference only means anything for the turn it was attached to.
  const [attached, setAttached] = React.useState([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [imgBusy, setImgBusy] = React.useState(false);
  const abortRef = React.useRef(null);
  const sessionRef = React.useRef(null);               // stable conversation id; sent for logging only now
  const chatIdRef = React.useRef(null);                // localStorage conversation id
  const lastUserRef = React.useRef(null);              // { text, mode } — for Regenerate
  // ref-id -> real node id, accumulated across the conversation. The model has chat memory and will
  // say "setProp btn1" about something it created earlier; without this those refs resolve to nothing.
  const refsRef = React.useRef({});
  const auditRef = React.useRef({ key: '', text: '' });  // canvas audit, cached against a hash of the canvas
  if (sessionRef.current === null) sessionRef.current = aihNewId();
  if (chatIdRef.current === null) chatIdRef.current = aihNewId();

  const activeTool = tools.find(t => t.id === activeToolId) || tools[0];
  const activeEffort = efforts.find(e => e.id === effortId) || efforts[1] || efforts[0];
  const isAgentTool = !!(activeTool && activeTool.mode === 'agent' && agent && agent.apply);
  const cost = aihCostFor(activeTool, activeEffort);
  const overLimit = !!(usage && usage.remaining < cost);
  const browsing = view === 'tools' || (view === 'chat' && messages.length === 0);

  // Load the catalog + usage each time the panel opens (usage may have changed elsewhere).
  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    aihFetchCatalog().then(c => {
      if (!alive || !c) return;
      setTools(aihNormalizeTools(c.tools));
      if (c.efforts) setEfforts(c.efforts);
    });
    aihFetchUsage().then(u => { if (alive) setUsage(u); });
    return () => { alive = false; };
  }, [open]);

  // Persist the conversation (debounced). Restoring one later brings back its messages, which are what
  // aihRecentTurns ships as chat history — so a restored chat genuinely continues rather than starting
  // blank, even though no memory is kept server-side.
  React.useEffect(() => {
    if (!messages.length) return;
    const t = setTimeout(() => {
      setChats(prev => {
        const now = Date.now();
        const idx = prev.findIndex(c => c.id === chatIdRef.current);
        const entry = {
          id: chatIdRef.current, sessionId: sessionRef.current, title: aihChatTitle(messages),
          createdAt: idx >= 0 ? prev[idx].createdAt : now, updatedAt: now, messages: aihTrimMessages(messages),
        };
        const next = (idx >= 0 ? prev.map((c, i) => (i === idx ? entry : c)) : [entry].concat(prev))
          .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, AIH_MAX_CHATS);
        aihSaveChats(next);
        return next;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [messages]);

  React.useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, sending]);
  React.useEffect(() => { if (open && view === 'chat' && taRef.current) taRef.current.focus(); }, [open, view]);
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, [open, messages, sending, view, tools, activeToolId, showBreakdown, menu, chats, mode, effortId]);
  React.useEffect(() => { const ta = taRef.current; if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 132) + 'px'; } }, [input]);
  // Abort any in-flight request if the panel unmounts.
  React.useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const push = (m) => setMessages(list => list.concat([m]));

  // `isRetry` marks the one automatic re-issue we do when an agent batch applies nothing (stale ids) —
  // it re-reads the live canvas and doesn't post a second user bubble.
  const send = async (overrideText, overrideMode, overrideSpec, isRetry) => {
    const text = (overrideText != null ? overrideText : input).trim();
    const useMode = overrideMode || mode;
    // An attached image IS the request ("build this"), so a bare image with no words is legitimate.
    if ((!text && !attached.length) || sending || !activeTool) return;
    if (usage && usage.remaining < cost) {
      push({ id: aihNewId(), role: 'error', text: 'You’ve used your token budget (' + aihFmtTokens(usage.used) + ' / ' + aihFmtTokens(usage.limit) + '). Ask an admin to reset or raise your limit.' });
      return;
    }
    // Freeze the attachments for this turn before the composer is cleared — an auto-retry re-sends the
    // same request and must carry the same references, or the retry answers a different question.
    const refImages = (overrideSpec || isRetry) ? (lastUserRef.current && lastUserRef.current.images) || [] : attached;
    lastUserRef.current = { text: text, mode: useMode, images: refImages };
    const userMsg = { id: aihNewId(), role: 'user', text: text, cost: cost,
      // Thumbnails for the bubble. aihTrimMessages whitelists fields, so this never reaches
      // localStorage — persisting base64 is exactly what blew the origin quota before.
      images: refImages.map(im => ({ dataUrl: im.dataUrl, name: im.name })) };
    if (!isRetry) push(userMsg);   // an auto-retry re-runs the same request; don't echo the user again
    if (overrideText == null) { setInput(''); setAttached([]); }
    setSending(true);
    setSteps([]);                  // fresh checklist per turn

    // Charge first (server-authoritative); refunded below if the call is cancelled or fails.
    const charge = await aihCharge(activeTool.id, effortId);
    if (charge.status === 'over') {
      if (charge.usage) setUsage(prev => ({ ...(prev || {}), used: charge.usage.used, limit: charge.usage.limit, remaining: charge.usage.remaining }));
      setSending(false);
      const u = charge.usage || usage || {};
      push({ id: aihNewId(), role: 'error', text: 'Token limit reached (' + aihFmtTokens(u.used) + ' / ' + aihFmtTokens(u.limit) + '). Ask an admin to reset or raise your limit.' });
      return;
    }
    if (charge.status === 'ok' && charge.usage) setUsage(charge.usage);
    const usageId = charge.usage && charge.usage.usage_id;

    // Agent mode ships the design alongside (not inside) the message; scope follows the effort level.
    let editorState = '';
    if (isAgentTool && agent.getContext) {
      try { editorState = JSON.stringify(agent.getContext(activeEffort.scope)); } catch (e) {}
    }
    // A picture of the same canvas, for the audit stage to actually LOOK at. Coordinates alone hid the
    // faults that matter most here — a section hanging off the artboard, a dead band under a column —
    // because judging those from 40 rows of {x,y,w,h} is exactly what models are worst at. Drawn only
    // when there's something to see; a blank canvas is better described in words.
    // The user's reference images, for the stages that decide and build. Deliberately NOT sent to the
    // audit: audit's question is "what is already on the canvas", and handing it a reference screenshot
    // in the same call invites it to report the reference as though it were the user's design. Keeping
    // canvas-image and reference-images on different stages means neither ever has to be labelled.
    const refParts = refImages.map(im => ({ mimeType: im.mimeType, data: im.base64 }));
    const refOpt = refParts.length ? { images: refParts } : {};
    let canvasImage = null;
    if (isAgentTool && agent.getImage) {
      try { canvasImage = agent.getImage(); } catch (e) {}
    }
    // A non-agent tool's framing is applied SERVER-side now, as the system instruction rather than a
    // prefix on the user's own words — so only the plan directive is added here (it is deliberately
    // part of the message: it belongs to this turn, and should ride in the history with it).
    const framed = text + (isAgentTool && useMode === 'plan' ? AIH_PLAN_DIRECTIVE : '');
    // Read BEFORE the current turn is appended below, so this is genuinely the prior conversation.
    const history = aihRecentTurns(messages, AIH_MAX_HISTORY_TURNS);
    // How many times the critic may send the spec back. Effort's own budget, capped as a backstop
    // against a critic that never says APPROVED. An older catalog without `rounds` behaves as before.
    const reviewRounds = Math.min(
      activeEffort.rounds == null ? 1 : activeEffort.rounds,
      AIH_MAX_CRITIQUE_ROUNDS
    );

    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    abortRef.current = ctrl;
    const common = {
      messageId: userMsg.id, sessionId: sessionRef.current, toolId: activeTool.id,
      effortId: effortId, mode: useMode, editorState: editorState, history: history,
      signal: ctrl ? ctrl.signal : undefined,
    };
    // Any stage failing means the user got nothing — hand the tokens back and say why.
    const bail = async (r) => {
      abortRef.current = null;
      setSending(false); setStage(''); setSteps([]);
      const back = await aihRefund(usageId);
      if (back) setUsage(prev => ({ ...(prev || {}), used: back.used, limit: back.limit, remaining: back.remaining, byTool: back.byTool }));
      push(r.aborted
        ? { id: aihNewId(), role: 'note', text: 'Stopped' + (back && back.refunded ? ' · ' + aihFmtTokens(cost) + ' tokens refunded' : '') }
        : { id: aihNewId(), role: 'error', text: r.error });
    };

    // The pipeline runs several model calls per turn but shows nothing but a spinner, so a real
    // multi-stage build looks identical to a one-shot reply. `trace` records each stage (label, ms,
    // and a short note like the critic's verdict) and is rendered as an expandable line under the
    // result — visible evidence of what actually ran.
    const trace = [];
    // Update the LAST step carrying this label — the pipeline can run the same stage twice in a turn
    // (prepare, then prepare again to fix the critique), and the second must not overwrite the first.
    const markStep = (label, patch) => setSteps(list => {
      let i = -1;
      for (let k = list.length - 1; k >= 0; k--) if (list[k].label === label) { i = k; break; }
      if (i < 0) return list;
      const next = list.slice();
      next[i] = Object.assign({}, next[i], patch);
      return next;
    });
    // A provider can still hand back an empty completion, or be briefly overloaded (Gemini 503s under
    // load). Retry a stage once before giving up, so a single flaky reply doesn't sink the turn. The
    // server already rotates keys and falls over to the other provider underneath this, so a retry
    // here is the last resort, not the first. Only the caller decides whether an empty result is fatal.
    const runStage = async (label, opts, noteFn) => {
      const t0 = Date.now();
      setStage(label + '…');
      setSteps(list => list.concat({ label: label, status: 'run' }));
      let r = await aihAsk(opts);
      if (r && r.error && !r.aborted) {
        await new Promise(res => setTimeout(res, 900));
        setStage(label + ' (retry)…');
        markStep(label, { note: 'retrying' });
        const r2 = await aihAsk(opts);
        if (r2) r = r2;
      }
      const note = (!r.error && !r.aborted && noteFn) ? noteFn(r) : (r.error ? 'empty' : undefined);
      trace.push({ label: label, ms: Date.now() - t0, note: note });
      markStep(label, { status: r.aborted ? 'skip' : 'done', ms: Date.now() - t0, note: note });
      return r;
    };
    const textOf = (r) => (r && !r.error && !r.aborted && r.text) ? r.text : '';

    let res;
    if (isAgentTool) {
      // --- 4-stage pipeline: audit -> analyze -> prepare -> implement -----------------------------
      // "Implement plan" arrives with the spec already in hand, so it skips straight to building.
      let spec = overrideSpec || '';
      let scope = 'build';
      if (!spec) {
        // The audit only depends on the canvas, so reuse it while the canvas hasn't changed. The IMAGE
        // is part of that canvas now, and it is not redundant with editorState: editorState is scoped by
        // effort (low ships ~12 nodes) while the picture always shows the whole page — so a change
        // outside the scoped context would keep the same key and serve an audit that contradicts the
        // image it was made from. Key on both.
        const key = aihHash(editorState) + ':' + aihHash(canvasImage ? canvasImage.base64 : '');
        let audit = (auditRef.current.key === key && auditRef.current.text) ? auditRef.current.text : '';
        // The audit only helps downstream stages ground themselves — if it comes back empty (a flaky
        // Groq reply) don't sink the turn; the later stages also get the raw editor_state directly.
        if (audit) {
          trace.push({ label: 'Reading your canvas', ms: 0, note: 'cached' });
          setSteps(list => list.concat({ label: 'Reading your canvas', status: 'done', ms: 0, note: 'cached' }));
        } else {
          // The image rides ONLY on the audit: it is the stage whose whole job is "what is on the
          // canvas", and paying image tokens on all five stages to re-answer that would be waste.
          // Everything downstream consumes the audit's words.
          const au = await runStage('Reading your canvas',
            { ...common, stage: AIH_STAGE_AUDIT, message: text, images: canvasImage ? [{ mimeType: canvasImage.mimeType, data: canvasImage.base64 }] : undefined },
            (r) => (canvasImage ? 'saw the canvas' : undefined));
          if (au.aborted) return bail(au);
          audit = textOf(au);
          if (audit) auditRef.current = { key: key, text: audit };
        }
        // Say what we noticed before disappearing into the pipeline for a minute.
        const obs = aihObservation(audit);
        if (obs) push({ id: aihNewId(), role: 'note', text: obs });

        const an = await runStage('Understanding your request', { ...common, ...refOpt, stage: AIH_STAGE_ANALYZE, message: text, audit: audit });
        if (an.aborted) return bail(an);
        const analysis = textOf(an);
        scope = aihScopeOf(analysis); // empty analysis → defaults to 'build', which is the safe path
        trace[trace.length - 1].note = an.error ? 'empty → build' : scope;

        if (scope === 'build') {
          // Enhancer stages (research + critique) degrade to empty on failure — they improve the spec
          // but the build can proceed without them. Only PREPARE and IMPLEMENT are load-bearing.
          const st = await runStage('Choosing the palette & type', { ...common, stage: AIH_STAGE_RESEARCH, message: text, audit: audit });
          if (st.aborted) return bail(st);
          const style = textOf(st);

          const pr = await runStage('Finding components & layout', {
            ...common, ...refOpt, stage: AIH_STAGE_PREPARE, message: text, audit: audit, style: style, analysis: analysis,
          });
          if (pr.aborted) return bail(pr);
          spec = textOf(pr); // empty spec is tolerable — IMPLEMENT can build straight from the request

          for (let round = 1; round <= reviewRounds && spec; round++) {
            const cr = await runStage(round > 1 ? 'Reviewing again (round ' + round + ')' : 'Reviewing the design',
              { ...common, stage: AIH_STAGE_CRITIQUE, message: text, audit: audit, analysis: analysis, spec: spec },
              (r) => aihIsApproved(r.text) ? 'looks good' : ((r.text.match(/^\s*\d+[.)]/gm) || []).length || '?') + ' to fix');
            if (cr.aborted) return bail(cr);
            if (cr.error || aihIsApproved(cr.text)) break; // empty critique → treat as approved, skip revise

            const rev = await runStage('Fixing what the review found' + (round > 1 ? ' (round ' + round + ')' : ''), {
              ...common, ...refOpt, stage: AIH_STAGE_PREPARE, message: text, audit: audit, style: style, analysis: analysis,
              prevSpec: spec, critique: cr.text || '',
            });
            if (rev.aborted) return bail(rev);
            // Hard guard: a revision may only add. If it came back empty or with fewer nodes (the critic
            // talked it into deleting sections), keep the richer original and stop.
            if (textOf(rev) && aihSpecNodeCount(rev.text) >= aihSpecNodeCount(spec) - 1) {
              spec = rev.text;
            } else {
              trace[trace.length - 1].note = 'kept original';
              break;
            }
          }
        } else {
          // For an edit the analysis already IS the spec — it lists the real TARGETS and the change
          // to each. For a question there's nothing to build; implement answers in prose.
          spec = scope === 'edit' ? analysis : '';
        }

        // Plan mode stops here: the spec (or the analysis) IS the plan; the canvas is never touched.
        if (useMode === 'plan') {
          abortRef.current = null; setSending(false); setStage(''); setSteps([]);
          push({ id: aihNewId(), role: 'assistant', text: spec || analysis || 'No plan produced.', plan: true, spec: spec });
          return;
        }
      }
      res = await runStage(scope === 'edit' ? 'Applying the change' : scope === 'question' ? 'Answering' : 'Building the page',
        { ...common, ...refOpt, stage: AIH_STAGE_IMPLEMENT, message: text, spec: spec, mode: 'build' });
    } else {
      res = await aihAsk({ ...common, message: framed });
    }
    abortRef.current = null;
    setSending(false); setStage(''); setSteps([]);

    if (res.aborted || res.error) return bail(res);

    if (isAgentTool) {
      const prose = aihStripActions(res.text);
      const actions = aihParseActions(res.text);
      const out = [{ id: aihNewId(), role: 'assistant', text: prose || (actions ? 'Applying your changes…' : res.text) }];
      if (trace.length) out.push({ id: aihNewId(), role: 'trace', trace: trace });
      if (actions) {
        let applied = null;
        try { applied = agent.apply(actions, refsRef.current); } catch (e) { applied = null; }
        if (applied && applied.refs) refsRef.current = applied.refs;
        const unsup = Array.from(new Set((applied && applied.unknownOps) || []));
        const unsupList = unsup.slice(0, 3).join(', ') + (unsup.length > 3 ? '…' : '');
        // Teach the pipeline what only the CLIENT can see. An op with no handler, or a target that
        // resolved to nothing, is knowable only once the batch has run against the real canvas — the
        // server never finds out. Signals only (the wording is chosen server-side); fire-and-forget,
        // because learning must never delay or break the reply the user is reading.
        aihReportSignals(
          unsup.map(op => ({ type: 'unknownOp', detail: op }))
            .concat(((applied && applied.missing) || []).length ? [{ type: 'ghostId' }] : [])
        );
        if (applied && applied.total) {
          // Some changes landed. If the model ALSO asked for something we can't do yet, say so rather
          // than let a partial success read as a full one.
          const note = unsup.length ? ' · couldn’t do: ' + unsupList : '';
          out.push({ id: aihNewId(), role: 'action', text: 'Applied to canvas · ' + applied.summary + note,
            undoScope: applied.undoScope, actionsRaw: JSON.stringify({ actions: actions }, null, 2) });
        } else if (unsup.length) {
          // Nothing applied because the whole request needs an op the executor doesn't implement yet
          // (a workflow/variable edit, etc.). Retrying re-emits the same impossible op, so don't — refund
          // and say plainly what's out of scope.
          const back = await aihRefund(usageId);
          if (back) setUsage(prev => ({ ...(prev || {}), used: back.used, limit: back.limit, remaining: back.remaining, byTool: back.byTool }));
          out.push({ id: aihNewId(), role: 'error', text: 'That needs something I can’t do yet (' + unsupList + '). I can add, rename, delete and re-route pages, and build or change anything on the canvas — try phrasing it that way.' });
        } else {
          // A batch that applied *nothing* is almost always the model targeting ids that don't exist —
          // usually its own ref ids from an earlier turn, only valid inside the block that created them.
          // Instead of making the user hit Retry, refund this attempt and re-issue once transparently:
          // a fresh send re-reads the live canvas (agent.getContext), exactly what a manual Retry did.
          const miss = (applied && applied.missing) || [];
          const back = await aihRefund(usageId);
          if (back) setUsage(prev => ({ ...(prev || {}), used: back.used, limit: back.limit, remaining: back.remaining, byTool: back.byTool }));
          if (!isRetry) {
            setMessages(list => list.concat({ id: aihNewId(), role: 'note', text: 'Re-reading your canvas and applying again…' }));
            return send(text, useMode, undefined, true);
          }
          // Re-read and retried once already and it still didn't line up — surface the real reason and
          // stop (the tokens for both attempts have been handed back above).
          out.push({
            id: aihNewId(), role: 'error',
            text: miss.length
              ? 'Those changes referenced nodes that aren’t on the canvas (' + miss.slice(0, 3).join(', ') + (miss.length > 3 ? '…' : '') + '). I re-read the canvas and tried again, but it still didn’t line up — try describing the change a different way.'
              : 'I proposed changes but none of them applied to the canvas, even after re-reading it. Try describing the change a different way.',
          });
        }
      }
      setMessages(list => list.concat(out));
      return;
    }
    push({ id: aihNewId(), role: 'assistant', text: res.text });
  };

  const stop = () => { if (abortRef.current) abortRef.current.abort(); };
  const regenerate = () => { const l = lastUserRef.current; if (l && !sending) send(l.text, l.mode); };

  const onKeyDown = (e) => {
    e.stopPropagation(); // keep the editor's global shortcuts (space-pan, delete, nudge…) out of the composer
    if (e.key === 'Escape') { if (menu) { setMenu(null); return; } onClose && onClose(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Start a genuinely new conversation: fresh session + fresh chat id. Clearing `messages` is what
  // actually resets the memory now — history is derived from it per turn.
  const newChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]); setInput(''); setView('chat'); setMenu(null);
    sessionRef.current = aihNewId(); chatIdRef.current = aihNewId(); lastUserRef.current = null;
    refsRef.current = {};                              // a new conversation's "btn1" is a different button
    auditRef.current = { key: '', text: '' };
    if (taRef.current) taRef.current.focus();
  };
  const openChat = (c) => {
    if (abortRef.current) abortRef.current.abort();
    setMessages(c.messages || []);
    sessionRef.current = c.sessionId || aihNewId();
    chatIdRef.current = c.id;
    lastUserRef.current = null;
    refsRef.current = {};                              // refs aren't persisted; the model re-reads real ids
    auditRef.current = { key: '', text: '' };
    setView('chat');
  };
  const deleteChat = (id) => setChats(prev => { const next = prev.filter(c => c.id !== id); aihSaveChats(next); return next; });

  // --- Attaching reference images ---------------------------------------------------------------
  // Three ways in, because a screenshot arrives differently depending on how it was taken: paste
  // (the common one — Win+Shift+S then Ctrl+V), drag-drop, and the file picker.
  const addImages = React.useCallback(async (files) => {
    const list = (files || []).slice(0, AIH_MAX_IMAGES);
    if (!list.length) return;
    setImgBusy(true);
    try {
      const read = await Promise.all(list.map(aihReadImage));
      const ok = read.filter(Boolean);
      if (ok.length) setAttached(prev => prev.concat(ok).slice(-AIH_MAX_IMAGES));   // newest wins at the cap
    } finally { setImgBusy(false); }
  }, []);
  const onPaste = (e) => {
    const files = aihImageFiles(e.clipboardData);
    if (!files.length) return;      // a normal text paste must still behave normally
    e.preventDefault();
    addImages(files);
  };
  const onDrop = (e) => {
    const files = aihImageFiles(e.dataTransfer);
    setDragOver(false);
    if (!files.length) return;
    e.preventDefault();
    addImages(files);
  };
  const onDragOver = (e) => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return;
    e.preventDefault();
    setDragOver(true);
  };
  const removeImage = (i) => setAttached(prev => prev.filter((_, k) => k !== i));

  const pickTool = (id) => { setActiveToolId(id); setView('chat'); setTimeout(() => { if (taRef.current) taRef.current.focus(); }, 0); };
  const toolHover = (e, on, active) => {
    if (active) return;
    e.currentTarget.style.background = on ? 'var(--surface-hover)' : 'var(--surface-inset)';
    e.currentTarget.style.borderColor = on ? 'var(--border-strong)' : 'var(--border-subtle)';
  };
  const hoverBtn = (e, on) => {
    e.currentTarget.style.background = on ? 'var(--surface-hover)' : 'transparent';
    e.currentTarget.style.color = on ? 'var(--text-secondary)' : 'var(--text-muted)';
  };

  const toolRow = (t) => {
    const active = t.id === activeToolId;
    return (
      <button key={t.id} type="button" onClick={() => pickTool(t.id)}
        onMouseEnter={e => toolHover(e, true, active)} onMouseLeave={e => toolHover(e, false, active)}
        style={aihToolRow(active)}>
        <span style={aihToolIcon(active)}><i data-lucide={t.icon} style={{ width: 16, height: 16 }}></i></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</span>
        </span>
        <span style={aihCostChip}>{aihFmtTokens(aihCostFor(t, activeEffort))}</span>
      </button>
    );
  };

  const headerBtn = (icon, title, onClick, active) => (
    <button type="button" title={title} onClick={onClick}
      onMouseEnter={e => hoverBtn(e, true)} onMouseLeave={e => hoverBtn(e, false)}
      style={{ ...aihIconBtn, background: active ? 'var(--surface-hover)' : 'transparent', color: active ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
      <i data-lucide={icon} style={{ width: 15, height: 15 }}></i>
    </button>
  );

  return (
    <div style={aihShell(open)} aria-hidden={!open} role="complementary" aria-label="AI Helper">
      <style>{`@keyframes aih-dot { 0%,80%,100% { opacity:.25; transform:translateY(0) } 40% { opacity:1; transform:translateY(-2px) } }`}</style>

      <div style={aihHeader}>
        <span style={aihMark}><i data-lucide="sparkles" style={{ width: 16, height: 16 }}></i></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>AI Helper</span>
            <span style={aihProTag}>PRO</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>Design assistance</div>
        </div>
        {headerBtn('history', 'Chat history', () => setView(v => (v === 'history' ? 'chat' : 'history')), view === 'history')}
        {headerBtn('layout-grid', 'Browse tools', () => setView(v => (v === 'tools' ? 'chat' : 'tools')), view === 'tools')}
        {headerBtn('square-pen', 'New chat', newChat)}
        {headerBtn('x', 'Close', onClose)}
      </div>

      {/* Usage meter strip */}
      <div style={{ flex: 'none', padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-inset)' }}>
        {usage === undefined ? (
          <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>Loading usage…</div>
        ) : usage === null ? (
          <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>Token usage unavailable</div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <button type="button" onClick={() => setShowBreakdown(s => !s)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11.5 }}>
                <i data-lucide="coins" style={{ width: 13, height: 13 }}></i>
                <span>AI tokens</span>
                <i data-lucide={showBreakdown ? 'chevron-up' : 'chevron-down'} style={{ width: 12, height: 12, opacity: 0.7 }}></i>
              </button>
              <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {aihFmtTokens(usage.used)} / {aihFmtTokens(usage.limit)}
              </span>
            </div>
            <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.min(100, usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0) + '%', background: aihMeterColor(usage.remaining, usage.limit), transition: 'width .3s ease' }} />
            </div>
            {showBreakdown && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{aihFmtTokens(usage.remaining)} remaining</div>
                {(usage.byTool && usage.byTool.length) ? usage.byTool.map(b => {
                  const t = tools.find(x => x.id === b.tool);
                  return (
                    <div key={b.tool} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t ? t.name : b.tool}<span style={{ color: 'var(--text-disabled)' }}> · {b.count}×</span></span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{aihFmtTokens(b.tokens)}</span>
                    </div>
                  );
                }) : <div style={{ fontSize: 11.5, color: 'var(--text-disabled)' }}>No usage yet</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={scrollRef} style={aihScroll}>
        {view === 'history' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '2px 2px 4px' }}>Saved on this browser, for this project.</div>
            {chats.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', padding: 8 }}>No saved conversations yet.</div>}
            {chats.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', borderRadius: 9, padding: '8px 10px' }}>
                <button type="button" onClick={() => openChat(c)} style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{aihRelTime(c.updatedAt)} · {(c.messages || []).length} messages</span>
                </button>
                <button type="button" title="Delete" onClick={() => deleteChat(c.id)}
                  onMouseEnter={e => hoverBtn(e, true)} onMouseLeave={e => hoverBtn(e, false)} style={aihIconBtn}>
                  <i data-lucide="trash-2" style={{ width: 14, height: 14 }}></i>
                </button>
              </div>
            ))}
          </div>
        ) : browsing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {view === 'tools' ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '2px 2px 4px' }}>Choose a tool for your next message.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', padding: '8px 8px 6px' }}>
                <span style={{ ...aihMark, width: 42, height: 42, borderRadius: 12 }}><i data-lucide="sparkles" style={{ width: 22, height: 22 }}></i></span>
                <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 18, color: 'var(--text-secondary)' }}>How can I help?</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 250 }}>Pick a design tool, then describe what you need.</div>
              </div>
            )}
            {tools.map(toolRow)}
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              if (m.role === 'action') {
                return (
                  <div key={m.id} style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 9, fontSize: 12.5, background: 'var(--surface-inset)', border: '1px solid var(--green-base)', color: 'var(--text-primary)' }}>
                    <i data-lucide="wand-sparkles" style={{ width: 15, height: 15, flex: 'none', color: 'var(--green-base)' }}></i>
                    <span style={{ flex: 1 }}>{m.text}</span>
                    {m.actionsRaw && (
                      <button type="button" title="Copy actions JSON" onClick={() => aihCopy(m.actionsRaw)}
                        onMouseEnter={e => hoverBtn(e, true)} onMouseLeave={e => hoverBtn(e, false)} style={{ ...aihIconBtn, width: 22, height: 22 }}>
                        <i data-lucide="copy" style={{ width: 12, height: 12 }}></i>
                      </button>
                    )}
                    {/* Undo is a nodes+connections snapshot, so a batch that touched the scene timeline,
                        variables, workflows or the page list is NOT fully restored by Ctrl+Z. Promising
                        an undo that won't happen is the same lie as reporting work that wasn't done. */}
                    <span style={{ fontSize: 10.5, color: 'var(--text-disabled)', flex: 'none' }}>
                      {m.undoScope === 'none' ? 'Ctrl+Z won’t undo this'
                        : m.undoScope === 'partial' ? 'Ctrl+Z undoes the canvas edits only'
                        : 'Ctrl+Z to undo'}
                    </span>
                  </div>
                );
              }
              if (m.role === 'note') {
                return <div key={m.id} style={{ alignSelf: 'center', fontSize: 11.5, color: 'var(--text-disabled)' }}>{m.text}</div>;
              }
              if (m.role === 'trace') {
                const total = (m.trace || []).reduce((a, s) => a + (s.ms || 0), 0);
                const open = !!expandedTrace[m.id];
                return (
                  <div key={m.id} style={{ alignSelf: 'stretch' }}>
                    <button type="button" onClick={() => setExpandedTrace(p => ({ ...p, [m.id]: !p[m.id] }))}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', color: 'var(--text-disabled)', fontSize: 11 }}>
                      <i data-lucide="git-commit-horizontal" style={{ width: 13, height: 13 }}></i>
                      <span>{m.trace.length} steps · {(total / 1000).toFixed(1)}s</span>
                      <i data-lucide={open ? 'chevron-up' : 'chevron-down'} style={{ width: 11, height: 11, opacity: 0.7 }}></i>
                    </button>
                    {open && (
                      <div style={{ marginTop: 5, marginLeft: 4, display: 'flex', flexDirection: 'column', gap: 3, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 9 }}>
                        {m.trace.map((s, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{s.label}{s.note ? <span style={{ color: s.note === 'approved' ? 'var(--green-base)' : /issue/.test(String(s.note)) ? 'var(--amber-base)' : 'var(--text-disabled)' }}> · {s.note}</span> : ''}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>{s.ms === 0 ? 'cached' : (s.ms / 1000).toFixed(1) + 's'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              const isLastAssistant = m.role === 'assistant' && i === messages.length - 1;
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', alignSelf: 'stretch' }}>
                  {/* References the user attached to THIS turn. Live-only: aihTrimMessages whitelists
                      persisted fields, so reopening a saved chat shows the words without the images. */}
                  {!!(m.images && m.images.length) && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '84%' }}>
                      {m.images.map((im, i) => (
                        <img key={i} src={im.dataUrl} alt={im.name || ''} title={im.name || ''}
                          style={{ width: 80, borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'block' }} />
                      ))}
                    </div>
                  )}
                  {!!m.text && (
                    <div style={aihBubble(m.role)}>
                      {m.role === 'error' && <i data-lucide="alert-triangle" style={{ width: 15, height: 15, flex: 'none', color: 'var(--red-base)', marginTop: 1 }}></i>}
                      <span>{m.text}</span>
                    </div>
                  )}
                  {/* Per-message cost, plan actions, copy/regenerate */}
                  {m.role === 'user' && m.cost ? (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>−{aihFmtTokens(m.cost)}</span>
                  ) : null}
                  {m.plan && !sending && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => send(AIH_IMPLEMENT_MSG, 'build', m.spec)} style={{ ...aihMiniBtn, color: 'var(--text-primary)', borderColor: 'var(--action-solid)' }}>
                        <i data-lucide="wand-sparkles" style={{ width: 12, height: 12 }}></i> Implement plan
                      </button>
                      <button type="button" onClick={() => aihCopy(m.text)} style={aihMiniBtn}>
                        <i data-lucide="copy" style={{ width: 12, height: 12 }}></i> Copy
                      </button>
                    </div>
                  )}
                  {(m.role === 'assistant' && !m.plan) || m.role === 'error' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {m.role === 'assistant' && (
                        <button type="button" onClick={() => aihCopy(m.text)} style={aihMiniBtn}>
                          <i data-lucide="copy" style={{ width: 12, height: 12 }}></i> Copy
                        </button>
                      )}
                      {(isLastAssistant || m.role === 'error') && lastUserRef.current && !sending && (
                        <button type="button" onClick={regenerate} style={aihMiniBtn}>
                          <i data-lucide="refresh-cw" style={{ width: 12, height: 12 }}></i> {m.role === 'error' ? 'Retry' : 'Regenerate'}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {sending && (
              // The live checklist. A six-stage build takes ~90s; showing only a spinner made that
              // indistinguishable from a hang, and hid the fact that the work is several real steps.
              // Done steps stay listed with their timing, so the pipeline explains itself as it runs.
              <div style={{ ...aihBubble('assistant'), display: 'block', padding: '10px 12px', minWidth: 208 }}>
                {steps.length ? steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2.5px 0' }}>
                    {s.status === 'run' ? (
                      <span style={{ display: 'inline-flex', gap: 3, width: 12, justifyContent: 'center' }}>
                        {[0, 1, 2].map(d => (
                          <span key={d} style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--action-solid)', display: 'inline-block', animation: `aih-dot 1.2s ${d * 0.16}s infinite ease-in-out` }} />
                        ))}
                      </span>
                    ) : (
                      <span style={{ width: 12, textAlign: 'center', fontSize: 10, lineHeight: 1, color: s.status === 'skip' ? 'var(--text-muted)' : 'var(--action-solid)' }}>
                        {s.status === 'skip' ? '·' : '✓'}
                      </span>
                    )}
                    <span style={{ fontSize: 11.5, flex: 1, color: s.status === 'run' ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {s.label}{s.status === 'run' ? '…' : ''}
                    </span>
                    {s.note ? <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.8 }}>{s.note}</span> : null}
                    {s.status === 'done' && s.ms ? <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>{(s.ms / 1000).toFixed(1)}s</span> : null}
                  </div>
                )) : (
                  // Non-agent tools are a single call with no stages — keep the original bare spinner.
                  <div style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `aih-dot 1.2s ${i * 0.16}s infinite ease-in-out` }} />
                      ))}
                    </span>
                    {stage && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{stage}</span>}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {view !== 'tools' && view !== 'history' && (
        <div style={aihComposer}>
          {/* Mode / effort menus */}
          {menu === 'mode' && (
            <div style={aihMenu}>
              {[['build', 'Build', 'Apply changes to the canvas straight away'], ['plan', 'Plan', 'Describe the steps first — nothing is changed until you approve']].map(o => (
                <button key={o[0]} type="button" onClick={() => { setMode(o[0]); setMenu(null); }} style={aihMenuItem(mode === o[0])}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{o[1]}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o[2]}</span>
                </button>
              ))}
            </div>
          )}
          {menu === 'effort' && (
            <div style={{ ...aihMenu, left: 'auto', right: 10 }}>
              {efforts.map(e => (
                <button key={e.id} type="button" onClick={() => { setEffortId(e.id); setMenu(null); }} style={aihMenuItem(effortId === e.id)}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{aihFmtTokens(aihCostFor(activeTool, e))}</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.description}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {activeTool && (
              <button type="button" onClick={() => { setMenu(null); setView('tools'); }} title="Change tool" style={aihChip}>
                <span style={{ ...aihToolIcon(true), width: 18, height: 18, borderRadius: 5 }}><i data-lucide={activeTool.icon} style={{ width: 11, height: 11 }}></i></span>
                <span style={{ fontWeight: 600 }}>{activeTool.name}</span>
                <i data-lucide="chevron-down" style={{ width: 12, height: 12, color: 'var(--text-muted)' }}></i>
              </button>
            )}
            {isAgentTool && (
              <button type="button" onClick={() => setMenu(m => (m === 'mode' ? null : 'mode'))} title="Plan first, or build straight away" style={aihChip}>
                <i data-lucide={mode === 'plan' ? 'list-checks' : 'wand-sparkles'} style={{ width: 12, height: 12, color: 'var(--text-muted)' }}></i>
                <span>{mode === 'plan' ? 'Plan' : 'Build'}</span>
                <i data-lucide="chevron-down" style={{ width: 12, height: 12, color: 'var(--text-muted)' }}></i>
              </button>
            )}
            <button type="button" onClick={() => setMenu(m => (m === 'effort' ? null : 'effort'))} title="Effort — how much context and which model" style={{ ...aihChip, marginLeft: 'auto' }}>
              <i data-lucide="gauge" style={{ width: 12, height: 12, color: 'var(--text-muted)' }}></i>
              <span>{activeEffort ? activeEffort.name : 'Medium'}</span>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{aihFmtTokens(cost)}</span>
              <i data-lucide="chevron-down" style={{ width: 12, height: 12, color: 'var(--text-muted)' }}></i>
            </button>
          </div>

          {overLimit && (
            <div style={{ fontSize: 11.5, color: 'var(--red-base)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i data-lucide="alert-triangle" style={{ width: 13, height: 13 }}></i>
              Out of tokens — ask an admin to reset or raise your limit.
            </div>
          )}
          {/* Attached references, with a thumbnail so it's obvious WHAT is going to the model. */}
          {!!attached.length && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {attached.map((im, i) => (
                <div key={i} title={im.name + ' · ' + im.w + '×' + im.h} style={aihThumb}>
                  <img src={im.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => removeImage(i)} title="Remove" style={aihThumbX}>
                    <i data-lucide="x" style={{ width: 10, height: 10 }}></i>
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea ref={taRef} value={input} rows={1}
            placeholder={overLimit ? 'Token limit reached'
              : dragOver ? 'Drop the image here…'
              : (mode === 'plan' && isAgentTool ? 'Describe what to plan…' : 'Ask ' + (activeTool ? activeTool.name : 'the AI Helper') + '… (paste an image)')}
            onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} onPaste={onPaste}
            onDragOver={onDragOver} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            style={{ ...aihTextarea, borderColor: dragOver ? 'var(--blue-base)' : aihTextarea.borderColor }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { addImages(Array.from(e.target.files || [])); e.target.value = ''; }} />
              <button type="button" onClick={() => fileRef.current && fileRef.current.click()}
                disabled={attached.length >= AIH_MAX_IMAGES}
                title={attached.length >= AIH_MAX_IMAGES ? 'Two images is the limit' : 'Attach a reference image'}
                onMouseEnter={e => hoverBtn(e, true)} onMouseLeave={e => hoverBtn(e, false)}
                style={{ ...aihIconBtn, width: 24, height: 24, opacity: attached.length >= AIH_MAX_IMAGES ? 0.4 : 1 }}>
                <i data-lucide="image-plus" style={{ width: 13, height: 13 }}></i>
              </button>
              <span style={{ fontSize: 10.5, color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {imgBusy ? 'Reading image…' : 'Enter to send · paste or drop an image'}
              </span>
            </span>
            {sending ? (
              <Button variant="outline" size="sm" onClick={stop} iconLeft={<i data-lucide="square"></i>}>Stop</Button>
            ) : (
              <Button variant="solid" size="sm" onClick={() => send()} disabled={(!input.trim() && !attached.length) || overLimit || imgBusy}
                iconLeft={<i data-lucide="send"></i>}>Send</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
window.AIHelper = AIHelper;
