// One error type shared by every model transport (geminis.js, groq.js) and by the router that chains
// them (ai_provider.js). It lives in its own file so the transports and the router can all require it
// without a cycle.
//
// The three flags are the whole point — they're what the layers above read to decide what to do next,
// so a transport classifies its own faults once and nothing downstream has to sniff message strings:
//
//   retryable — the same key might succeed on a second attempt (a blip, a 5xx, a timeout).
//   rotatable — this KEY is the problem, not the request. Worth the same call on the pool's next key.
//               Only rate limits and quota exhaustion qualify.
//   failover  — another PROVIDER might succeed. Availability faults qualify; request faults do not.
//
// The distinction that matters: a malformed request or a safety refusal fails identically on every key
// and every provider, so retrying either one just burns the pool and delays the error the user needs.
class ModelError extends Error {
  constructor(message, status, opts) {
    super(message);
    const o = opts || {};
    this.name = 'ModelError';
    this.status = status || 502;
    this.provider = o.provider || '';
    this.retryable = !!o.retryable;
    this.rotatable = !!o.rotatable;
    this.failover = !!o.failover;
  }
}

module.exports = { ModelError };
