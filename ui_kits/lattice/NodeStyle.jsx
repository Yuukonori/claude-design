/* global React */
// Shared appearance resolvers used by BOTH the editor canvas (Canvas.jsx) and Preview
// (PreviewCanvas.jsx) so a node looks identical in design and run mode.
//   - gradientCss(g)  -> CSS background string for a gradient descriptor
//   - fillBg(node)    -> the node's background value (gradient or solid) or undefined
//   - nodeFx(node)    -> merged style: radius / border / shadow / blur / opacity / rotation / blend
//   - EFFECT_PRESETS  -> starting values for each effect type

function gradientCss(g) {
  if (!g || !Array.isArray(g.stops) || g.stops.length === 0) return null;
  const stops = g.stops
    .slice()
    .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
    .map(s => `${s.color || '#000'} ${Math.round(s.pos ?? 0)}%`)
    .join(', ');
  if (g.type === 'radial') return `radial-gradient(circle at ${g.cx ?? 50}% ${g.cy ?? 50}%, ${stops})`;
  return `linear-gradient(${g.angle ?? 180}deg, ${stops})`;
}

function fillBg(node) {
  const g = gradientCss(node && node.gradient);
  if (g) return g;
  return node && node.fillColor ? node.fillColor : undefined;
}

// Does a node carry any user-set appearance (used to decide whether to hide the canvas debug outline)?
function hasAppearance(node) {
  if (!node) return false;
  return !!(node.gradient || node.fillColor || (node.shader && node.shader.on) || node.borderWidth ||
    (node.effects && node.effects.some(e => e && e.on !== false)) ||
    node.radius || (node.radii && node.radii.some(Boolean)) ||
    (node.opacity != null && node.opacity !== 100) ||
    node.rotation || (node.scale != null && node.scale !== 100) ||
    node.flipH || node.flipV || node.skewX || node.skewY ||
    (node.blendMode && node.blendMode !== 'normal'));
}

// Build the border-radius string from an all-corners value and/or per-corner overrides.
function radiusCss(node) {
  const r = node.radii;
  if (Array.isArray(r) && r.some(v => v != null)) {
    const base = node.radius || 0;
    const v = i => (r[i] != null ? r[i] : base);
    return `${v(0)}px ${v(1)}px ${v(2)}px ${v(3)}px`; // TL TR BR BL
  }
  return node.radius ? `${node.radius}px` : undefined;
}

// Accumulate box-shadow / filter / backdrop-filter from the effects stack.
function effectCss(node) {
  const out = { boxShadow: [], filter: [], backdropFilter: [] };
  for (const e of node.effects || []) {
    if (!e || e.on === false) continue;
    const color = e.color || 'rgba(0,0,0,0.35)';
    const x = e.x ?? 0, y = e.y ?? 0, blur = e.blur ?? 0, spread = e.spread ?? 0;
    if (e.type === 'drop') out.boxShadow.push(`${x}px ${y}px ${blur}px ${spread}px ${color}`);
    else if (e.type === 'inner') out.boxShadow.push(`inset ${x}px ${y}px ${blur}px ${spread}px ${color}`);
    else if (e.type === 'glow') out.boxShadow.push(`0 0 ${e.blur ?? 16}px ${e.spread ?? 2}px ${color}`);
    else if (e.type === 'blur') out.filter.push(`blur(${e.blur ?? 4}px)`);
    else if (e.type === 'bgblur') out.backdropFilter.push(`blur(${e.blur ?? 8}px)`);
  }
  return out;
}

