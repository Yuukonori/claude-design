// Google Gemini transport. Deliberately dumb: it knows Gemini's wire format and its own key pool, and
// nothing else — server/ai_prompts.js owns the stages, server/ai_provider.js owns provider fallback,
// routes/ai.js composes them. Raw fetch, no SDK — matching routes/proxy.js: AbortController timeout,
// tolerant JSON parse, and never leaking upstream detail to the caller.
//
// Exposes the same shape as server/groq.js (NAME, hasKey, keyCount, modelForEffort, generate) so the
// router can treat the two interchangeably.

const { ModelError } = require('./ai_errors');

const NAME = 'gemini';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const TIMEOUT_MS = +(process.env.GEMINI_TIMEOUT_MS || 60000); // a thinking model needs longer than proxy.js's 15s
const ENABLE_SEARCH = String(process.env.GEMINI_ENABLE_SEARCH || 'true') !== 'false';

// A pool of API keys, from either GEMINI_API_KEY (one, or several comma-separated) or GEMINI_API_KEY_1..N.
// One agent turn is 7 sequential calls, which is enough to trip a free-tier per-minute limit on its own;
// spreading those calls over several keys buys headroom.
//
// IMPORTANT: Gemini's free quota is metered per *project*, not per key. Keys minted inside one project
// share a single bucket, so rotating them changes nothing — the pool only multiplies quota when each key
// belongs to a different project/account. Rotation is still correct with one key; it just no-ops.
function loadKeys() {
  const out = [];
  const add = (v) => String(v || '').split(',').map(s => s.trim()).filter(Boolean)
    .forEach(k => { if (out.indexOf(k) < 0) out.push(k); }); // de-duped: the same key twice would double its own rate
  add(process.env.GEMINI_API_KEY);
  for (let i = 1; i <= 20; i++) add(process.env['GEMINI_API_KEY_' + i]);
  return out;
}
const KEYS = loadKeys();

// effort -> model. Server-authoritative on purpose: the client never sends a model name, so a crafted
// request can't select an arbitrary (expensive) one. The env overrides let this be retuned without a
// code change. Both models below accept the same generationConfig.thinkingConfig shape, so there is no
// per-model branching to do here — but note their DEFAULTS differ: 3.5-flash thinks unless told not to,
// 3.1-flash-lite does not think unless asked. Stage config sets thinkingLevel explicitly rather than
// relying on either default.
const EFFORT_MODEL = {
  low: process.env.GEMINI_MODEL_LOW || 'gemini-3.1-flash-lite',
  medium: process.env.GEMINI_MODEL_MEDIUM || 'gemini-3.5-flash',
  high: process.env.GEMINI_MODEL_HIGH || 'gemini-3.5-flash',
};
const DEFAULT_MODEL = EFFORT_MODEL.medium;

// Round-robin so load spreads evenly rather than hammering key 1 until it 429s. Module-scoped: the
// cursor is per-process, which is all we need — Render runs a single instance.
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

// Accept either a plain string or [{ role:'user'|'model'|'assistant', text, images }] and emit Gemini's
// contents[]. 'assistant' is normalized to 'model' so callers can pass chat-shaped history directly.
// `images` is [{ mimeType, data(base64) }] and becomes inlineData parts — every Gemini model configured
// here is multimodal, so no capability check is needed on this transport.
function toContents(contents, message) {
  if (Array.isArray(contents) && contents.length) {
    const out = [];
    for (let i = 0; i < contents.length; i++) {
      const c = contents[i] || {};
      const text = typeof c === 'string' ? c : c.text;
      if (typeof text !== 'string' || !text.trim()) continue;
      const role = (c.role === 'model' || c.role === 'assistant') ? 'model' : 'user';
      const parts = [{ text: text }];
      // Image BEFORE text: Gemini attends better when the media precedes the question about it, and
      // the audit prompt is exactly "describe what you see here".
      const ims = (typeof c === 'object' && Array.isArray(c.images)) ? c.images : [];
      for (let k = 0; k < ims.length; k++) {
        const im = ims[k];
        if (!im || !im.data || !im.mimeType) continue;
        parts.unshift({ inlineData: { mimeType: String(im.mimeType), data: String(im.data) } });
      }
      out.push({ role: role, parts: parts });
    }
    if (out.length) return out;
  }
  return [{ role: 'user', parts: [{ text: String(message == null ? '' : message) }] }];
}

