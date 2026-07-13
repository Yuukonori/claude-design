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

// Props that represent a spin angle rather than a bounded offset — on loop wrap these continue turning
// in their established direction (mod 360) instead of tweening straight back to the raw first-key value,
// which would visibly reverse the spin whenever the keys aren't exactly 360° apart (see sampleTrack).
const ANGLE_PROPS = new Set(['rotation', 'iconRotate', 'btnIconRotate']);

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

// Value of one track at time `t`. Each interior segment is eased by its *incoming* key's ease.
// Without opts the ends clamp (hold the first/last key). With `opts.wrap` + `opts.duration`, a looping
// track instead tweens across the loop boundary — from the last key, over the gap to the clip end, and
// on to the first key of the next cycle — so a repeating animation is seamless instead of holding then
// snapping. The wrap tween is eased by the first key's ease (the key it settles onto).
function sampleTrack(tr, t, opts) {
  const keys = (tr.keys || []).slice().sort((a, b) => a.t - b.t);
  if (!keys.length) return undefined;
  const first = keys[0], last = keys[keys.length - 1];
  // Interior: normal segment between the two surrounding keys.
  if (t > first.t && t < last.t) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[i + 1];
    const span = b.t - a.t;
    const u = span > 0 ? (t - a.t) / span : 1;
    return lerpVal(tr.prop, a.value, b.value, applyEase(b.ease, u));
  }
  // Loop wrap: only when asked, over a real duration, with >1 distinct-valued keys that leave a real
  // gap before repeating (if the keys already fill the clip, or the endpoints match, the plain hold is
  // already seamless).
  const duration = opts && opts.duration ? +opts.duration : 0;
  const wrapSpan = (duration - last.t) + first.t;      // last key → clip end → first key (next cycle)
  const canWrap = !!(opts && opts.wrap) && duration > 0 && keys.length > 1
    && wrapSpan > 0 && first.value !== last.value;
  if (canWrap) {
    const el = t >= last.t ? (t - last.t) : ((duration - last.t) + t);
    const u = el / wrapSpan;
    let target = first.value;
    if (ANGLE_PROPS.has(tr.prop) && typeof last.value === 'number' && typeof first.value === 'number') {
      // Continue spinning the same way the track was already heading into its last key, landing on
      // the angle nearest congruent (mod 360) to the authored first key — never a full turn (so it
      // doesn't freeze) and never more than one (so speed stays roughly constant across the seam).
      const prev = keys.length > 1 ? keys[keys.length - 2] : first;
      const dir = last.value - prev.value;
      if (dir < 0) {
        const back = (((last.value - first.value) % 360) + 360) % 360;
        target = last.value - (back || 360);
      } else {
        const fwd = (((first.value - last.value) % 360) + 360) % 360;
        target = last.value + (fwd || 360);
      }
    }
    return lerpVal(tr.prop, last.value, target, applyEase(first.ease, u));
  }
  // Default: clamp at the ends.
  return t <= first.t ? first.value : last.value;
}
// Merge every track's sampled value into an override map { prop: value }. `opts` (loop wrap) is
// forwarded to each track — see sampleTrack.
function sampleTracks(tracks, t, opts) {
  const out = {};
  (tracks || []).forEach(tr => { const v = sampleTrack(tr, t, opts); if (v !== undefined) out[tr.prop] = v; });
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

// The node as it looks at time `t` in an animation state: the state's RESTING POSE (base node merged
// with any static overrides it stored in node.states[state.id]) with the sampled track values on top.
// Folding in node.states[state.id] keeps props the user set while authoring the state — but never
// keyframed (an icon glyph, a colour) — scoped to that state instead of leaking onto the shared base /
// Default. No override layer (the common case) → pose is just base + tracks, exactly as before.
// Merge sampled track overrides onto a base pose. Special-cases the Fill: a keyframed `fillColor` holds
// the whole background as a CSS string (a solid, OR a gradient captured via fillBg), so it is the sole
// authority for the fill while animating — a gradient sitting on the base/state resting pose must not
// bleed through (fillBg() otherwise prioritises `.gradient`). Dropping it lets the sampled string win at
// every t, so a Fill track can go solid → gradient → none across its keys.
function applyPose(base, ov) {
  const pose = Object.assign({}, base, ov);
  if (ov && 'fillColor' in ov) pose.gradient = null;
  return pose;
}

function poseAt(node, state, t) {
  const s = ensureTracks(state);
  // A looping state tweens across the loop boundary unless smoothing is explicitly turned off
  // (loopWrap === false). Non-looping states clamp as before.
  const opts = s.loop ? { wrap: s.loopWrap !== false, duration: stateDuration(s) } : null;
  const base = (window.mergeState && s && s.id) ? window.mergeState(node, s.id) : node;
  return applyPose(base, sampleTracks(s.tracks || [], t, opts));
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
window.applyPose = applyPose;
window.poseAt = poseAt;