function nodeFx(node) {
  if (!node) return null;
  const s = {};
  const radius = radiusCss(node);
  if (radius) { s.borderRadius = radius; s.overflow = 'hidden'; }
  if (node.borderWidth) s.border = `${node.borderWidth}px ${node.borderStyle || 'solid'} ${node.borderColor || 'var(--border-default)'}`;

  const fx = effectCss(node);
  if (fx.boxShadow.length) s.boxShadow = fx.boxShadow.join(', ');
  if (fx.filter.length) s.filter = fx.filter.join(' ');
  if (fx.backdropFilter.length) { s.backdropFilter = fx.backdropFilter.join(' '); s.WebkitBackdropFilter = s.backdropFilter; }

  if (node.opacity != null && node.opacity !== 100) s.opacity = Math.max(0, Math.min(100, node.opacity)) / 100;

  // Transform — rotate → scale (with flips) → skew, about the chosen origin.
  const tf = [];
  if (node.rotation) tf.push(`rotate(${node.rotation}deg)`);
  const sc = (node.scale == null ? 100 : node.scale) / 100;
  const sx = sc * (node.flipH ? -1 : 1);
  const sy = sc * (node.flipV ? -1 : 1);
  if (sx !== 1 || sy !== 1) tf.push(`scale(${sx}, ${sy})`);
  if (node.skewX || node.skewY) tf.push(`skew(${node.skewX || 0}deg, ${node.skewY || 0}deg)`);
  if (tf.length) { s.transform = tf.join(' '); s.transformOrigin = node.transformOrigin || 'center'; }

  if (node.blendMode && node.blendMode !== 'normal') s.mixBlendMode = node.blendMode;

  return Object.keys(s).length ? s : null;
}

// --- Clipping mask -------------------------------------------------------------------------------
// A masked node (node.maskId → a shape node) is clipped to that shape's silhouette. Both nodes live
// in the same canvas coordinate space, so the mask becomes a CSS clip-path expressed in the CONTENT
// node's own box (pixels from its top-left). Non-destructive: move/reshape the mask and the content
// re-clips live. Supports ellipse/circle, rounded rects & frames, and the polygonal shape kinds.
function clipPathForMask(content, mask) {
  if (!content || !mask) return null;
  const R = v => Math.round(v * 100) / 100;
  const dx = (mask.x || 0) - (content.x || 0);
  const dy = (mask.y || 0) - (content.y || 0);
  const mw = mask.w || 0, mh = mask.h || 0;
  const kind = window.kindOf ? window.kindOf(mask) : (mask.kind || 'frame');

  if (kind === 'ellipse') {
    return `ellipse(${R(mw / 2)}px ${R(mh / 2)}px at ${R(dx + mw / 2)}px ${R(dy + mh / 2)}px)`;
  }
  const POLY = window.POLY_KINDS;
  if (POLY && POLY.has(kind) && window.shapePoints) {
    const pts = (window.shapePoints(kind, mask) || '').trim();
    if (pts) {
      const poly = pts.split(/\s+/).map(pair => {
        const c = pair.split(',');
        return `${R(dx + (parseFloat(c[0]) / 100) * mw)}px ${R(dy + (parseFloat(c[1]) / 100) * mh)}px`;
      }).join(', ');
      return `polygon(${poly})`;
    }
  }
  // rect / frame / card / any container → inset to the mask box, keeping the mask's own corner
  // radius (so a big radius on a square mask — i.e. a "circle" made with radius — Just Works).
  const right = (content.w || 0) - (dx + mw);
  const bottom = (content.h || 0) - (dy + mh);
  const rad = radiusCss(mask);
  const inset = `inset(${R(dy)}px ${R(right)}px ${R(bottom)}px ${R(dx)}px`;
  return rad ? `${inset} round ${rad})` : `${inset})`;
}

// --- Text layer styles (Photoshop-ish): stroke, shadows/glow, gradient fill, decoration ---------
// Kinds that render text somewhere. `textFx` only emits *inheritable* properties, so it can be
// spread on whatever element a kind already returns and the label inside (even a DS component)
// picks it up.
const TEXT_KINDS = new Set(['text', 'heading', 'link', 'button', 'badge', 'checkbox', 'switch', 'list', 'input', 'avatar',
  'textarea', 'radio', 'breadcrumb']);
// background-clip:text only works where the element directly wraps the text with no competing background.
const TEXT_GRADIENT_KINDS = new Set(['text', 'heading', 'link']);

