// AI Helper tool catalog — the single source of truth for the design-assistance tools, their fixed
// per-use token costs, and the prompt framing each one prepends to the user's message. Shared by the
// /api/ai routes (cost enforcement) and returned to the editor client (which applies the framing,
// since the webhook call is a direct browser fetch). Keep `id`s stable — they're stored in ai_usage.

// The agent's prompt lives client-side (AIHelper.jsx AIH_AGENT_PROMPT) since it needs the live editor
// state appended per message; the server entry only needs id/cost/metadata for catalog + enforcement.
const AI_TOOLS = [
  {
    id: 'agent', name: 'Design Agent', icon: 'wand-sparkles', cost: 12000, mode: 'agent',
    description: 'Builds & edits on your canvas',
    prompt: '',
  },
  {
    id: 'layout', name: 'Layout Assistant', icon: 'layout-template', cost: 8000,
    description: 'Structure pages, sections & grids',
    prompt: 'You are a senior UI layout designer. Propose a concrete, well-structured layout (sections, visual hierarchy, spacing and grid/columns) for the request below. Be specific and practical, and explain the reasoning briefly.\n\nRequest: ',
  },
  {
    id: 'color', name: 'Color Palette', icon: 'palette', cost: 6000,
    description: 'Generate & refine color schemes',
    prompt: 'You are a senior product designer specializing in color. Suggest a cohesive, accessible color palette with hex values and where each color should be used (background, surface, text, accent, states). Keep it practical.\n\nRequest: ',
  },
  {
    id: 'copy', name: 'Copywriting', icon: 'pen-line', cost: 5000,
    description: 'Headlines, microcopy & CTAs',
    prompt: 'You are a UX writer. Write clear, on-brand copy (headlines, subheads, button labels, microcopy) for the request below. Offer a couple of tone variations when useful.\n\nRequest: ',
  },
  {
    id: 'component', name: 'Component Advisor', icon: 'blocks', cost: 5000,
    description: 'Recommend components & patterns',
    prompt: 'You are a design-systems expert. Recommend the right UI components and interaction patterns for the request below, note trade-offs, and mention any relevant states/variants.\n\nRequest: ',
  },
  {
    id: 'a11y', name: 'Accessibility Check', icon: 'accessibility', cost: 7000,
    description: 'Review for a11y issues',
    prompt: 'You are an accessibility (WCAG) specialist. Review the request below for accessibility issues (contrast, focus order, labels, keyboard, ARIA, motion) and give concrete, prioritized fixes.\n\nRequest: ',
  },
  {
    id: 'responsive', name: 'Responsive Advisor', icon: 'smartphone', cost: 6000,
    description: 'Breakpoints & adaptive layout',
    prompt: 'You are a responsive-design expert. Advise how the request below should adapt across desktop, tablet and mobile — breakpoints, what reflows/stacks/hides, and touch considerations.\n\nRequest: ',
  },
  {
    id: 'motion', name: 'Animation Ideas', icon: 'sparkles', cost: 5000,
    description: 'Motion & interaction suggestions',
    prompt: 'You are a motion designer. Suggest tasteful animation and micro-interaction ideas for the request below — triggers, easing, duration and purpose. Keep it subtle and performant.\n\nRequest: ',
  },
  {
    id: 'critique', name: 'Design Critique', icon: 'search-check', cost: 9000,
    description: 'Structured feedback on a design',
    prompt: 'You are a design critique partner. Give structured, actionable feedback on the design described below — what works, what to improve, and specific next steps. Be honest but constructive.\n\nRequest: ',
  },
  {
    id: 'chat', name: 'General Chat', icon: 'message-circle', cost: 3000,
    description: 'Ask anything about your design',
    prompt: '',
  },
];

const DEFAULT_TOOL_ID = 'chat';

// Effort levels scale how much editor context the client ships, which model the server picks, and what
// the call costs. `scope` is read by the editor (App.jsx agentApi.getContext) to decide how much of the
// design to serialize; `mult` scales the tool's base cost (server-authoritative).
//
// NOTE: `model` is documentation only, and deliberately NOT the real mapping — the client never sends a
// model name, so a crafted request can't select an arbitrary (expensive) one. Each transport maps
// `effort` -> model itself (geminis.js EFFORT_MODEL, groq.js EFFORT_MODEL), which is also why the real
// model depends on which provider ends up serving the call (see ai_provider.js).
// `rounds` is the review budget: how many times the critic may send the spec back to be improved
// before it is built. This is what "more effort" actually buys — the same stages, run harder, with the
// critic as the main agent deciding when the spec is good enough. 0 skips review entirely.
//
// `scope` must stay one of low|medium|high — it is read by App.jsx buildAgentContext, which only knows
// those three. Max and Extreme therefore ship the same (richest) context as High and spend their extra
// budget on review rounds instead, which is the lever that actually changes the result.
const AI_EFFORTS = [
  { id: 'low', name: 'Low', scope: 'low', mult: 0.5, rounds: 0,
    description: 'Selection only · no review · fastest & cheapest' },
  { id: 'medium', name: 'Medium', scope: 'medium', mult: 1, rounds: 1,
    description: 'Current page · one review pass · balanced' },
  { id: 'high', name: 'High', scope: 'high', mult: 1.75, rounds: 1,
    description: 'Page + variables & workflows · one review pass' },
  { id: 'max', name: 'Max', scope: 'high', mult: 3, rounds: 2,
    description: 'Two review passes · slower, more polished' },
  { id: 'extreme', name: 'Extreme', scope: 'high', mult: 5, rounds: 4,
    description: 'Reviews until the critic approves · slowest, best result' },
];
const DEFAULT_EFFORT_ID = 'medium';

function toolById(id) {
  return AI_TOOLS.find(t => t.id === id) || null;
}
function effortById(id) {
  return AI_EFFORTS.find(e => e.id === id) || null;
}
// What a tool actually costs at a given effort.
function costFor(tool, effort) {
  return Math.round(tool.cost * (effort ? effort.mult : 1));
}

module.exports = { AI_TOOLS, DEFAULT_TOOL_ID, toolById, AI_EFFORTS, DEFAULT_EFFORT_ID, effortById, costFor };