// Pull the reply out of a candidate. Two rules here are load-bearing and easy to get wrong:
//   - thought-summary parts (`part.thought`) must be dropped, or they contaminate the text the client
//     pattern-matches on (AIHelper's `APPROVED` exact match and its SCOPE: regex).
//   - MAX_TOKENS *with* text is NOT an error — AIHelper.aihSalvageActions exists to rescue a truncated
//     action block, and treating it as a failure silently throws that recovery away.
function extractReply(data) {
  const fb = data && data.promptFeedback;
  if (fb && fb.blockReason) {
    // The input itself was refused. Not a failover: routing a blocked prompt to another provider is
    // safety-shopping, and it would fail the same way on any well-behaved one.
    throw err('The AI blocked this request (' + String(fb.blockReason).toLowerCase() + ').', 400);
  }
  const cand = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
  if (!cand) throw err('The AI returned no response.', 502, { retryable: true, failover: true });

  const parts = (cand.content && Array.isArray(cand.content.parts)) ? cand.content.parts : [];
  let text = '';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p && typeof p.text === 'string' && !p.thought) text += p.text;
  }
  const reason = cand.finishReason || '';

  if (text.trim()) {
    // Truncated but usable. Flag it so the caller can log it; the client salvages what it can.
    return { text: text, finishReason: reason, truncated: reason === 'MAX_TOKENS' };
  }
  if (reason === 'MAX_TOKENS') {
    // Empty *and* out of budget means thinking consumed the whole allowance before any answer was
    // written — thinking tokens are drawn from maxOutputTokens. Name the fix, it isn't guessable.
    // Worth a failover: Groq's models don't think, so they have no way to hit this.
    throw err('The AI used its whole output budget on thinking and wrote nothing — raise maxOutputTokens or lower the thinking level for this stage.', 502, { failover: true });
  }
  if (reason === 'SAFETY' || reason === 'RECITATION' || reason === 'PROHIBITED_CONTENT') {
    throw err('The AI stopped before answering (' + String(reason).toLowerCase() + ').', 400);
  }
  throw err('The AI returned an empty reply.', 502, { retryable: true, failover: true });
}

// Upstream status -> what we tell the caller. The 429 text must keep the words "rate limit": the
// editor's aihFriendlyError regex-matches on it to show the actionable message rather than a generic one.
function upstreamError(status, detail) {
  if (status === 413) {
    // Same class as Groq's 413: the request exceeds a per-minute token budget on its own. Keep the
    // words "too large" so the editor's aihFriendlyError shows the drop-Effort advice.
    return err('The request was too large for the AI provider\'s per-minute token limit — drop Effort to Low.', 429, { rotatable: true, failover: true });
  }
  if (status === 429) {
    return err('The AI rate limit was hit — wait a moment and try again, or drop Effort to Low.', 429, { retryable: true, rotatable: true, failover: true });
  }
  if (status === 400) return err('The AI rejected the request.', 502); // our bug: same on every key and provider
  if (status === 401 || status === 403) {
    // Always rotatable. A rejected credential is per-key BY DEFINITION — whether it's a typo'd key, a
    // revoked one, or a banned project, the pool's other keys are unaffected. (An earlier version only
    // rotated when the detail mentioned quota; one invalid key in a pool of eight then killed every
    // request that touched it, instead of being skipped.) If all of them are bad we spend one cheap
    // failed call each and surface the same error anyway.
    return err('The AI credentials were rejected.', 502, { rotatable: true, failover: true });
  }
  if (status >= 500) return err('The AI service is temporarily unavailable.', 502, { retryable: true, failover: true });
  return err('The AI request failed.', 502, { failover: true });
}