// Text shadows take the SAME inputs as the layer (box) shadows above — see SHADOW_DEFAULTS.
const TEXT_SHADOW_PRESETS = {
  drop: { type: 'drop', x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0,0,0,0.35)', on: true },
  glow: { type: 'glow', x: 0, y: 0, blur: 18, spread: 3, color: 'var(--action-solid)', on: true },
};

const r2 = (v) => Math.round(v * 100) / 100;
const shadowGeom = (t) => ({
  color: t.color || 'rgba(0,0,0,0.35)',
  blur: t.blur ?? 0,
  x: t.type === 'glow' ? 0 : (t.x ?? 0),
  y: t.type === 'glow' ? 0 : (t.y ?? 0),
  spread: Math.max(0, t.spread ?? 0),
});

// Fallback for kinds whose text lives inside a DS component (button/badge/…): plain `text-shadow`.
// CSS text-shadow has no spread, so spread is approximated by ringing copies of the shadow.
const RING = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
function textShadowCss(list) {
  const out = [];
  for (const t of list || []) {
    if (!t || t.on === false) continue;
    const { color, blur, x, y, spread } = shadowGeom(t);
    out.push(`${x}px ${y}px ${blur}px ${color}`);
    if (spread) for (const [dx, dy] of RING) out.push(`${r2(x + dx * spread)}px ${r2(y + dy * spread)}px ${blur}px ${color}`);
  }
  return out.join(', ');
}

// True shadows for direct-text kinds (text/heading/link): each entry becomes a duplicated copy of
// the glyphs painted behind the real text. This matches box-shadow semantics exactly:
//   • spread  → dilate the glyph by `spread` (a centred stroke of 2·spread grows it by spread)
//   • blur    → CSS shadow "blur radius" r is a Gaussian of σ = r/2, so filter: blur(r/2)
//   • color   → one element, composited once, so the alpha stays uniform (no darkening pile-up)
// The node's own text stroke is folded into the dilation so the silhouette stays correct.
function textShadowLayers(node) {
  return (node && node.textShadows || []).filter(t => t && t.on !== false).map(t => {
    const { color, blur, x, y, spread } = shadowGeom(t);
    const stroke = spread * 2 + (node.textStrokeWidth || 0);
    const s = {
      position: 'absolute', left: 0, top: 0, width: '100%',
      pointerEvents: 'none', userSelect: 'none', color,
      backgroundImage: 'none', WebkitTextFillColor: color, // never inherit a gradient text fill
    };
    if (x || y) s.transform = `translate(${x}px, ${y}px)`;
    if (blur) s.filter = `blur(${r2(blur / 2)}px)`;
    if (stroke > 0) { s.WebkitTextStrokeWidth = `${stroke}px`; s.WebkitTextStrokeColor = color; s.paintOrder = 'stroke fill'; }
    return s;
  });
}

function textFx(node) {
  if (!node) return null;
  const s = {};

  if (node.fontStyle && node.fontStyle !== 'normal') s.fontStyle = node.fontStyle;
  if (node.wordSpacing) s.wordSpacing = `${node.wordSpacing}px`;

  if (node.textDecoration && node.textDecoration !== 'none') {
    s.textDecorationLine = node.textDecoration;
    if (node.textDecorationStyle) s.textDecorationStyle = node.textDecorationStyle;
    if (node.textDecorationColor) s.textDecorationColor = node.textDecorationColor;
    if (node.textDecorationThickness) s.textDecorationThickness = `${node.textDecorationThickness}px`;
  }

  const shadows = textShadowCss(node.textShadows);
  if (shadows) s.textShadow = shadows;

  if (node.textStrokeWidth > 0) {
    s.WebkitTextStrokeWidth = `${node.textStrokeWidth}px`;
    s.WebkitTextStrokeColor = node.textStrokeColor || 'var(--text-primary)';
    s.paintOrder = 'stroke fill'; // stroke behind the glyph, like Photoshop's "outside" stroke
  }

  return Object.keys(s).length ? s : null;
}

