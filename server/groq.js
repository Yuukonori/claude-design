// Groq transport — the AI Helper's fallback provider. Same shape as server/geminis.js (NAME, hasKey,
// keyCount, modelForEffort, generate) so server/ai_provider.js can treat the two interchangeably.
//
// Groq is a first-class fallback here rather than a downgrade: the AI Helper's stage prompts were
// written and tuned against these exact llama models when the pipeline ran through n8n (the mapping
// below is the one ai_tools.js documented), so a turn that fails over still meets the stage contracts.
//
// Wire format is OpenAI's chat/completions, not Gemini's generateContent — hence a separate transport
// rather than a shared one with a flag. Raw fetch, no SDK, matching routes/proxy.js house style.

const { ModelError } = require('./ai_errors');

const NAME = 'groq';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS_URL = 'https://api.groq.com/openai/v1/models';
const TIMEOUT_MS = +(process.env.GROQ_TIMEOUT_MS || 60000);

// Groq bills the RESERVED max_tokens against the per-minute token budget, not what the reply actually
// uses — so asking for a big ceiling "just in case" is not free here the way it is on Gemini. The free
// tier allows 12k TPM, and the implement stage's 32k budget (sized for Gemini's 65k output limit) is
// rejected outright with a 413 before the model runs. Clamp to something the tier can actually serve:
// measured implement output is ~2.6k tokens, so 8k is generous and still leaves room for the prompt.
const MAX_OUTPUT = +(process.env.GROQ_MAX_OUTPUT || 8000);

// Same pooling rules as geminis.js: GROQ_API_KEY (single or comma-separated) and/or GROQ_API_KEY_1..N.
// Groq's free tier meters per *account*, so — unlike Gemini's per-project quota — several keys from one
// account share a bucket and rotation only helps across separate accounts.
function loadKeys() {
  const out = [];
  const add = (v) => String(v || '').split(',').map(s => s.trim()).filter(Boolean)
    .forEach(k => { if (out.indexOf(k) < 0) out.push(k); });
  add(process.env.GROQ_API_KEY);
  for (let i = 1; i <= 20; i++) add(process.env['GROQ_API_KEY_' + i]);
  return out;
}
const KEYS = loadKeys();

// effort -> model, server-authoritative for the same reason as Gemini's: the client never names a model.
// These are the models the n8n Groq node used (see the note in ai_tools.js), so the stage prompts are
// already tuned for them.
const EFFORT_MODEL = {
  low: process.env.GROQ_MODEL_LOW || 'llama-3.1-8b-instant',
  medium: process.env.GROQ_MODEL_MEDIUM || 'llama-3.3-70b-versatile',
  high: process.env.GROQ_MODEL_HIGH || 'llama-3.3-70b-versatile',
};
const DEFAULT_MODEL = EFFORT_MODEL.medium;

let keyCursor = 0;
function nextKeyIndex() {
  const i = keyCursor % (KEYS.length || 1);
  keyCursor = (keyCursor + 1) % (KEYS.length || 1);
  return i;
}

function hasKey() { return KEYS.length > 0; }
function keyCount() { return KEYS.length; }
function modelForEffort(effortId) { return EFFORT_MODEL[effortId] || DEFAULT_MODEL; }

function err(message, status, opts) {
  const o = opts || {};
  o.provider = NAME;
  return new ModelError(message, status, o);
}

// Whether a Groq model can accept image parts. The DEFAULTS HERE CANNOT: llama-3.1-8b-instant and
// llama-3.3-70b-versatile are text-only, and posting an image_url content array to one is a hard 400 —
// so a caller attaching a canvas image would break the Gemini→Groq fallback exactly when it is needed.
// Images are dropped for a model that can't see; the request still succeeds on the text, which is the
// right trade (the picture enriches the audit, it is not the whole audit). Vision-capable Groq models
// (llama-4-scout / llama-4-maverick and the like) carry it in the name, so match on that rather than
// pinning a list that goes stale on the next model swap.
function canSee(model) { return /llama-4|scout|maverick|vision|vl\b/i.test(String(model || '')); }

