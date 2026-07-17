// Provider router — the one entry point routes/ai.js calls to get text out of a model. Owns the
// fallback chain across providers; each transport (geminis.js, groq.js) owns rotation across its own
// key pool. Two independent layers, so a turn survives an exhausted key, an exhausted account, or a
// provider outage without any of them knowing about the others.
//
//   generate() -> gemini: key1 -> key2 -> ... -> key8   (rotate: rate-limited / out of quota)
//              -> groq:   key1 -> key2 -> ... -> key8   (failover: gemini can't serve this at all)
//
// Groq second by default because Gemini is the better model for this work; Groq is the safety net —
// and a good one, since the stage prompts were originally tuned against its llama models under n8n.
// Reorder with AI_PROVIDER_ORDER=groq,gemini to make Groq primary (useful while Gemini quota is dry).

const { ModelError } = require('./ai_errors');
const gemini = require('./geminis');
const groq = require('./groq');

const ALL = { gemini: gemini, groq: groq };
const DEFAULT_ORDER = ['gemini', 'groq'];

function order() {
  const raw = String(process.env.AI_PROVIDER_ORDER || '').trim();
  const names = raw ? raw.split(',').map(s => s.trim().toLowerCase()).filter(n => ALL[n]) : DEFAULT_ORDER;
  return (names.length ? names : DEFAULT_ORDER).map(n => ALL[n]);
}

// Only the providers that actually have keys. A provider with an empty pool isn't "down", it's just
// not configured — skipping it here keeps it out of the error the user eventually sees.
function chain() {
  return order().filter(p => p.hasKey());
}

function configured() {
  return chain().length > 0;
}

// A snapshot for diagnostics / health, with no key material in it.
function status() {
  return order().map(p => ({
    provider: p.NAME,
    keys: p.keyCount(),
    models: { low: p.modelForEffort('low'), medium: p.modelForEffort('medium'), high: p.modelForEffort('high') },
  }));
}

// Run a generation against the first provider that can serve it, falling forward on availability
// faults. Returns the transport's result plus which provider answered; throws the LAST error when the
// whole chain is spent, so the user sees the real reason (usually a 429) rather than a generic 502.
//
// opts: { effort, system, message | contents, temperature, maxOutputTokens, thinkingLevel, search, signal, timeoutMs }
// `thinkingLevel` and `search` are Gemini-only; groq.js accepts and ignores them, so callers stay
// provider-agnostic and stage config doesn't need a per-provider branch.
async function generate(opts) {
  const o = opts || {};
  const providers = chain();
  if (!providers.length) throw new ModelError('The AI is not configured on this server.', 503, {});

  let last = null;
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    try {
      const out = await p.generate(o);
      if (i > 0) console.warn('[ai] served by fallback provider ' + p.NAME);
      return out;
    } catch (e) {
      last = e;
      // Stop the chain on anything the next provider would fail at too: a malformed request, a safety
      // refusal, or the user cancelling. Only availability faults are worth another provider.
      if (!(e instanceof ModelError) || !e.failover) throw e;
      if (i < providers.length - 1) {
        console.warn('[ai] ' + p.NAME + ' unavailable (' + e.status + ': ' + e.message + ') — falling over to ' + providers[i + 1].NAME);
      }
    }
  }
  throw last;
}

module.exports = { generate, status, configured, chain, order, ALL };