// Gradient text fill — clip the gradient to the glyphs. Only for TEXT_GRADIENT_KINDS.
function textGradientFx(node) {
  const g = node && gradientCss(node.textGradient);
  if (!g) return null;
  return {
    backgroundImage: g,
    WebkitBackgroundClip: 'text', backgroundClip: 'text',
    WebkitTextFillColor: 'transparent', color: 'transparent',
  };
}

// Layer (box) shadows and text shadows share these starting values so the same inputs read the same.
// --- Interaction states: Hover On / Hover Off / Click On ----------------------------------------
// A state is a partial node holding only overridden props, plus reserved `dur`/`ease` transition
// timing that must not leak into the rendered node. `mergeState` yields the node as it looks in a
// given state; `default`/missing states return the node unchanged.
// Built-in interaction triggers a node can react to. Each `node.states[key]` is a binding that holds
// either a STATIC override map (merged when active) or an ANIMATION pointer (`animId` → a
// `node.customStates` entry). Order here drives the Inspector's state dropdown.
const STATE_KEYS = ['hoverOn', 'hoverOff', 'press', 'hold', 'click', 'rightClick', 'drag', 'drop'];
const STATE_LABELS = { default: 'Default', hoverOn: 'Hover On', hoverOff: 'Hover Off', press: 'Press', hold: 'Hold', click: 'Left click', rightClick: 'Right click', drag: 'Drag', drop: 'Drop' };
// Reserved keys on a binding — never merged into the rendered node. `animId`/`preset` bind an
// animation + record its source preset; `holdMs`/`sustain` shape the Hold trigger.
const STATE_META = { dur: 1, ease: 1, off: 1, animId: 1, preset: 1, holdMs: 1, sustain: 1 };

function stripMeta(o) {
  if (!o) return null;
  const out = {};
  for (const k in o) if (!STATE_META[k]) out[k] = o[k];
  return out;
}

// Old node.hover → hoverOn overrides, so existing projects keep animating after the UI change.
function legacyHoverOverrides(node) {
  const h = node.hover;
  if (!h) return null;
  const o = {};
  if (h.fill) o.fillColor = h.fill;
  if (h.textColor) o.textColor = h.textColor;
  if (h.borderColor) { o.borderColor = h.borderColor; o.borderWidth = node.borderWidth || 1; }
  if (h.scale != null && h.scale !== 100) o.scale = h.scale;
  if (h.opacity != null && h.opacity !== 100) o.opacity = h.opacity;
  return Object.keys(o).length ? o : null;
}

function stateOverrides(node, stateKey) {
  if (!node || !stateKey || stateKey === 'default') return null;
  const explicit = node.states && node.states[stateKey];
  if (explicit) return stripMeta(explicit);
  if (stateKey === 'hoverOn') return legacyHoverOverrides(node); // migration fallback
  return null;
}

function mergeState(node, stateKey) {
  const ov = stateOverrides(node, stateKey);
  return ov ? { ...node, ...ov } : node;
}

// Visual override keys a keyframe captures/animates.
const FRAME_KEYS = ['w', 'h', 'fillColor', 'gradient', 'textColor', 'opacity', 'scale', 'rotation', 'skewX', 'skewY',
  'flipH', 'flipV', 'borderWidth', 'borderStyle', 'borderColor', 'radius', 'radii', 'blendMode',
  'effects', 'textShadows', 'textStrokeWidth', 'textStrokeColor', 'textGradient'];

// Snapshot the current visual props off a (possibly merged) node into a keyframe override set.
function capturePose(node) {
  const o = {};
  for (const k of FRAME_KEYS) if (node[k] !== undefined && node[k] !== '') o[k] = node[k];
  return o;
}

function mergeFrame(node, frame) {
  return frame && frame.ov ? { ...node, ...frame.ov } : node;
}

function stateTiming(node, stateKey) {
  const s = node && node.states && node.states[stateKey];
  return { dur: (s && s.dur != null) ? s.dur : 150, ease: (s && s.ease) || 'ease-out' };
}