// Gemini's contents[] and a plain string both normalize to OpenAI messages[]. The system prompt is a
// leading message here rather than a separate field. `model` decides whether images survive.
function toMessages(system, contents, message, model) {
  const msgs = [];
  const vision = canSee(model);
  if (system) msgs.push({ role: 'system', content: String(system) });
  if (Array.isArray(contents) && contents.length) {
    for (let i = 0; i < contents.length; i++) {
      const c = contents[i] || {};
      const text = typeof c === 'string' ? c : c.text;
      if (typeof text !== 'string' || !text.trim()) continue;
      // 'model' is Gemini's word for it; OpenAI calls the same role 'assistant'.
      const role = (c.role === 'model' || c.role === 'assistant') ? 'assistant' : 'user';
      const ims = (vision && typeof c === 'object' && Array.isArray(c.images)) ? c.images : [];
      if (!ims.length) { msgs.push({ role: role, content: text }); continue; }
      const parts = [];
      for (let k = 0; k < ims.length; k++) {
        const im = ims[k];
        if (!im || !im.data || !im.mimeType) continue;
        parts.push({ type: 'image_url', image_url: { url: 'data:' + im.mimeType + ';base64,' + im.data } });
      }
      parts.push({ type: 'text', text: text });
      msgs.push({ role: role, content: parts });
    }
  }
  if (msgs.length === (system ? 1 : 0)) msgs.push({ role: 'user', content: String(message == null ? '' : message) });
  return msgs;
}

// Mirrors geminis.extractReply's contract exactly — same return shape, same rule that a length-capped
// reply WITH text is a truncation the client can salvage, not a failure.
function extractReply(data) {
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  if (!choice) throw err('The AI returned no response.', 502, { retryable: true, failover: true });

  const text = (choice.message && typeof choice.message.content === 'string') ? choice.message.content : '';
  const reason = choice.finish_reason || '';

  if (text.trim()) return { text: text, finishReason: reason, truncated: reason === 'length' };
  if (reason === 'length') throw err('The AI hit its output limit before writing anything — raise maxOutputTokens for this stage.', 502, { failover: true });
  if (reason === 'content_filter') throw err('The AI stopped before answering (content filter).', 400);
  throw err('The AI returned an empty reply.', 502, { retryable: true, failover: true });
}

function upstreamError(status, detail) {
  if (status === 413) {
    // "Request too large ... on tokens per minute (TPM): Limit 12000, Requested 34986". The request
    // exceeds the per-minute budget on its own, so it is not transient — but another key may sit in a
    // different org with its own budget, so it is still worth rotating. Keep the words "too large":
    // the editor's aihFriendlyError matches them to tell the user to drop Effort.
    return err('The request was too large for the AI provider\'s per-minute token limit — drop Effort to Low.', 429, { rotatable: true, failover: true });
  }
  if (status === 429) {
    // Groq's free tier caps tokens-per-minute, so a big editor_state trips this well before the
    // request count does. Keep the words "rate limit" — the editor's aihFriendlyError matches on them.
    return err('The AI rate limit was hit — wait a moment and try again, or drop Effort to Low.', 429, { retryable: true, rotatable: true, failover: true });
  }
  if (status === 400) return err('The AI rejected the request.', 502);
  if (status === 401 || status === 403) {
    // Rotatable for the same reason as geminis.js: a rejected credential is a fact about THIS key, so
    // the next one deserves a try. One typo'd key must not sink a request the other seven could serve.
    return err('The AI credentials were rejected.', 502, { rotatable: true, failover: true });
  }
  if (status >= 500) return err('The AI service is temporarily unavailable.', 502, { retryable: true, failover: true });
  return err('The AI request failed.', 502, { failover: true });
}

