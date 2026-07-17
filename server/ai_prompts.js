// The AI Helper's stage prompts + per-stage model config. The Design Agent runs as a pipeline of
// narrow stages rather than one call, because splitting reasoning from JSON emission is what stopped
// the overlapping, default-sized output the panel started with (see AIHelper.jsx:16-20). Each stage
// gets its own system prompt, its own thinking budget, and only the inputs it actually needs.
//
// The prompt TEXT lives in ./prompts/*.txt, not in template literals here, for one concrete reason:
// implement.txt contains a ```lattice fence, and backticks and ${ inside a JS template literal either
// break the file or silently interpolate. A .txt file has no escaping hazard — paste and go. Dockerfile
// COPYs the whole tree, so they ship to Render and Docker with no extra wiring.

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'prompts');
function load(name) {
  try {
    return fs.readFileSync(path.join(DIR, name + '.txt'), 'utf8').trim();
  } catch (e) {
    console.error('[ai_prompts] missing prompt file: ' + name + '.txt');
    return '';
  }
}

// Two independent axes, deliberately:
//   effort -> model      (how much the user asked to spend; owned by the transports)
//   stage  -> thinking   (what this stage's job actually needs; owned here)
//
// `thinkingLevel` matters more than it looks. Measured on gemini-3.5-flash: thinking is ON by default
// and burns ~639 tokens on a trivial prompt, drawn OUT of maxOutputTokens. 'minimal' measures 0. So the
// stage that emits the largest JSON (implement) pins minimal thinking and takes the biggest budget —
// it is transcribing a finished plan, not reasoning. prepare is the opposite: it does the design
// thinking, so it is the one stage that earns a real thinking allowance.
//
// `inputs` is the whitelist composeUser() emits. It keeps each request to what the stage reads, which
// also bounds the payload — editor_state is by far the biggest field and only 3 stages need it.
//
// `useHistory:false` on audit is REQUIRED, not cosmetic: the client caches the audit against a hash of
// editor_state (AIHelper.jsx:576-588). If prior turns could change the audit's output, that cache would
// serve wrong results. Audit must stay a pure function of the canvas.
const AI_STAGES = {
  // `images: true` is the ONLY stage that gets the rendered canvas. It is the stage whose job is "what
  // is on the canvas", and everything downstream reads its words — so paying image tokens on the other
  // four would buy nothing. It is also why the audit's report must now describe FIT: the picture is the
  // only place in the pipeline where a section hanging off the artboard is directly observable.
  audit: {
    system: load('audit'), inputs: ['message', 'editor_state'], images: true,
    maxOutputTokens: 2048, thinkingLevel: 'minimal', temperature: 0.1, useHistory: false,
  },
  // `images` here on: the USER's reference screenshots ("build this", "why is this wrong"). Distinct
  // from the audit's image, which is the rendered canvas — they are kept on separate stages so neither
  // ever has to be labelled and no stage can mistake a reference for the user's own design.
  analyze: {
    system: load('analyze'), inputs: ['message', 'editor_state', 'audit'], images: true,
    maxOutputTokens: 2048, thinkingLevel: 'low', temperature: 0.2, useHistory: true,
  },
  // `analysis` here so the brief is researched for what is actually being built, not just the raw ask.
  research: {
    system: load('research'), inputs: ['message', 'audit', 'analysis'],
    maxOutputTokens: 2048, thinkingLevel: 'low', temperature: 0.4, useHistory: false, search: true,
  },
  prepare: {
    system: load('prepare'), inputs: ['message', 'editor_state', 'audit', 'style', 'analysis', 'prev_spec', 'critique', 'lessons'], images: true,
    maxOutputTokens: 8192, thinkingLevel: 'low', temperature: 0.3, useHistory: false,
  },
  // `style` so the critic can hold the spec against the palette/type ramp it was supposed to use —
  // without it, "body text fails contrast" is unjudgeable.
  critique: {
    system: load('critique'), inputs: ['message', 'audit', 'analysis', 'style', 'spec'],
    maxOutputTokens: 2048, thinkingLevel: 'low', temperature: 0.2, useHistory: false,
  },
  // `audit` + `style` so the transcriber knows the real ids already on the canvas and the palette it
  // must hit. The spec restates the palette, but a second source costs ~200 tokens and removes the
  // failure where implement invents its own colours.
  // `lessons` is LAST on purpose. composeUser emits sections in `inputs` order, so this lands closest
  // to the point of generation — a weak model follows a corrective it just read far more reliably than
  // one buried above a 40-node canvas dump.
  implement: {
    system: load('implement'), inputs: ['message', 'editor_state', 'audit', 'style', 'spec', 'lessons'], images: true,
    maxOutputTokens: 32768, thinkingLevel: 'minimal', temperature: 0.15, useHistory: true,
  },
};

// The label each input gets in the composed user message. The stage prompts refer to these section
// names verbatim ("the CANVAS section below"), so renaming one here silently breaks a prompt.
const SECTION = {
  message: 'REQUEST',
  editor_state: 'CANVAS (editor state, JSON)',
  audit: 'AUDIT (what is on the canvas now)',
  style: 'STYLE BRIEF',
  analysis: 'ANALYSIS (what the user wants)',
  spec: 'SPEC (build exactly this)',
  prev_spec: 'PREVIOUS SPEC (revise this)',
  critique: 'CRITIQUE (fix exactly these)',
  lessons: 'LESSONS (mistakes you have made on this editor before)',
};

function stageById(id) {
  return Object.prototype.hasOwnProperty.call(AI_STAGES, id) ? AI_STAGES[id] : null;
}

// Build the user message for a stage: only the sections it declares, only the ones that arrived with
// content. Under n8n these were injected by each workflow's own System Message; now they are labelled
// sections in one composed message, which is why the prompts say "the ## CANVAS section below".
function composeUser(stageId, payload) {
  const st = stageById(stageId);
  if (!st) return String((payload && payload.message) || '');
  const p = payload || {};
  const parts = [];
  for (let i = 0; i < st.inputs.length; i++) {
    const key = st.inputs[i];
    const val = p[key];
    if (val == null || String(val).trim() === '') continue;
    parts.push('## ' + (SECTION[key] || key.toUpperCase()) + '\n' + String(val).trim());
  }
  return parts.join('\n\n');
}

module.exports = { AI_STAGES, stageById, composeUser, SECTION };