// Does a state carry any real content — a non-timing override OR an assigned animation? Drives the
// "has content" dot in the state dropdown.
function stateHasOverrides(node, stateKey) {
  const s = node && node.states && node.states[stateKey];
  if (s && s.animId) return true;
  const ov = stateOverrides(node, stateKey);
  return !!(ov && Object.keys(ov).length);
}

// The animation bound to a trigger (animation mode), or null (static mode).
function stateAnimId(node, stateKey) {
  const s = node && node.states && node.states[stateKey];
  return (s && s.animId) || null;
}

// A state is enabled unless explicitly turned off. Preview ignores disabled states.
function stateEnabled(node, stateKey) {
  return !(node && node.states && node.states[stateKey] && node.states[stateKey].off);
}

// --- Colour shading + one-click state presets --------------------------------------------------
// Tint (amt>0 → toward white) or shade (amt<0 → toward black) any CSS colour by |amt| (0..1). Uses
// color-mix so hex, rgb(), named and `var(--token)` colours all shade live in the browser.
function shadeColor(css, amt) {
  if (!css) return null;
  // Concrete colours → compute a real rgb() so track interpolation stays smooth; tokens/var() fall
  // back to color-mix (which the browser resolves live, but steps rather than tweens).
  const rgb = window.parseRGB && window.parseRGB(css);
  if (rgb) {
    const target = amt < 0 ? 0 : 255, k = Math.min(1, Math.abs(amt));
    const ch = (c) => Math.round(c + (target - c) * k);
    return `rgb(${ch(rgb.r)}, ${ch(rgb.g)}, ${ch(rgb.b)})`;
  }
  const p = Math.round(Math.min(1, Math.abs(amt)) * 100);
  return `color-mix(in srgb, ${css} ${100 - p}%, ${amt < 0 ? 'black' : 'white'})`;
}

// Build a tracks array from [prop, [[t,value,ease],…]] tuples, skipping any with no key list.
function buildTracks(rows) {
  return rows.filter(r => r && r[1]).map(([prop, keys]) => ({ prop, keys: keys.map(([t, value, ease]) => ({ t, value, ease: ease || 'ease-out' })) }));
}
// A two-key colour track that darkens the node's fill over `dur` ms (null when it has no fill).
function darkTrack(node, dur) {
  const f = node && node.fillColor;
  return f ? [[0, f, 'ease-out'], [dur, shadeColor(f, -0.16), 'ease-out']] : null;
}
// Preset definitions. Each returns { kind:'static', ov, dur, ease } or
// { kind:'anim', name, loop, sustain, duration, tracks }.
const STATE_PRESETS = {
  hoverOn: (n) => ({ kind: 'static', dur: 120, ease: 'ease-out', ov: withMaybeFill({ scale: 102 }, shadeColor(n.fillColor, 0.14)) }),
  hoverOff: () => ({ kind: 'static', dur: 150, ease: 'ease-out', ov: {} }), // clears back to default
  press: (n) => ({ kind: 'anim', name: 'Press', loop: false, duration: 220,
    tracks: buildTracks([['scale', [[0, 100, 'ease-out'], [90, 94, 'ease-out'], [220, 100, 'ease-out']]], ['fillColor', darkTrack(n, 220)]]) }),
  hold: (n) => ({ kind: 'anim', name: 'Hold', loop: false, sustain: true, duration: 180,
    tracks: buildTracks([['scale', [[0, 100, 'ease-out'], [180, 96, 'ease-out']]], ['fillColor', darkTrack(n, 180)]]) }),
  click: (n) => STATE_PRESETS.press(n),
  rightClick: (n) => STATE_PRESETS.press(n),
  drag: () => ({ kind: 'static', dur: 120, ease: 'ease-out', ov: { scale: 104, opacity: 92 } }),
  drop: () => ({ kind: 'anim', name: 'Drop', loop: false, duration: 260,
    tracks: buildTracks([['scale', [[0, 104, 'ease-out'], [120, 97, 'ease-in-out'], [260, 100, 'ease-out']]]]) }),
};
function withMaybeFill(ov, fill) { return fill ? { ...ov, fillColor: fill } : ov; }