// A single attempt against one key. Split out of generate() so the key-rotation loop below has
// something to retry — everything here is per-attempt, including the timeout.
async function callOnce(key, keyIdx, model, body, o) {
  // Our own timeout, plus the caller's cancellation (the user hitting Stop) folded into one signal.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs || TIMEOUT_MS);
  const onCallerAbort = () => ctrl.abort();
  if (o.signal) {
    if (o.signal.aborted) ctrl.abort();
    else o.signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  let r, text;
  try {
    r = await fetch(API_ROOT + '/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      // The key rides in a header, not ?key= — a key in a URL leaks into error strings and access logs.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    text = await r.text();
  } catch (e) {
    if (e && e.name === 'AbortError') {
      // A user cancellation must never rotate or fail over — they asked us to stop, so stop.
      if (o.signal && o.signal.aborted) throw err('The AI request was cancelled.', 504);
      throw err('The AI request timed out.', 504, { retryable: true, failover: true });
    }
    throw err('Could not reach the AI service.', 502, { retryable: true, failover: true });
  } finally {
    clearTimeout(timer);
    if (o.signal) o.signal.removeEventListener('abort', onCallerAbort);
  }

  let data = text;
  try { data = JSON.parse(text); } catch (e) { /* non-JSON body — handled below */ }

  if (!r.ok) {
    const detail = (data && data.error && data.error.message) ? data.error.message : String(text).slice(0, 200);
    // Log the key by index, never its value.
    console.error('[gemini] ' + r.status + ' ' + model + ' key#' + (keyIdx + 1) + ' — ' + detail);
    throw upstreamError(r.status, detail);
  }
  if (!data || typeof data !== 'object') throw err('The AI returned an unreadable response.', 502, { retryable: true, failover: true });

  const out = extractReply(data);
  const um = data.usageMetadata || {};
  out.usage = {
    prompt: um.promptTokenCount || 0,
    output: um.candidatesTokenCount || 0,
    thoughts: um.thoughtsTokenCount || 0,
    total: um.totalTokenCount || 0,
  };
  out.model = model;
  out.provider = NAME;
  out.keyIndex = keyIdx;
  return out;
}

// Try the same request across the key pool, starting at the next cursor position. Only rotatable
// faults advance: a malformed request or a safety block fails the same way on every key.
async function attemptPool(model, body, o) {
  const start = nextKeyIndex();
  let last = null;
  for (let n = 0; n < KEYS.length; n++) {
    const idx = (start + n) % KEYS.length;
    try {
      return await callOnce(KEYS[idx], idx, model, body, o);
    } catch (e) {
      last = e;
      if (!(e instanceof ModelError) || !e.rotatable) throw e; // not the key's fault — don't burn the pool
      if (n < KEYS.length - 1) console.warn('[gemini] key#' + (idx + 1) + ' unusable, trying key#' + (((idx + 1) % KEYS.length) + 1));
    }
  }
  throw last;
}

// One generation. Returns { text, finishReason, truncated, usage, model, provider } or throws ModelError.
async function generate(opts) {
  const o = opts || {};
  if (!KEYS.length) throw err('The AI is not configured on this server.', 503, { failover: true });

  const model = o.model || modelForEffort(o.effort);
  const gen = {};
  if (typeof o.temperature === 'number') gen.temperature = o.temperature;
  if (o.maxOutputTokens) gen.maxOutputTokens = o.maxOutputTokens;
  // Thinking is nested under generationConfig.thinkingConfig — NOT a bare generationConfig.thinkingLevel,
  // which the API rejects outright ('Unknown name "thinkingLevel" at generation_config'). Measured on
  // gemini-3.5-flash: no config => 639 thought tokens on a trivial prompt; thinkingLevel 'minimal' => 0;
  // 'low' => ~506. Those tokens come out of maxOutputTokens, so leaving this unset on a stage with a
  // tight budget is what produces an empty MAX_TOKENS reply.
  if (o.thinkingLevel) gen.thinkingConfig = { thinkingLevel: o.thinkingLevel };

  const body = { contents: toContents(o.contents, o.message) };
  if (o.system) body.systemInstruction = { parts: [{ text: String(o.system) }] };
  if (Object.keys(gen).length) body.generationConfig = gen;
  // `search` is the provider-neutral flag the router passes; only Gemini can honour it.
  if (o.search && ENABLE_SEARCH) body.tools = [{ googleSearch: {} }];

  try {
    return await attemptPool(model, body, o);
  } catch (e) {
    // Search grounding is metered SEPARATELY from generation, and its free quota is small — so a
    // grounded call can 429 on every key while plain generation is fine. Dropping the tool and
    // retrying is strictly better than failing: the research stage is an enhancer the pipeline already
    // tolerates coming back empty, so a grounded answer is a bonus and an ungrounded one still works.
    if (body.tools && e instanceof ModelError && e.rotatable) {
      console.warn('[gemini] search grounding unavailable (' + e.status + ') — retrying without it');
      delete body.tools;
      return await attemptPool(model, body, o);
    }
    // Every key is spent. Marked failover so the router can try another provider; if there isn't one,
    // the 429 surfaces and the editor shows its wait-and-retry message.
    throw e;
  }
}

// Which models a key can actually reach. Used to sanity-check configuration rather than trust a
// hardcoded list — free-tier access varies by key and the lineup moves. Defaults to the first key;
// pass an index to audit a specific one (keys from different projects can differ in what they expose).
async function listModels(keyIdx) {
  if (!KEYS.length) throw err('The AI is not configured on this server.', 503);
  const key = KEYS[keyIdx || 0] || KEYS[0];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(API_ROOT + '/models', { headers: { 'x-goog-api-key': key }, signal: ctrl.signal });
    const text = await r.text();
    let data = text;
    try { data = JSON.parse(text); } catch (e) {}
    if (!r.ok) throw upstreamError(r.status, (data && data.error && data.error.message) || '');
    return (data && Array.isArray(data.models) ? data.models : []).map(m => ({
      name: String(m.name || '').replace(/^models\//, ''),
      methods: m.supportedGenerationMethods || [],
      inputLimit: m.inputTokenLimit,
      outputLimit: m.outputTokenLimit,
    }));
  } catch (e) {
    if (e instanceof ModelError) throw e;
    if (e && e.name === 'AbortError') throw err('The AI request timed out.', 504, { retryable: true });
    throw err('Could not reach the AI service.', 502, { retryable: true });
  } finally {
    clearTimeout(timer);
  }
}

// extractReply is exported for its own sake: it's a pure function over a response body, and the two
// rules it encodes (drop thought parts; MAX_TOKENS-with-text is a truncation, not a failure) are the
// ones that break silently. Being able to assert them against fixtures beats discovering it live.
// `toContents` is exported for the same reason as extractReply: it encodes a contract with the wire
// format (image parts before text, roles normalized) that is worth testing without a live API key.
module.exports = { NAME, generate, listModels, modelForEffort, hasKey, keyCount, extractReply, toContents, EFFORT_MODEL, DEFAULT_MODEL };