async function callOnce(key, keyIdx, model, body, o) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs || TIMEOUT_MS);
  const onCallerAbort = () => ctrl.abort();
  if (o.signal) {
    if (o.signal.aborted) ctrl.abort();
    else o.signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  let r, text;
  try {
    r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    text = await r.text();
  } catch (e) {
    if (e && e.name === 'AbortError') {
      if (o.signal && o.signal.aborted) throw err('The AI request was cancelled.', 504);
      throw err('The AI request timed out.', 504, { retryable: true, failover: true });
    }
    throw err('Could not reach the AI service.', 502, { retryable: true, failover: true });
  } finally {
    clearTimeout(timer);
    if (o.signal) o.signal.removeEventListener('abort', onCallerAbort);
  }

  let data = text;
  try { data = JSON.parse(text); } catch (e) {}

  if (!r.ok) {
    const detail = (data && data.error && data.error.message) ? data.error.message : String(text).slice(0, 200);
    console.error('[groq] ' + r.status + ' ' + model + ' key#' + (keyIdx + 1) + ' — ' + detail);
    throw upstreamError(r.status, detail);
  }
  if (!data || typeof data !== 'object') throw err('The AI returned an unreadable response.', 502, { retryable: true, failover: true });

  const out = extractReply(data);
  const u = data.usage || {};
  out.usage = {
    prompt: u.prompt_tokens || 0,
    output: u.completion_tokens || 0,
    thoughts: 0, // these models don't think — the field exists so both providers return one shape
    total: u.total_tokens || 0,
  };
  out.model = model;
  out.provider = NAME;
  out.keyIndex = keyIdx;
  return out;
}

// Same contract as geminis.generate. `thinkingLevel` and `search` are accepted and ignored: these
// models don't think, and Groq has no grounding tool. The research stage already degrades to model
// knowledge when search is unavailable, so dropping it silently is the documented behaviour.
async function generate(opts) {
  const o = opts || {};
  if (!KEYS.length) throw err('The AI is not configured on this server.', 503, { failover: true });

  const model = o.model || modelForEffort(o.effort);
  const body = { model: model, messages: toMessages(o.system, o.contents, o.message, model), stream: false };
  if (typeof o.temperature === 'number') body.temperature = o.temperature;
  // Clamped, not passed through — see MAX_OUTPUT. The stage configs are written for Gemini's ceiling.
  if (o.maxOutputTokens) body.max_tokens = Math.min(o.maxOutputTokens, MAX_OUTPUT);

  const start = nextKeyIndex();
  let last = null;
  for (let n = 0; n < KEYS.length; n++) {
    const idx = (start + n) % KEYS.length;
    try {
      return await callOnce(KEYS[idx], idx, model, body, o);
    } catch (e) {
      last = e;
      if (!(e instanceof ModelError) || !e.rotatable) throw e;
      if (n < KEYS.length - 1) console.warn('[groq] key#' + (idx + 1) + ' exhausted, trying key#' + (((idx + 1) % KEYS.length) + 1));
    }
  }
  throw last;
}

// Diagnostics only. Tries each key in turn rather than trusting KEYS[0]: one dead key at the front of
// the pool must not make the whole provider look unreachable.
async function listModels(keyIdx) {
  if (!KEYS.length) throw err('The AI is not configured on this server.', 503);
  let last = null;
  for (let n = 0; n < KEYS.length; n++) {
    try { return await listModelsWith(KEYS[(keyIdx || 0) + n] || KEYS[n]); }
    catch (e) { last = e; if (!(e instanceof ModelError) || !e.rotatable) throw e; }
  }
  throw last;
}
async function listModelsWith(key) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(MODELS_URL, { headers: { 'Authorization': 'Bearer ' + key }, signal: ctrl.signal });
    const text = await r.text();
    let data = text;
    try { data = JSON.parse(text); } catch (e) {}
    if (!r.ok) throw upstreamError(r.status, (data && data.error && data.error.message) || '');
    return (data && Array.isArray(data.data) ? data.data : []).map(m => ({
      name: m.id,
      methods: ['generateContent'],   // normalized to geminis.listModels' shape
      inputLimit: m.context_window,
      outputLimit: m.max_completion_tokens,
    }));
  } catch (e) {
    if (e instanceof ModelError) throw e;
    if (e && e.name === 'AbortError') throw err('The AI request timed out.', 504, { retryable: true });
    throw err('Could not reach the AI service.', 502, { retryable: true });
  } finally {
    clearTimeout(timer);
  }
}

// `toMessages`/`canSee` are exported to be testable without a key — canSee in particular decides
// whether an image is dropped or sent, and getting it wrong is a hard 400 on the fallback path.
module.exports = { NAME, generate, listModels, modelForEffort, hasKey, keyCount, extractReply, toMessages, canSee, EFFORT_MODEL, DEFAULT_MODEL };