// Resolve a trigger's preset into a normalized descriptor for the App to apply:
//   { kind:'static', states:{…ov, dur, ease, preset} }  — write straight into node.states[trigger]
//   { kind:'anim', state:{name,type:'anim',…,tracks}, preset } — create a customState + bind animId
function applyStatePreset(node, trigger) {
  const make = STATE_PRESETS[trigger];
  if (!make) return null;
  const p = make(node);
  if (p.kind === 'static') return { kind: 'static', states: { ...p.ov, dur: p.dur, ease: p.ease, preset: trigger, off: false } };
  return { kind: 'anim', preset: trigger, state: { name: p.name, type: 'anim', loop: !!p.loop, sustain: !!p.sustain, duration: p.duration, tracks: p.tracks, frames: [] } };
}

// --- Icon styling, shared by every slot that renders a lucide glyph -----------------------------
// Pairs with the `[data-lt-icon]` rules: the <i> carries the size, and `--lt-icon-sw` drives the
// svg's stroke-width. Lucide strokes with `currentColor`, so `color` is all that's needed for tint.
function iconStyle(o) {
  o = o || {};
  const s = {};
  const size = o.size || 0;
  if (size) { s.width = size; s.height = size; }
  if (o.color) s.color = o.color;
  if (o.stroke != null && o.stroke !== '') s['--lt-icon-sw'] = o.stroke;
  if (o.opacity != null && o.opacity !== 100) s.opacity = Math.max(0, Math.min(100, o.opacity)) / 100;

  const tf = [];
  if (o.rotate) tf.push(`rotate(${o.rotate}deg)`);
  const sx = o.flipH ? -1 : 1, sy = o.flipV ? -1 : 1;
  if (sx !== 1 || sy !== 1) tf.push(`scale(${sx}, ${sy})`);
  if (tf.length) s.transform = tf.join(' ');

  return s;
}

const EFFECT_PRESETS = {
  drop:   { type: 'drop',   color: 'rgba(0,0,0,0.35)', x: 0, y: 8,  blur: 24, spread: 0, on: true },
  inner:  { type: 'inner',  color: 'rgba(0,0,0,0.35)', x: 0, y: 2,  blur: 8,  spread: 0, on: true },
  glow:   { type: 'glow',   color: 'var(--action-solid)', x: 0, y: 0, blur: 18, spread: 3, on: true },
  blur:   { type: 'blur',   blur: 4,  on: true },
  bgblur: { type: 'bgblur', blur: 10, on: true },
};

window.gradientCss = gradientCss;
window.fillBg = fillBg;
window.nodeFx = nodeFx;
window.radiusCss = radiusCss;
window.clipPathForMask = clipPathForMask;
window.hasAppearance = hasAppearance;
window.EFFECT_PRESETS = EFFECT_PRESETS;
window.textFx = textFx;
window.textGradientFx = textGradientFx;
window.textShadowLayers = textShadowLayers;
window.iconStyle = iconStyle;
window.STATE_KEYS = STATE_KEYS;
window.STATE_LABELS = STATE_LABELS;
window.shadeColor = shadeColor;
window.applyStatePreset = applyStatePreset;
window.stateAnimId = stateAnimId;
window.mergeState = mergeState;
window.stateTiming = stateTiming;
window.stateHasOverrides = stateHasOverrides;
window.stateEnabled = stateEnabled;
window.FRAME_KEYS = FRAME_KEYS;
window.capturePose = capturePose;
window.mergeFrame = mergeFrame;
window.TEXT_KINDS = TEXT_KINDS;
window.TEXT_GRADIENT_KINDS = TEXT_GRADIENT_KINDS;
window.TEXT_SHADOW_PRESETS = TEXT_SHADOW_PRESETS;
