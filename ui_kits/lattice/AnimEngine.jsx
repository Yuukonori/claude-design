/* global window */
// Animation engine — the interpolation core shared by interaction-state animations, the timeline
// editor, the preview dock and page-level scene timelines. An animation is a set of per-property
// TRACKS; each track is a list of KEYS { t (ms), value, ease }. Sampling a track at time `t` finds
// the surrounding keys and eases between their values. Colours lerp in RGB; numbers lerp; anything
// non-interpolable steps. This module is pure (no React) so any surface can sample poses.

// Easing approximations (enough for JS scrubbing; CSS transitions handle static-state smoothing).
const EASE = {
  'linear': (u) => u,
  'ease-in': (u) => u * u,
  'ease-out': (u) => 1 - (1 - u) * (1 - u),
  'ease-in-out': (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
};
function applyEase(name, u) { const f = EASE[name] || EASE['ease-out']; return f(Math.max(0, Math.min(1, u))); }

// Props that interpolate as colours vs. those that can only step (discrete / structural).
const COLOR_PROPS = new Set(['fillColor', 'textColor', 'borderColor', 'textStrokeColor', 'chartColor', 'placeholderColor', 'btnIconColor', 'iconColor']);
const STEP_PROPS = new Set(['flipH', 'flipV', 'borderStyle', 'blendMode', 'radii', 'gradient', 'effects', 'textShadows', 'textGradient',
  'iconName', 'btnIcon', 'label', 'text', 'src',
  'variant', 'btnSize', 'btnIconPos', 'fullWidth', 'disabled', 'btnIconFlipH', 'btnIconFlipV', 'iconFlipH', 'iconFlipV']); // glyph/content/enum/bool swaps hold until their key, then flip

function lerpNum(a, b, u) { return a + (b - a) * u; }

// Parse a colour to {r,g,b}; returns null for tokens/gradients/named colours (→ caller steps).
function parseRGB(css) {
  if (typeof css !== 'string') return null;
  const s = css.trim();
  let m = s.match(/^#([0-9a-f]{3})$/i);
  if (m) { const h = m[1]; return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) }; }
  m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) { const h = m[1]; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) { const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2] }; }
  return null;
}
function lerpColor(a, b, u) {
  const ca = parseRGB(a), cb = parseRGB(b);
  if (!ca || !cb) return u < 0.5 ? a : b; // can't interpolate a token/gradient → step
  return `rgb(${Math.round(lerpNum(ca.r, cb.r, u))}, ${Math.round(lerpNum(ca.g, cb.g, u))}, ${Math.round(lerpNum(ca.b, cb.b, u))})`;
}
// Interpolate one property between two keyed values at eased fraction `u` (0..1).
function lerpVal(prop, a, b, u) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (COLOR_PROPS.has(prop)) return lerpColor(a, b, u);
  if (STEP_PROPS.has(prop)) return u < 1 ? a : b;
  const na = +a, nb = +b;
  if (!isNaN(na) && !isNaN(nb)) return lerpNum(na, nb, u);
  return u < 0.5 ? a : b;
}

// Value of one track at time `t` (clamped at the ends; segment eased by the *incoming* key's ease).
function sampleTrack(tr, t) {
  const keys = (tr.keys || []).slice().sort((a, b) => a.t - b.t);
  if (!keys.length) return undefined;
  if (t <= keys[0].t) return keys[0].value;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.value;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[i + 1];
  const span = b.t - a.t;
  const u = span > 0 ? (t - a.t) / span : 1;
  return lerpVal(tr.prop, a.value, b.value, applyEase(b.ease, u));
}
// Merge every track's sampled value into an override map { prop: value }.
function sampleTracks(tracks, t) {
  const out = {};
  (tracks || []).forEach(tr => { const v = sampleTrack(tr, t); if (v !== undefined) out[tr.prop] = v; });
  return out;
}

function tracksDuration(tracks) {
  let m = 0;
  (tracks || []).forEach(tr => (tr.keys || []).forEach(k => { if (k.t > m) m = k.t; }));
  return m;
}
// Total run time of an animation state: explicit `duration`, else the last keyframe time.
// A stored `duration` of 0 means "not set" — a zero-length animation is never intentional, and states
// migrated before they had any keys carry a 0 (see ensureTracks). TimelineEditor reads it the same way.
function stateDuration(state) {
  if (!state) return 0;
  if (state.duration) return state.duration;
  return tracksDuration(ensureTracks(state).tracks);
}

// --- Migration: legacy card "frames" (sequential whole-component poses) → per-property tracks -----
// A card's `dur` is the transition INTO it (AnimCanvas convention), so frame times are cumulative.
// For every prop that appears in any frame, emit a key at each frame time, carrying values forward.
function framesToTracks(frames) {
  frames = frames || [];
  if (!frames.length) return [];
  const times = []; let acc = 0;
  frames.forEach((f, i) => { acc += i === 0 ? 0 : Math.max(0, f.dur || 0); times.push(acc); });
  const props = new Set();
  frames.forEach(f => Object.keys(f.ov || {}).forEach(k => props.add(k)));
  const tracks = [];
  props.forEach(prop => {
    const keys = []; let last;
    frames.forEach((f, i) => {
      const has = f.ov && f.ov[prop] !== undefined;
      const v = has ? f.ov[prop] : last;
      if (v === undefined) return;
      last = v;
      keys.push({ t: times[i], value: v, ease: f.ease || 'ease-out' });
    });
    if (keys.length) tracks.push({ prop, keys });
  });
  return tracks;
}

// Guarantee a state has a `tracks` array (migrating from `frames` the first time). Non-mutating.
function ensureTracks(state) {
  if (!state) return state;
  if (state.tracks) return state;
  const tracks = framesToTracks(state.frames);
  // Only carry a duration once there's something to time — a keyless state must stay "auto", or the 0
  // gets persisted (App's mutTracks writes this object back) and freezes the animation forever.
  const dur = state.duration != null ? state.duration : tracksDuration(tracks);
  return dur ? { ...state, tracks, duration: dur } : { ...state, tracks };
}

// The node as it looks at time `t` in an animation state (base node + sampled track overrides).
function poseAt(node, state, t) {
  const s = ensureTracks(state);
  return { ...node, ...sampleTracks(s.tracks || [], t) };
}

window.animEase = applyEase;
window.lerpVal = lerpVal;
window.parseRGB = parseRGB;
window.sampleTrack = sampleTrack;
window.sampleTracks = sampleTracks;
window.tracksDuration = tracksDuration;
window.stateDuration = stateDuration;
window.framesToTracks = framesToTracks;
window.ensureTracks = ensureTracks;
window.poseAt = poseAt;
