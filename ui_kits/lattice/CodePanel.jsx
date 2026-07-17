/* global React */
// Code view — a file explorer over the project, real code generation, a full Vite + React + TS
// scaffold ("Initialize project"), and a single-click runnable .zip export.
//
// The tree merges two sources:
//   • Generated (virtual, read-only): src/pages/<Page>.tsx, regenerated live from the design.
//   • Project files (editable): the project's `assets` — user-created files/folders, uploaded
//     binaries (images), and the scaffold written by "Initialize project".
// Assets override generated files at the same path. Export merges scaffold-defaults < generated <
// assets so the exported project always runs: unzip → npm install → npm run dev.
//
// NOTE: no object-rest destructuring anywhere in this file — in the in-browser Babel setup two
// files using `{...rest}` collide on a shared `_excluded` helper, and PreviewCanvas.jsx already
// uses it. Object/JSX spread in literals (`{...obj}`) is fine.

// ---------- pure helpers ----------

function buildChildMap(connections) {
  const m = {};
  (connections || []).filter(c => c.kind === 'child').forEach(c => {
    if (!m[c.from]) m[c.from] = [];
    m[c.from].push(c.to);
  });
  return m;
}
window.buildChildMap = buildChildMap;

function pascalName(s) {
  const out = (s || '').replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ')
    .filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return out || 'Page';
}

function slug(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lattice-app';
}

const CSS_FONT = {
  'Grotesk (UI)': "var(--font-sans)", 'Serif display': "var(--font-serif-display)",
  'Mono': "var(--font-mono)", 'System': 'system-ui, sans-serif',
};
const CSS_WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const CODE_TEXT_KINDS = new Set(['text', 'heading', 'link', 'button', 'badge', 'stat']);

// Serialize a plain style object to a JSX inline-style body: { "left": 12, "color": "#fff" }
function objToJs(obj) {
  const parts = Object.keys(obj)
    .filter(k => obj[k] != null && obj[k] !== '')
    .map(k => JSON.stringify(k) + ': ' + (typeof obj[k] === 'number' ? obj[k] : JSON.stringify(obj[k])));
  return '{ ' + parts.join(', ') + ' }';
}
function jsxText(t) { return t ? '{' + JSON.stringify(t) + '}' : ''; }

// Faithful-enough inline style for a node, reusing the editor's own resolvers where available.
// Geometry (position/left/top/width/height) is intentionally NOT baked here — it varies per device
// and is applied at runtime by __g(table, layer) in the generated page (see nodeGeomTable).
function nodeBaseStyleObj(n, maskNode) {
  const fx = (window.nodeFx && window.nodeFx(n)) || {};
  const style = Object.assign({}, fx);
  // A clipped layer bakes its mask as a clip-path (from the base/desktop geometry of both boxes).
  if (maskNode && window.clipPathForMask) {
    const cp = window.clipPathForMask(n, maskNode);
    if (cp) { style.clipPath = cp; style.WebkitClipPath = cp; }
  }
  const bg = (window.fillBg && window.fillBg(n)) || n.fillColor;
  if (bg) style.background = bg;
  if (n.textColor) style.color = n.textColor;
  if (n.fontFamily && CSS_FONT[n.fontFamily]) style.fontFamily = CSS_FONT[n.fontFamily];
  else if (n.fontFamily) style.fontFamily = "'" + n.fontFamily + "'"; // custom uploaded font family
  else if (n.kind === 'heading') style.fontFamily = 'var(--font-serif-display)';
  if (n.fontSize) style.fontSize = n.fontSize;
  if (n.fontWeight && CSS_WEIGHT[n.fontWeight]) style.fontWeight = CSS_WEIGHT[n.fontWeight];
  if (n.letterSpacing) style.letterSpacing = n.letterSpacing + 'px';
  if (n.textTransform && n.textTransform !== 'none') style.textTransform = n.textTransform;
  const kind = n.kind || 'frame';
  if (kind === 'button') {
    // Mirror the editor's PreviewNode button palette (per variant) so the label stays legible and the
    // button matches Preview. Previously a filled button with no explicit textColor baked NO color, so
    // its text inherited the page's light --text-primary and vanished on a light fill.
    const v = n.variant || 'solid';
    const solidFill = n.gradient ? null : n.fillColor;
    const pal = ({
      // A solid button's border only ever existed to match its fill (seamless). Baking it transparent
      // keeps the same resting look but avoids a stale 1px ring when a state shades only the fill.
      solid:   { background: bg || 'var(--action-solid)', color: solidFill ? '#000' : 'var(--action-solid-text)', border: '1px solid transparent' },
      outline: { background: bg || 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
      ghost:   { background: bg || 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
      danger:  { background: bg || 'transparent', color: 'var(--status-danger-fg)', border: '1px solid var(--status-danger-fg)' },
    })[v] || {};
    style.background = pal.background;
    style.color = n.textColor || pal.color;
    if (pal.border) style.border = pal.border;
    style.display = 'inline-flex'; style.alignItems = 'center';
    style.justifyContent = !n.textAlign || n.textAlign === 'center' ? 'center' : n.textAlign === 'right' ? 'flex-end' : 'flex-start';
    style.cursor = 'pointer';
    if (!style.fontWeight) style.fontWeight = 500;
    if (!style.fontSize) style.fontSize = 13;
  } else if (kind === 'badge') {
    style.display = 'inline-flex'; style.alignItems = 'center'; style.justifyContent = 'center';
    if (!bg) style.background = 'var(--surface-hover)';
    if (!n.textColor) style.color = 'var(--text-secondary)';
  } else if (kind === 'heading' || kind === 'text' || kind === 'link') {
    style.display = 'flex'; style.alignItems = 'center';
    style.justifyContent = n.textAlign === 'center' ? 'center' : n.textAlign === 'right' ? 'flex-end' : 'flex-start';
    if (kind === 'heading' && !n.fontSize) style.fontSize = 28;
  } else if (kind === 'frame' || kind === 'stack' || kind === 'grid' || kind === 'card' || kind === 'section') {
    // Match Preview, which defaults an empty container to the card surface (PreviewCanvas `contBg`), so
    // menu panels / cards look the same in Run/Web as they do in the editor.
    if (!bg && !(n.shader && n.shader.on)) style.background = 'var(--surface-card)';
  }
  // Never let a geometry key leak into the base style — geometry is layer-dependent (see __g).
  delete style.position; delete style.left; delete style.top; delete style.width; delete style.height;
  return style;
}

// Paint props an interaction state can change. Baked per-state (below) so the runtime can apply a
// state's WHOLE look — border/shadow/gradient/radius/transform — exactly like Preview, instead of
// mutating a hand-picked subset (which left, e.g., a stale border ring on hover). Excludes
// geometry/typography, which don't vary per interaction state.
// `border` is the shorthand nodeBaseStyleObj emits — its longhands (borderColor/Width/Style) are
// intentionally absent so setting the shorthand isn't clobbered by a later longhand reset.
const PAINT_KEYS = ['background', 'color', 'border', 'borderRadius',
  'boxShadow', 'filter', 'backdropFilter', 'WebkitBackdropFilter', 'mixBlendMode', 'opacity',
  'transform', 'transformOrigin', 'overflow', 'clipPath', 'WebkitClipPath'];
function pickPaint(style) {
  const o = {}; if (!style) return o;
  for (const k of PAINT_KEYS) if (style[k] != null && style[k] !== '') o[k] = style[k];
  return o;
}
// Bake a node's resting paint (`st0`) plus a full paint style per usable STATIC state (`stMap`),
// computed with the SAME resolvers Preview uses (nodeBaseStyleObj + mergeState). The runtime assigns
// these wholesale (see LNode.applyStatic), so Run matches Preview for every static hover/press/click/
// menu state. Trigger-bound animations are excluded — those are sampled per-frame by applyOverrides.
const STATE_KEYS_GEN = ['hoverOn', 'hoverOff', 'press', 'hold', 'click', 'rightClick', 'drag', 'drop'];
function nodeStateStyles(n, maskNode) {
  const st0 = pickPaint(nodeBaseStyleObj(n, maskNode));
  const stMap = {};
  STATE_KEYS_GEN.forEach(key => {
    if (!(window.stateHasOverrides && window.stateHasOverrides(n, key))) return;
    if (window.stateAnimId && window.stateAnimId(n, key)) return;   // animation → sampled per-frame
    const merged = window.mergeState ? window.mergeState(n, key) : n;
    stMap[key] = pickPaint(nodeBaseStyleObj(merged, maskNode));
  });
  return { st0: st0, stMap: stMap };
}

// Per-device geometry table for a node: { <layer>: {x,y,w,h,hidden?} }. `desktop` is the node's base
// box; tablet/mobile and each desktop screen-type (`desktop:<preset>`) come from node.bp overrides,
// mirroring the editor's geomAt() — so the generated app lays out exactly like every editor device.
// A non-responsive node keeps only its base box (identical on every device).
function nodeGeomTable(n) {
  const base = { x: n.x || 0, y: n.y || 0, w: n.w || 0, h: n.h || 0 };
  if (n.hidden) base.hidden = true;
  const tbl = { desktop: base };
  if (n.responsive !== false && n.bp) {
    for (const k in n.bp) {
      const o = n.bp[k]; if (!o) continue;
      const g = { x: o.x || 0, y: o.y || 0, w: o.w || 0, h: o.h || 0 };
      if (o.hidden) g.hidden = true;
      tbl[k] = g;
    }
  }
  return tbl;
}

// One node → a JSX element line for its page component. `styleExpr` is the full inline-style
// expression (base style spread + per-layer geometry from __g), computed by the caller.
function nodeToTsx(n, resolveImg, styleExpr) {
  const kind = n.kind || 'frame';
  const text = n.label != null ? n.label : (CODE_TEXT_KINDS.has(kind) ? (n.name || '') : '');
  if (kind === 'image') {
    const img = resolveImg(n.src);
    const srcExpr = img ? (img.var ? '{' + img.var + '}' : JSON.stringify(img.url)) : '""';
    return '      <img src=' + srcExpr + ' alt=' + JSON.stringify(n.label || '') + ' style={' + styleExpr + '} />';
  }
  if (kind === 'icon') {
    if (n.iconSvg) return '      <div style={' + styleExpr + '} dangerouslySetInnerHTML={{ __html: ' + JSON.stringify(n.iconSvg) + ' }} />';
    if (n.iconSrc) {
      const img = resolveImg(n.iconSrc);
      const srcExpr = img ? (img.var ? '{' + img.var + '}' : JSON.stringify(img.url)) : '""';
      return '      <img src=' + srcExpr + ' alt="" style={' + styleExpr + '} />';
    }
    // Lucide glyphs aren't bundled in the export — leave a pointer to lucide-react.
    return '      <div style={' + styleExpr + '}>{/* icon "' + (n.iconName || 'star') + '": npm i lucide-react, then render the matching icon */}</div>';
  }
  if (kind === 'button') return '      <button style={' + styleExpr + '}>' + jsxText(text) + '</button>';
  if (kind === 'link') return '      <a href=' + JSON.stringify(n.href || '#') + ' style={' + styleExpr + '}>' + jsxText(text) + '</a>';
  if (kind === 'input') return '      <input placeholder=' + JSON.stringify(n.placeholder || n.label || '') + ' style={' + styleExpr + '} />';
  if (CODE_TEXT_KINDS.has(kind)) return '      <div style={' + styleExpr + '}>' + jsxText(text) + '</div>';
  return '      <div style={' + styleExpr + '} />';
}

// Stable component name + route per page.
function pageMetaOf(pages) {
  const used = {};
  return (pages || []).map(p => {
    let base = pascalName(p.name);
    if (used[base]) { used[base]++; base = base + used[base]; } else { used[base] = 1; }
    return { id: p.id, name: p.name || base, route: p.route || '/' + base.toLowerCase(), comp: base };
  });
}

// __g(table, layer): resolve a node's box for the active device layer, falling back to the base
// (desktop) box when that layer has no override — mirrors the editor's geomAt() resolution.
const GEOM_HELPER = "function __g(t: any, layer: string) {\n"
  + "  const o = t[layer] || t.desktop;\n"
  + "  const s: any = { position: 'absolute', left: o.x, top: o.y, width: o.w, height: o.h };\n"
  + "  if (o.hidden) s.display = 'none';\n"
  + "  return s;\n"
  + "}\n";

function genPageTsx(page, comp) {
  const nodes = page.nodes || [];
  const imports = []; const map = {}; let ai = 0;
  const resolveImg = (src) => {
    if (!src) return null;
    if (/^(https?:|data:|\/\/)/i.test(src)) return { url: src };
    if (map[src] != null) return { var: map[src] };
    const v = 'asset' + (ai++);
    let p = src.replace(/^\.?\//, '');
    if (!/^src\//.test(p)) p = 'src/assets/' + p.split('/').pop();
    imports.push("import " + v + " from '" + ('../' + p.replace(/^src\//, '')) + "';");
    map[src] = v; return { var: v };
  };
  // Each node becomes: a geometry const (Gn) with every device layer, and an element whose style is
  // the base style spread with the resolved per-layer geometry. The page fills its artboard frame
  // (position:absolute; inset:0); App.tsx sizes & scales that frame per device. A node that carries
  // interactions or an animation state is wrapped in <LNode> (with a baked NODEn data object) so the
  // runtime can attach handlers + play its animation.
  // Clipping masks: the mask shape isn't emitted (it only defined the clip, now baked into each
  // clipped layer's clip-path); every layer pointing at it carries that clip in its base style.
  const maskById = {}; nodes.forEach(n => { maskById[n.id] = n; });
  const maskNodeIds = new Set(nodes.filter(n => n.maskId).map(n => n.maskId));
  const geomDecls = [];
  let usesLNode = false;
  const body = nodes.map((n, i) => {
    if (maskNodeIds.has(n.id)) return null;
    const gvar = 'G' + i;
    geomDecls.push('const ' + gvar + ' = ' + JSON.stringify(nodeGeomTable(n)) + ';');
    const maskNode = n.maskId ? maskById[n.maskId] : null;
    const styleExpr = '{ ...(' + objToJs(nodeBaseStyleObj(n, maskNode)) + '), ...__g(' + gvar + ', layer) }';
    const el = nodeToTsx(n, resolveImg, styleExpr);
    if (!nodeHasBehavior(n)) return el;
    usesLNode = true;
    const nvar = 'NODE' + i;
    geomDecls.push('const ' + nvar + ' = ' + nodeBehaviorLiteral(n, gvar, maskNode) + ';');
    return '      <LNode key=' + JSON.stringify(n.id || ('n' + i)) + ' layer={layer} node={' + nvar + '}>\n  '
      + el + '\n      </LNode>';
  }).filter(Boolean).join('\n');
  const head = "import React from 'react';\n" + (usesLNode ? "import { LNode } from '../runtime';\n" : '') + (imports.length ? imports.join('\n') + '\n' : '');
  return head + '\n' + (geomDecls.length ? geomDecls.join('\n') + '\n' : '') + GEOM_HELPER
    + '\nexport default function ' + comp + '({ layer = \'desktop\' }: { layer?: string }) {\n  return (\n    <div style={{ position: \'absolute\', inset: 0 }}>\n'
    + (body || '      {/* empty page — place components on the canvas */}') + '\n    </div>\n  );\n}\n';
}

// A node needs the runtime wrapper if it has interactions, an animation state, or interaction states
// (hover/press/hold/click static poses or trigger-bound animations, incl. the legacy `hover` field).
function nodeHasBehavior(n) {
  return !!((n.actions && n.actions.length)
    || (n.customStates && n.customStates.some(s => (s.type || 'static') === 'anim'))
    || (n.states && Object.keys(n.states).length)
    || n.hover || n.navGroup);
}

// The baked data an LNode needs: id, interactions, animation states, the animatable base props, and a
// reference to the node's geometry table (Gn) for resolving the box per device layer.
const LNODE_BASE_PROPS = ['rotation', 'scale', 'skewX', 'skewY', 'flipH', 'flipV', 'opacity', 'fillColor', 'gradient', 'textColor', 'borderColor', 'borderWidth', 'radius', 'radii', 'transformOrigin'];
function nodeBehaviorLiteral(n, gvar, maskNode) {
  const base = {};
  LNODE_BASE_PROPS.forEach(k => { if (n[k] != null) base[k] = n[k]; });
  const ss = nodeStateStyles(n, maskNode);
  const anim = (n.customStates || []).filter(s => (s.type || 'static') === 'anim').map(s => ({
    id: s.id, name: s.name, type: 'anim', tracks: s.tracks, frames: s.frames,
    loop: s.loop, loopWrap: s.loopWrap, duration: s.duration, autoplay: s.autoplay,
  }));
  return '{ id: ' + JSON.stringify(n.id || '') + ', actions: ' + JSON.stringify(n.actions || [])
    + ', anim: ' + JSON.stringify(anim)
    + ', states: ' + JSON.stringify(n.states || null)
    + ', hover: ' + JSON.stringify(n.hover || null)
    + ', clickMode: ' + JSON.stringify(n.clickMode || 'toggle')
    + ', navGroup: ' + JSON.stringify(n.navGroup || null)
    + ', navActive: ' + JSON.stringify(!!n.navActive)
    + ', base: ' + JSON.stringify(base)
    + ', st0: ' + JSON.stringify(ss.st0)
    + ', stMap: ' + JSON.stringify(ss.stMap)
    + ', geom: ' + gvar + ' }';
}

function generatedFiles(pages, config) {
  config = config || {};
  const meta = pageMetaOf(pages);
  // Variables the runtime can read/write = global vars + every page's local vars.
  const variables = (config.variables || []).concat(...(pages || []).map(p => p.vars || []));
  const runtime = { workflows: config.workflows || [], variables };
  const out = meta.map((m, i) => ({ path: 'src/pages/' + m.comp + '.tsx', content: genPageTsx(pages[i], m.comp), generated: true }));
  // App.tsx (the responsive stage + page router) is generated too, so it always imports the current
  // set of pages and reflects the editor's active device/screen-type as the initial view.
  out.push({ path: 'src/App.tsx', content: genAppTsx(meta, config, runtime), generated: true });
  // runtime.tsx — the interaction/workflow/animation runtime shared by App + pages.
  out.push({ path: 'src/runtime.tsx', content: genRuntimeTsx(), generated: true });
  return out;
}

// The runtime module baked into every generated app. It is a faithful, dependency-free port of the
// editor's engines so Run/Web/export behave like Preview: the animation sampler (AnimEngine), the
// workflow interpreter (WorkflowEngine, minus the editor-only run log), plus an interaction layer:
//   - LRuntimeProvider — context holding the workflows/variables, a node registry, and dispatch().
//   - LNode           — wraps a design element to attach action handlers and play animations (rAF)
//                       by mutating the element's style from the sampled per-property tracks.
// Authored to avoid backticks/`${}` (string concatenation instead) so it embeds cleanly here; regex
// backslashes are doubled so they survive this template literal.
function genRuntimeTsx() {
  return `import React from 'react';

// ================= animation sampler (from AnimEngine) =================
const EASE: any = {
  'linear': (u: number) => u,
  'ease-in': (u: number) => u * u,
  'ease-out': (u: number) => 1 - (1 - u) * (1 - u),
  'ease-in-out': (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
};
function applyEase(name: string, u: number) { const f = EASE[name] || EASE['ease-out']; return f(Math.max(0, Math.min(1, u))); }
const COLOR_PROPS = new Set(['fillColor', 'textColor', 'borderColor', 'textStrokeColor', 'chartColor', 'placeholderColor', 'btnIconColor', 'iconColor']);
const STEP_PROPS = new Set(['flipH', 'flipV', 'borderStyle', 'blendMode', 'radii', 'gradient', 'effects', 'textShadows', 'textGradient', 'iconName', 'btnIcon', 'label', 'text', 'src', 'variant', 'btnSize', 'btnIconPos', 'fullWidth', 'disabled']);
const ANGLE_PROPS = new Set(['rotation', 'iconRotate', 'btnIconRotate']);
function lerpNum(a: number, b: number, u: number) { return a + (b - a) * u; }
function parseRGB(css: any): any {
  if (typeof css !== 'string') return null;
  const s = css.trim();
  let m = s.match(/^#([0-9a-f]{3})$/i);
  if (m) { const h = m[1]; return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) }; }
  m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) { const h = m[1]; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  m = s.match(/^rgba?\\(([^)]+)\\)$/i);
  if (m) { const p = m[1].split(',').map((x: string) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2] }; }
  return null;
}
function lerpColor(a: any, b: any, u: number) {
  const ca = parseRGB(a), cb = parseRGB(b);
  if (!ca || !cb) return u < 0.5 ? a : b;
  return 'rgb(' + Math.round(lerpNum(ca.r, cb.r, u)) + ', ' + Math.round(lerpNum(ca.g, cb.g, u)) + ', ' + Math.round(lerpNum(ca.b, cb.b, u)) + ')';
}
function lerpVal(prop: string, a: any, b: any, u: number) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (COLOR_PROPS.has(prop)) return lerpColor(a, b, u);
  if (STEP_PROPS.has(prop)) return u < 1 ? a : b;
  const na = +a, nb = +b;
  if (!isNaN(na) && !isNaN(nb)) return lerpNum(na, nb, u);
  return u < 0.5 ? a : b;
}
function sampleTrack(tr: any, t: number, opts: any): any {
  const keys = (tr.keys || []).slice().sort((a: any, b: any) => a.t - b.t);
  if (!keys.length) return undefined;
  const first = keys[0], last = keys[keys.length - 1];
  if (t > first.t && t < last.t) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[i + 1];
    const span = b.t - a.t;
    const u = span > 0 ? (t - a.t) / span : 1;
    return lerpVal(tr.prop, a.value, b.value, applyEase(b.ease, u));
  }
  const duration = opts && opts.duration ? +opts.duration : 0;
  const wrapSpan = (duration - last.t) + first.t;
  const canWrap = !!(opts && opts.wrap) && duration > 0 && keys.length > 1 && wrapSpan > 0 && first.value !== last.value;
  if (canWrap) {
    const el = t >= last.t ? (t - last.t) : ((duration - last.t) + t);
    const u = el / wrapSpan;
    let target = first.value;
    if (ANGLE_PROPS.has(tr.prop) && typeof last.value === 'number' && typeof first.value === 'number') {
      const prev = keys.length > 1 ? keys[keys.length - 2] : first;
      const dir = last.value - prev.value;
      if (dir < 0) { const back = (((last.value - first.value) % 360) + 360) % 360; target = last.value - (back || 360); }
      else { const fwd = (((first.value - last.value) % 360) + 360) % 360; target = last.value + (fwd || 360); }
    }
    return lerpVal(tr.prop, last.value, target, applyEase(first.ease, u));
  }
  return t <= first.t ? first.value : last.value;
}
function sampleTracks(tracks: any, t: number, opts: any) {
  const out: any = {};
  (tracks || []).forEach((tr: any) => { const v = sampleTrack(tr, t, opts); if (v !== undefined) out[tr.prop] = v; });
  return out;
}
function tracksDuration(tracks: any) { let m = 0; (tracks || []).forEach((tr: any) => (tr.keys || []).forEach((k: any) => { if (k.t > m) m = k.t; })); return m; }
function framesToTracks(frames: any) {
  frames = frames || [];
  if (!frames.length) return [];
  const times: number[] = []; let acc = 0;
  frames.forEach((f: any, i: number) => { acc += i === 0 ? 0 : Math.max(0, f.dur || 0); times.push(acc); });
  const props = new Set<string>();
  frames.forEach((f: any) => Object.keys(f.ov || {}).forEach((k) => props.add(k)));
  const tracks: any[] = [];
  props.forEach((prop) => {
    const keys: any[] = []; let last: any;
    frames.forEach((f: any, i: number) => {
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
function ensureTracks(state: any) {
  if (!state) return state;
  if (state.tracks) return state;
  const tracks = framesToTracks(state.frames);
  return Object.assign({}, state, { tracks });
}
function stateDuration(state: any) {
  if (!state) return 0;
  if (state.duration) return state.duration;
  return tracksDuration(ensureTracks(state).tracks);
}

// --- appearance resolvers (ported from NodeStyle) so animation tracks that change gradient / effects /
// per-corner radii / blend render in Run exactly like Preview (which recomputes them every frame). ---
function rtGradientCss(g: any) {
  if (!g || !Array.isArray(g.stops) || g.stops.length === 0) return '';
  const stops = g.stops.slice().sort((a: any, b: any) => (a.pos ?? 0) - (b.pos ?? 0))
    .map((s: any) => (s.color || '#000') + ' ' + Math.round(s.pos ?? 0) + '%').join(', ');
  if (g.type === 'radial') return 'radial-gradient(circle at ' + (g.cx ?? 50) + '% ' + (g.cy ?? 50) + '%, ' + stops + ')';
  return 'linear-gradient(' + (g.angle ?? 180) + 'deg, ' + stops + ')';
}
function rtRadiusCss(n: any) {
  const r = n.radii;
  if (Array.isArray(r) && r.some((v: any) => v != null)) {
    const base = n.radius || 0; const v = (i: number) => (r[i] != null ? r[i] : base);
    return v(0) + 'px ' + v(1) + 'px ' + v(2) + 'px ' + v(3) + 'px';
  }
  return n.radius ? n.radius + 'px' : '';
}
function rtEffectCss(n: any) {
  const out: any = { boxShadow: [], filter: [], backdropFilter: [] };
  for (const e of n.effects || []) {
    if (!e || e.on === false) continue;
    const color = e.color || 'rgba(0,0,0,0.35)';
    const x = e.x ?? 0, y = e.y ?? 0, blur = e.blur ?? 0, spread = e.spread ?? 0;
    if (e.type === 'drop') out.boxShadow.push(x + 'px ' + y + 'px ' + blur + 'px ' + spread + 'px ' + color);
    else if (e.type === 'inner') out.boxShadow.push('inset ' + x + 'px ' + y + 'px ' + blur + 'px ' + spread + 'px ' + color);
    else if (e.type === 'glow') out.boxShadow.push('0 0 ' + (e.blur ?? 16) + 'px ' + (e.spread ?? 2) + 'px ' + color);
    else if (e.type === 'blur') out.filter.push('blur(' + (e.blur ?? 4) + 'px)');
    else if (e.type === 'bgblur') out.backdropFilter.push('blur(' + (e.blur ?? 8) + 'px)');
  }
  return out;
}

// ================= workflow interpreter (from WorkflowEngine, log-free) =================
function getPath(obj: any, path: any) { return String(path).trim().split('.').reduce((o: any, k: string) => (o == null ? undefined : o[k]), obj); }
function resolveTemplate(str: any, scope: any): any {
  if (typeof str !== 'string') return str;
  const whole = str.match(/^\\s*\\{\\{\\s*([^}]+?)\\s*\\}\\}\\s*$/);
  if (whole) return getPath(scope, whole[1]);
  return str.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_: any, e: string) => { const v = getPath(scope, e); return v == null ? '' : String(v); });
}
function evalCondition(branch: any, scope: any) {
  const l = resolveTemplate(branch.left, scope);
  const r = resolveTemplate(branch.right, scope);
  switch (branch.op) {
    case '==': return String(l) === String(r);
    case '!=': return String(l) !== String(r);
    case '>': return Number(l) > Number(r);
    case '<': return Number(l) < Number(r);
    case 'contains': return String(l).includes(String(r));
    case 'truthy': return !!l && l !== 'false' && l !== '0';
    case 'empty': return l == null || l === '';
    default: return false;
  }
}
async function execWorkflow(workflow: any, ctx: any) {
  if (!workflow || !Array.isArray(workflow.nodes)) return;
  const byId: any = {}; workflow.nodes.forEach((n: any) => { byId[n.id] = n; });
  const varById: any = {}; (ctx.variables || []).forEach((v: any) => { varById[v.id] = v; });
  const scope = ctx.scope || {};
  const edgeFrom = (id: string, port: string) => (workflow.edges || []).find((e: any) => e.from === id && (e.fromPort || 'next') === port);
  const writeVar = (varId: string, value: any) => { const v = varById[varId]; if (v) scope[v.name] = value; if (ctx.onVarChange) ctx.onVarChange(varId, value); };
  let cur = workflow.nodes.find((n: any) => n.type === 'trigger') || workflow.nodes[0];
  let guard = 0;
  while (cur && guard++ < 200) {
    let port = 'next';
    try {
      switch (cur.type) {
        case 'setVar': { const val = resolveTemplate(cur.value, scope); if (cur.target) writeVar(cur.target, val); break; }
        case 'api': {
          const method = (cur.method || 'GET').toUpperCase();
          const url = resolveTemplate(cur.url, scope);
          let body: any = resolveTemplate(cur.body, scope);
          if (typeof body === 'string' && body.trim()) { try { body = JSON.parse(body); } catch (e) {} } else if (!body) body = undefined;
          let headers: any;
          if (cur.headers && cur.headers.trim()) { try { headers = JSON.parse(resolveTemplate(cur.headers, scope)); } catch (e) {} }
          const resp = ctx.callApi ? await ctx.callApi({ method, url, headers, body }) : { status: 0, ok: false, body: null };
          if (cur.resultVar) writeVar(cur.resultVar, resp);
          break;
        }
        case 'condition': { const idx = (cur.branches || []).findIndex((b: any) => evalCondition(b, scope)); port = idx >= 0 ? String(idx) : 'else'; break; }
        case 'navigate': if (cur.pageId && ctx.navigate) ctx.navigate(cur.pageId); break;
        case 'setProp': { const val = resolveTemplate(cur.value, scope); if (cur.targetNodeId && ctx.setProp) ctx.setProp(cur.targetNodeId, cur.prop || 'label', val); break; }
        case 'toast': { const msg = resolveTemplate(cur.message, scope) || 'Done'; if (ctx.toast) ctx.toast(msg); break; }
        case 'playAnim': { if (cur.targetNodeId && cur.animId && ctx.playAnim) ctx.playAnim(cur.targetNodeId, cur.animId); break; }
        case 'playPageAnim': if (ctx.playPageAnim) ctx.playPageAnim(cur.pageId || null); break;
        default: break;
      }
    } catch (err) { if (typeof console !== 'undefined') console.error('[workflow]', cur.type, err); }
    const next = edgeFrom(cur.id, port);
    cur = next ? byId[next.to] : null;
  }
}

// ================= toast =================
function showToast(msg: any) {
  try {
    let host = document.getElementById('__lt_toast');
    if (!host) { host = document.createElement('div'); host.id = '__lt_toast'; host.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none'; document.body.appendChild(host); }
    const el = document.createElement('div');
    el.textContent = String(msg);
    el.style.cssText = 'background:#12161d;color:#e7e9ee;border:1px solid #2a2f3a;border-radius:8px;padding:10px 14px;font:500 13px system-ui;box-shadow:0 8px 30px rgba(0,0,0,0.4)';
    host.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2600);
  } catch (e) {}
}

// ================= runtime context =================
const LRuntimeCtx = React.createContext<any>(null);
export function useLRuntime() { return React.useContext(LRuntimeCtx); }

export function LRuntimeProvider(props: any) {
  const registryRef = React.useRef<any>({});           // nodeId -> { playAnim, setProp }
  const scopeRef = React.useRef<any>(null);
  if (scopeRef.current === null) {
    const s: any = {};
    (props.variables || []).forEach((v: any) => { s[v.name] = v.initial !== undefined ? v.initial : (v.type === 'number' ? 0 : (v.type === 'boolean' ? false : '')); });
    scopeRef.current = s;
  }
  const pageRoute = (pageId: string) => { const p = (props.pages || []).find((pp: any) => pp.id === pageId); return p ? p.path : null; };
  const runWorkflow = React.useCallback((workflowId: string) => {
    const wf = (props.workflows || []).find((w: any) => w.id === workflowId);
    if (!wf) return;
    execWorkflow(wf, {
      variables: props.variables || [],
      scope: scopeRef.current,
      navigate: (pid: string) => { const r = pageRoute(pid); if (r && props.onNavigate) props.onNavigate(r); },
      setProp: (nid: string, prop: string, val: any) => { const e = registryRef.current[nid]; if (e && e.setProp) e.setProp(prop, val); },
      toast: (msg: any) => showToast(msg),
      playAnim: (nid: string, aid: string) => { const e = registryRef.current[nid]; return !!(e && e.playAnim && e.playAnim(aid)); },
      playPageAnim: () => {},
      callApi: async (req: any) => {
        try {
          const r = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body != null && req.method !== 'GET' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined });
          let b: any = null;
          try { b = await r.json(); } catch (e) { try { b = await r.text(); } catch (e2) {} }
          return { status: r.status, ok: r.ok, body: b };
        } catch (e) { return { status: 0, ok: false, body: null, error: String(e) }; }
      },
    });
  }, [props.workflows, props.pages, props.onNavigate]);
  const dispatch = React.useCallback((action: any) => {
    if (!action) return;
    switch (action.type) {
      case 'navigate': { const r = pageRoute(action.to); if (r && props.onNavigate) props.onNavigate(r); break; }
      case 'url': if (action.to) window.open(action.to, '_blank', 'noopener'); break;
      case 'toast': showToast(action.message || 'Action'); break;
      case 'submit': showToast('Submitted'); break;
      case 'runWorkflow': if (action.workflowId) runWorkflow(action.workflowId); break;
      default: break;
    }
  }, [runWorkflow, props.pages, props.onNavigate]);
  const value = React.useMemo(() => ({ registry: registryRef.current, dispatch, runWorkflow }), [dispatch, runWorkflow]);
  return React.createElement(LRuntimeCtx.Provider, { value }, props.children);
}

// ================= single-active nav groups (menus) =================
// Shared active id per nav group + subscribers, so clicking one menu item re-poses its group-mates
// (single-active). Module-scoped: every LNode in the document coordinates through it. Before any
// click, the item marked navActive shows as active (see renderSustained's fallback).
const LT_NAV: any = { active: {}, subs: {} };
function ltNavSet(group: string, id: string) {
  LT_NAV.active[group] = id;
  const subs = LT_NAV.subs[group];
  if (subs) for (const k in subs) { try { subs[k](); } catch (e) {} }
}

// ================= LNode: interaction + animation wrapper =================
export function LNode(props: any) {
  const rt = useLRuntime();
  const ref = React.useRef<any>(null);
  const rafRef = React.useRef<number>(0);
  const node = props.node;
  const layer = props.layer;
  const baseGeom = (node.geom && (node.geom[layer] || node.geom.desktop)) || { x: 0, y: 0, w: 0, h: 0 };

  const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; } };

  const applyOverrides = (ov: any) => {
    const el = ref.current; if (!el) return;
    const merged = Object.assign({}, node.base, { x: baseGeom.x, y: baseGeom.y, w: baseGeom.w, h: baseGeom.h }, ov);
    for (const k in ov) {
      const v = ov[k];
      if (k === 'x') el.style.left = v + 'px';
      else if (k === 'y') el.style.top = v + 'px';
      else if (k === 'w') el.style.width = v + 'px';
      else if (k === 'h') el.style.height = v + 'px';
      else if (k === 'opacity') el.style.opacity = String(Math.max(0, Math.min(100, v)) / 100);
      else if (k === 'fillColor') el.style.background = v;
      else if (k === 'textColor') el.style.color = v;
      else if (k === 'borderColor') el.style.borderColor = v;
      else if (k === 'borderWidth') el.style.borderWidth = v + 'px';
      else if (k === 'radius') el.style.borderRadius = v + 'px';
    }
    if ('rotation' in ov || 'scale' in ov || 'skewX' in ov || 'skewY' in ov || 'flipH' in ov || 'flipV' in ov) {
      const tf: string[] = [];
      if (merged.rotation) tf.push('rotate(' + merged.rotation + 'deg)');
      const sc = (merged.scale == null ? 100 : merged.scale) / 100;
      const sx = sc * (merged.flipH ? -1 : 1), sy = sc * (merged.flipV ? -1 : 1);
      if (sx !== 1 || sy !== 1) tf.push('scale(' + sx + ', ' + sy + ')');
      if (merged.skewX || merged.skewY) tf.push('skew(' + (merged.skewX || 0) + 'deg, ' + (merged.skewY || 0) + 'deg)');
      el.style.transform = tf.join(' ');
      el.style.transformOrigin = merged.transformOrigin || 'center';
    }
    // Derived paint keys — recomputed from the sampled node so animated gradient / effects / per-corner
    // radii / blend match Preview (which recomputes nodeFx every frame). gradient wins over fillColor.
    if ('gradient' in ov) el.style.background = rtGradientCss(ov.gradient) || merged.fillColor || '';
    if ('effects' in ov) {
      const fx = rtEffectCss(merged);
      el.style.boxShadow = fx.boxShadow.join(', ');
      el.style.filter = fx.filter.join(' ');
      el.style.backdropFilter = fx.backdropFilter.join(' ');
      (el.style as any).WebkitBackdropFilter = fx.backdropFilter.join(' ');
    }
    if ('radii' in ov) el.style.borderRadius = rtRadiusCss(merged) || '';
    if ('blendMode' in ov) el.style.mixBlendMode = (ov.blendMode && ov.blendMode !== 'normal') ? ov.blendMode : '';
  };

  const playAnim = (animId: string, popts?: any) => {
    let st = (node.anim || []).find((s: any) => s.id === animId);
    if (!st) return false;
    st = ensureTracks(st);
    const dur = stateDuration(st) || 0;
    const loop = (popts && popts.loop != null) ? !!popts.loop : !!st.loop;
    const opts = loop ? { wrap: st.loopWrap !== false, duration: dur } : null;
    stop();
    if (ref.current) ref.current.style.transition = 'none';   // JS samples every frame → no CSS tween
    if (dur <= 0) { applyOverrides(sampleTracks(st.tracks || [], 0, opts)); return true; }
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const tick = (now: number) => {
      if (!ref.current) { stop(); return; }
      const elapsed = now - t0;
      const t = loop ? (elapsed % dur) : Math.min(elapsed, dur);
      applyOverrides(sampleTracks(st.tracks || [], t, opts));
      if (loop || elapsed < dur) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = 0;
    };
    rafRef.current = requestAnimationFrame(tick);
    return true;
  };

  // ----- interaction states (hover / press / hold / click / drag) — faithful port of PreviewCanvas's
  // trigger machine, driven imperatively (mutating the element's style) since LNode has no re-render. --
  const STATE_META: any = { dur: 1, ease: 1, off: 1, animId: 1, preset: 1, holdMs: 1, sustain: 1 };
  const stateOf = (key: string) => (node.states && node.states[key]) || null;
  const stEnabled = (key: string) => { const s = stateOf(key); return !(s && s.off); };
  // Legacy node.hover → hoverOn overrides so pre-states projects keep animating.
  const legacyHoverOv = () => {
    const h = node.hover; if (!h) return null;
    const o: any = {};
    if (h.fill) o.fillColor = h.fill;
    if (h.textColor) o.textColor = h.textColor;
    if (h.borderColor) { o.borderColor = h.borderColor; o.borderWidth = (node.base && node.base.borderWidth) || 1; }
    if (h.scale != null && h.scale !== 100) o.scale = h.scale;
    if (h.opacity != null && h.opacity !== 100) o.opacity = h.opacity;
    return Object.keys(o).length ? o : null;
  };
  const overridesOf = (key: string) => {
    const s = stateOf(key);
    if (s) { const o: any = {}; for (const k in s) if (!STATE_META[k]) o[k] = s[k]; return Object.keys(o).length ? o : null; }
    if (key === 'hoverOn') return legacyHoverOv();
    return null;
  };
  const animIdOf = (key: string) => { const s = stateOf(key); return (s && s.animId) || null; };
  const hasContent = (key: string) => { if (animIdOf(key)) return true; const o = overridesOf(key); return !!(o && Object.keys(o).length); };
  const usable = (key: string) => !!key && key !== 'default' && stEnabled(key) && hasContent(key);
  const timingOf = (key: string) => { const s = stateOf(key); return { dur: (s && s.dur != null) ? s.dur : 150, ease: (s && s.ease) || 'ease-out' }; };
  const toggleMode = (node.clickMode || 'toggle') === 'toggle';
  const hasStates = !!(node.states || node.hover);
  const navGroup = node.navGroup || null;   // single-active menu group (see LT_NAV)

  // Autoplay ("play on load") looping animation not bound to any trigger → the resting/idle pose.
  const idleAnimId = (() => {
    const bound: any = {}; if (node.states) for (const k in node.states) { const a = node.states[k] && node.states[k].animId; if (a) bound[a] = 1; }
    const c = (node.anim || []).find((s: any) => s.autoplay && ((s.tracks && s.tracks.length) || (s.frames && s.frames.length)) && !bound[s.id]);
    return c ? c.id : null;
  })();

  const hoverRef = React.useRef(false);
  const pointerRef = React.useRef<string | null>(null);   // 'press' | 'hold' | 'drag'
  const toggledRef = React.useRef(false);
  const holdTimer = React.useRef<any>(0);
  const pulseTimer = React.useRef<any>(0);
  // A workflow-driven ("Play component animation") play takes over the element; while it's active the
  // interaction-state machine (hover/press/click) must NOT clobber it. Without this, the same click
  // that runs the workflow also fires the state machine's onClick -> renderSustained() -> stop(), which
  // cancels the animation the workflow just started (both share rafRef). Mirrors Preview's forcedRef,
  // where a forced animation outranks every trigger and holds until another play replaces it.
  const forcedRef = React.useRef(false);

  // Apply a static pose by assigning the state's fully-baked paint style (computed at codegen with the
  // SAME resolvers Preview uses — nodeBaseStyleObj + mergeState). Assigning the whole style, instead of
  // mutating a hand-picked subset, keeps border/shadow/gradient/radius/transform in lock-step with the
  // fill exactly like Preview — so no stale border ring appears on hover. key is a state key
  // (hoverOn / click / …) or 'default'/null for the resting look. Any paint prop the pose doesn't set is
  // cleared, reverting to the element's own resting inline style (geometry/typography aren't touched).
  const PAINT_KEYS = ['background', 'color', 'border', 'borderRadius',
    'boxShadow', 'filter', 'backdropFilter', 'WebkitBackdropFilter', 'mixBlendMode', 'opacity',
    'transform', 'transformOrigin', 'overflow', 'clipPath', 'WebkitClipPath'];
  const applyStatic = (key: any, timing?: any) => {
    const el = ref.current; if (!el) return;
    const so: any = (key && key !== 'default' && node.stMap && node.stMap[key]) || node.st0 || {};
    if (timing) el.style.transition = 'all ' + timing.dur + 'ms ' + timing.ease;
    for (let i = 0; i < PAINT_KEYS.length; i++) {
      const k = PAINT_KEYS[i]; const v = so[k];
      (el.style as any)[k] = (v == null || v === '') ? '' : v;
    }
  };

  // Sample a bound animation at its END (resting) pose without replaying it — for a sticky/held trigger
  // whose momentary pop has already run.
  const showAnimEnd = (animId: string) => {
    let st = (node.anim || []).find((s: any) => s.id === animId); if (!st) return;
    st = ensureTracks(st); stop();
    applyOverrides(sampleTracks(st.tracks || [], stateDuration(st) || 0, null));
  };

  const SUSTAIN_PLAY: any = { hoverOn: 1, hold: 1, drag: 1 };
  // Resolve the active sustained trigger (pointer > sticky click > hover) and render its pose.
  const renderSustained = () => {
    if (forcedRef.current) return;   // a workflow-driven animation owns the element — don't override it
    let key = 'default';
    const p = pointerRef.current;
    if (p === 'drag' && usable('drag')) key = 'drag';
    else if (p === 'hold' && usable('hold')) key = 'hold';
    else if (p === 'press' && usable('press')) key = 'press';
    else if (navGroup && (LT_NAV.active[navGroup] === node.id || (LT_NAV.active[navGroup] == null && node.navActive)) && usable('click')) key = 'click';
    else if (!navGroup && toggleMode && toggledRef.current && usable('click')) key = 'click';
    else if (hoverRef.current && usable('hoverOn')) key = 'hoverOn';
    if (key === 'default') {
      if (idleAnimId) { playAnim(idleAnimId, { loop: true }); return; }
      stop(); applyStatic('default', timingOf('hoverOff')); return;
    }
    const aid = animIdOf(key);
    if (aid) {
      if (SUSTAIN_PLAY[key]) playAnim(aid, { loop: key === 'hold' ? false : undefined });   // hold clamps on last key
      else showAnimEnd(aid);
      return;
    }
    stop(); applyStatic(key, timingOf(key));
  };

  // Momentary reaction (click / right-click / drop / hover-off / press-pop): play once, then settle.
  const firePulse = (key: string) => {
    if (forcedRef.current) return;   // don't override a workflow-driven animation
    if (!usable(key)) { renderSustained(); return; }
    const aid = animIdOf(key);
    clearTimeout(pulseTimer.current);
    if (aid) {
      playAnim(aid, { loop: false });
      const st = (node.anim || []).find((s: any) => s.id === aid);
      const dur = (st ? stateDuration(st) : 0) || 300;
      pulseTimer.current = setTimeout(renderSustained, Math.max(80, dur) + 30);
    } else {
      applyStatic(key, timingOf(key));
      pulseTimer.current = setTimeout(renderSustained, Math.max(80, timingOf(key).dur) + 30);
    }
  };

  const setPropRuntime = (prop: string, val: any) => {
    const el = ref.current; if (!el) return;
    if (prop === 'label' || prop === 'text') el.textContent = String(val);
    else if (prop === 'fillColor') el.style.background = val;
    else if (prop === 'textColor') el.style.color = val;
  };

  React.useEffect(() => {
    if (rt && rt.registry) rt.registry[node.id] = { playAnim: (aid: string) => { forcedRef.current = true; return playAnim(aid); }, setProp: setPropRuntime };
    return () => { stop(); if (rt && rt.registry && rt.registry[node.id]) delete rt.registry[node.id]; };
  }, [node.id, layer]);

  React.useEffect(() => {
    if (hasStates || idleAnimId) renderSustained();   // resting pose: idle anim, else base
    else { const au = (node.anim || []).find((s: any) => s.autoplay); if (au) playAnim(au.id); }
    return () => { clearTimeout(holdTimer.current); clearTimeout(pulseTimer.current); };
  }, [layer]);

  // Join this node's nav group so a sibling's click re-poses it (active -> resting, and vice versa).
  React.useEffect(() => {
    if (!navGroup) return;
    if (!LT_NAV.subs[navGroup]) LT_NAV.subs[navGroup] = {};
    LT_NAV.subs[navGroup][node.id] = () => renderSustained();
    return () => { if (LT_NAV.subs[navGroup]) delete LT_NAV.subs[navGroup][node.id]; };
  }, [node.id, layer]);

  const child = React.Children.only(props.children);
  const handlers: any = {};
  const add = (name: string, fn: any) => { const prev = handlers[name]; handlers[name] = (e: any) => { if (prev) prev(e); fn(e); }; };
  (node.actions || []).forEach((a: any) => {
    const trig = a.trigger || 'click';
    if (trig === 'click') add('onClick', () => { if (rt) rt.dispatch(a); });
    else if (trig === 'hover') add('onMouseEnter', () => { if (rt) rt.dispatch(a); });
  });

  // Interaction-state event machine (only for nodes that carry states/hover).
  const holdMsOf = () => { const s = stateOf('hold'); return (s && s.holdMs != null) ? s.holdMs : 250; };
  const dragEnabled = hasStates && (usable('drag') || usable('drop'));
  const clickable = hasStates && (usable('click') || usable('press') || usable('hold') || (node.actions || []).some((x: any) => (x.trigger || 'click') === 'click'));
  if (hasStates) {
    add('onMouseEnter', () => { hoverRef.current = true; renderSustained(); });
    add('onMouseLeave', () => {
      hoverRef.current = false; clearTimeout(holdTimer.current); pointerRef.current = null;
      if (usable('hoverOff')) firePulse('hoverOff'); else renderSustained();
    });
    add('onMouseDown', (e: any) => {
      if (e.button !== 0) return;
      pointerRef.current = 'press';
      if (usable('press') && animIdOf('press')) firePulse('press'); else renderSustained();   // anim = momentary pop, static = sustained depress
      clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => { pointerRef.current = 'hold'; renderSustained(); }, holdMsOf());
    });
    add('onMouseUp', () => { clearTimeout(holdTimer.current); pointerRef.current = null; renderSustained(); });
    add('onClick', () => {
      if (navGroup) { ltNavSet(navGroup, node.id); }                                     // single-active: activate this, re-pose group-mates
      else if (toggleMode) { toggledRef.current = !toggledRef.current; renderSustained(); }
      else if (usable('click')) firePulse('click');
    });
    add('onContextMenu', (e: any) => { if (usable('rightClick')) { e.preventDefault(); firePulse('rightClick'); } });
    if (dragEnabled) {
      add('onDragStart', () => { clearTimeout(holdTimer.current); pointerRef.current = 'drag'; renderSustained(); });
      add('onDragEnd', () => { pointerRef.current = null; if (usable('drop')) firePulse('drop'); else renderSustained(); });
    }
  }

  const extra: any = Object.assign({}, handlers, { ref: (el: any) => { ref.current = el; } });
  if (dragEnabled) extra.draggable = true;
  const cur = clickable ? 'pointer' : (dragEnabled ? 'grab' : null);
  if (cur || (node.actions || []).length) extra.style = Object.assign({}, child.props.style, { cursor: cur || 'pointer' });
  return React.cloneElement(child, extra);
}
`;
}

// ---------- scaffold ----------

function genPackageJson(name) {
  return JSON.stringify({
    name: slug(name), private: true, version: '0.0.0', type: 'module',
    scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: {
      '@types/react': '^18.3.3', '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.3.1', typescript: '^5.5.3', vite: '^5.4.0',
    },
  }, null, 2) + '\n';
}
function genIndexHtml(name) {
  return '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>' + (name || 'Lattice app') + '</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n';
}
function genViteConfig() {
  return "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n});\n";
}
function genTsconfig() {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020', useDefineForClassFields: true, lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler',
      allowImportingTsExtensions: true, resolveJsonModule: true, isolatedModules: true,
      noEmit: true, jsx: 'react-jsx', strict: true, noUnusedLocals: false, noUnusedParameters: false,
    },
    include: ['src'], references: [{ path: './tsconfig.node.json' }],
  }, null, 2) + '\n';
}
function genTsconfigNode() {
  return JSON.stringify({
    compilerOptions: { composite: true, skipLibCheck: true, module: 'ESNext', moduleResolution: 'bundler', allowSyntheticDefaultImports: true },
    include: ['vite.config.ts'],
  }, null, 2) + '\n';
}
function genMainTsx() {
  return "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n";
}
// App.tsx = the responsive "stage": a device toolbar (desktop/tablet/mobile + desktop screen-types +
// rotate + page nav) over a fixed-size artboard that is scaled to fit the window and centered, so the
// running app fills the screen at any size with no scrollbars — matching what each editor device shows.
// The baked INITIAL_* reflect the editor's active device/screen-type at generate time (auto by width
// when empty). Pages receive the active geometry layer via the `layer` prop.
// When config.chrome === false (the "Web" run) SHOW_TOOLBAR is baked false: the toolbar is dropped and
// the page renders standalone, its layout following the window width live like a real responsive site.
function genAppTsx(meta, config, runtime) {
  config = config || {};
  runtime = runtime || { workflows: [], variables: [] };
  const list = meta.length ? meta : [{ name: 'Home', route: '/', comp: 'Home' }];
  const imports = list.map(m => "import " + m.comp + " from './pages/" + m.comp + "';").join('\n');
  const routes = list.map(m => '  { path: ' + JSON.stringify(m.route) + ', name: ' + JSON.stringify(m.name) + ', id: ' + JSON.stringify(m.id) + ', Comp: ' + m.comp + ' }').join(',\n');
  const responsiveLit = config.responsive === false ? 'false' : 'true';
  const chromeLit = config.chrome === false ? 'false' : 'true';   // false => standalone web (no toolbar)
  const initDevice = config.device && config.device !== 'custom' ? config.device : '';
  const initPreset = config.preset || 'std';
  const initOrient = config.orientation || '';
  const workflowsJson = JSON.stringify(runtime.workflows || []);
  const variablesJson = JSON.stringify(runtime.variables || []);
  return `import React from 'react';
import { LRuntimeProvider } from './runtime';
${imports}

const pages = [
${routes}
];

// Interactions/workflows/animations authored in the editor, baked in so Run/Web/export behave like
// Preview: an action runs a workflow, a workflow can play a component's animation, etc.
const WORKFLOWS = ${workflowsJson};
const VARIABLES = ${variablesJson};

// Device frames (px). Desktop resolves to a screen-type preset; tablet/mobile are fixed.
const DEVICE: Record<string, { w: number; h: number }> = { desktop: { w: 1440, h: 1024 }, tablet: { w: 820, h: 1180 }, mobile: { w: 390, h: 844 } };
const DESKTOP_PRESETS = [
  { id: 'std', label: 'Standard (5:4)', w: 1440, h: 1024 },
  { id: 'fhd', label: '16:9 · FHD', w: 1920, h: 1080 },
  { id: 'wxga', label: '16:10', w: 1680, h: 1050 },
  { id: 'uxga', label: '4:3', w: 1440, h: 1080 },
  { id: 'uw', label: '21:9 · Ultrawide', w: 2560, h: 1080 },
  { id: 'sq', label: '1:1 · Square', w: 1080, h: 1080 },
];
const RESPONSIVE = ${responsiveLit};
const SHOW_TOOLBAR = ${chromeLit};   // false => standalone web render: just the page, no device toolbar
const INITIAL_DEVICE = ${JSON.stringify(initDevice)};   // '' => auto-pick by window width
const INITIAL_PRESET = ${JSON.stringify(initPreset)};
const INITIAL_ORIENT = ${JSON.stringify(initOrient)};   // '' => landscape (portrait on mobile)

const presetSize = (id: string) => DESKTOP_PRESETS.find((p) => p.id === id) || DESKTOP_PRESETS[0];
const artboardSize = (device: string, preset: string, orient: string) => {
  const b = device === 'desktop' ? presetSize(preset) : (DEVICE[device] || DEVICE.desktop);
  const lo = Math.max(b.w, b.h), sh = Math.min(b.w, b.h);
  return orient === 'portrait' ? { w: sh, h: lo } : { w: lo, h: sh };
};
// The geometry layer a device reads from the pages (mirrors the editor's geomDeviceKey).
const layerKey = (device: string, preset: string) => device === 'desktop' ? (preset && preset !== 'std' ? 'desktop:' + preset : 'desktop') : device;
// Orientation is remembered per device/screen-type (like the editor); mobile defaults to portrait.
const orientKeyFor = (device: string, preset: string) => device === 'desktop' ? 'desktop:' + (preset || 'std') : device;
const defaultOrient = (device: string) => device === 'mobile' ? 'portrait' : 'landscape';
const autoDevice = () => { const w = window.innerWidth; if (RESPONSIVE && w < 768) return 'mobile'; if (RESPONSIVE && w < 1024) return 'tablet'; return 'desktop'; };
const BOOT_DEVICE = INITIAL_DEVICE || autoDevice();

export default function App() {
  const [hash, setHash] = React.useState(() => window.location.hash.slice(1) || pages[0].path);
  React.useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1) || pages[0].path);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const [device, setDevice] = React.useState(BOOT_DEVICE);
  const [preset, setPreset] = React.useState(INITIAL_PRESET);
  const [orientMap, setOrientMap] = React.useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    m[orientKeyFor(BOOT_DEVICE, INITIAL_PRESET)] = INITIAL_ORIENT || defaultOrient(BOOT_DEVICE);
    return m;
  });
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const ok = orientKeyFor(device, preset);
  const orient = orientMap[ok] || defaultOrient(device);
  const rotate = () => setOrientMap((m) => { const next = Object.assign({}, m); next[ok] = orient === 'portrait' ? 'landscape' : 'portrait'; return next; });
  const art = artboardSize(device, preset, orient);

  // Fit the artboard inside the stage (contain). The toolbar view keeps a margin around the frame;
  // the standalone view fills edge-to-edge. Re-fits on resize.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const pad = SHOW_TOOLBAR ? 48 : 0;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const s = Math.min((r.width - pad) / art.w, (r.height - pad) / art.h, 1);
      setScale(s > 0 ? s : 0.1);
    };
    fit();
    const RO = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null;
    const ro = RO ? new RO(fit) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', fit);
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit); };
  }, [art.w, art.h]);

  // Standalone web has no device buttons, so the layout follows the window width live (like a real
  // responsive site): mobile / tablet / desktop breakpoints swap as you resize.
  React.useEffect(() => {
    if (SHOW_TOOLBAR) return;
    const on = () => setDevice(autoDevice());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const current = pages.find((p) => p.path === hash) || pages[0];
  const Current = current.Comp;
  const lk = layerKey(device, preset);

  const devBtn = (id: string, label: string) => (
    <button key={id} onClick={() => setDevice(id)} style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid ' + (device === id ? 'var(--border-strong)' : 'var(--border-default)'), background: device === id ? 'var(--surface-hover)' : 'transparent', color: device === id ? 'var(--text-primary)' : 'var(--text-secondary)', font: '500 12px system-ui', cursor: 'pointer' }}>{label}</button>
  );

  return (
    <LRuntimeProvider workflows={WORKFLOWS} variables={VARIABLES} pages={pages} onNavigate={(r: string) => setHash(r)}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: SHOW_TOOLBAR ? 'var(--surface-inset)' : 'var(--bg-app)' }}>
      {SHOW_TOOLBAR && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)', flexWrap: 'wrap' }}>
          {pages.length > 1 && (
            <nav style={{ display: 'flex', gap: 4, marginRight: 6 }}>
              {pages.map((p) => (
                <a key={p.path} href={'#' + p.path} style={{ padding: '5px 9px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: p.path === current.path ? 600 : 400, color: p.path === current.path ? 'var(--text-primary)' : 'var(--text-muted)', background: p.path === current.path ? 'var(--surface-hover)' : 'transparent' }}>{p.name}</a>
              ))}
            </nav>
          )}
          {RESPONSIVE && (<div style={{ display: 'flex', gap: 4 }}>{devBtn('desktop', 'Desktop')}{devBtn('tablet', 'Tablet')}{devBtn('mobile', 'Mobile')}</div>)}
          {device === 'desktop' && (
            <select value={preset} onChange={(e) => setPreset(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-secondary)', font: '500 12px system-ui', cursor: 'pointer' }}>
              {DESKTOP_PRESETS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          )}
          <button onClick={rotate} title="Rotate" style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', font: '500 12px system-ui', cursor: 'pointer' }}>Rotate</button>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', font: '500 12px system-ui' }}>{art.w + ' × ' + art.h + '  ·  ' + Math.round(scale * 100) + '%'}</span>
        </div>
      )}
      <div ref={stageRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: art.w, height: art.h, transform: 'translate(-50%, -50%) scale(' + scale + ')', transformOrigin: 'center center', background: 'var(--bg-app)', boxShadow: SHOW_TOOLBAR ? '0 0 0 1px var(--border-default), 0 24px 70px rgba(0, 0, 0, 0.45)' : 'none', overflow: 'hidden' }}>
          <Current layer={lk} />
        </div>
      </div>
    </div>
    </LRuntimeProvider>
  );
}
`;
}
// The generated app's global stylesheet. Emits the REAL Lattice design tokens (values mirror
// tokens/*.css) so any color/border/shadow/font authored as `var(--token)` in the editor resolves
// identically in Run/Web/export — the picker offers the full neutral ramp + white + semantic hues, so
// the whole set must be defined here (an earlier hand-rolled approximation both dropped tokens like
// `--neutral-900`/`--white` and used off values, making token colors drift once exported).
function genIndexCss(fontFaceCss) {
  const faces = fontFaceCss ? '\n/* Fonts uploaded in the editor. */\n' + fontFaceCss + '\n' : '';
  return "@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');\n" + faces + `
/* ============================================================
   Design tokens — the Lattice design system (matches the editor 1:1).
   ============================================================ */
:root {
  /* Neutral ramp (the whole brand lives here) */
  --neutral-0: #050506; --neutral-50: #0a0a0c; --neutral-100: #111114; --neutral-150: #161619;
  --neutral-200: #1c1c20; --neutral-300: #26262b; --neutral-400: #34343b; --neutral-500: #46464f;
  --neutral-600: #6b6b76; --neutral-700: #8e8e99; --neutral-800: #b8b8c0; --neutral-900: #e7e7ea;
  --neutral-950: #fafafa; --white: #ffffff;
  /* Semantic hues (muted) */
  --green-base: #5fb88a; --green-dim: #1c2c24; --amber-base: #d6a44a; --amber-dim: #2c2517;
  --red-base: #df6b63; --red-dim: #2e1c1c; --blue-base: #6c93d6; --blue-dim: #1a2333;
  /* Backgrounds & surfaces */
  --bg-app: var(--neutral-50); --bg-void: var(--neutral-0); --surface: var(--neutral-100);
  --surface-raised: var(--neutral-150); --surface-card: var(--neutral-200);
  --surface-hover: var(--neutral-300); --surface-inset: var(--neutral-0);
  /* Text */
  --text-primary: var(--neutral-900); --text-secondary: var(--neutral-700);
  --text-muted: var(--neutral-600); --text-disabled: var(--neutral-500); --text-inverse: var(--neutral-50);
  /* Borders */
  --border-subtle: var(--neutral-300); --border-default: var(--neutral-400);
  --border-strong: var(--neutral-500); --border-focus: var(--neutral-950);
  --border-hairline: 1px solid var(--border-subtle); --border-line: 1px solid var(--border-default);
  /* Action (monochrome: white-on-black) */
  --action-solid: var(--neutral-950); --action-solid-hover: var(--white);
  --action-solid-text: var(--neutral-50); --action-ghost-hover: var(--neutral-300);
  /* Status */
  --status-success-fg: var(--green-base); --status-success-bg: var(--green-dim);
  --status-warning-fg: var(--amber-base); --status-warning-bg: var(--amber-dim);
  --status-danger-fg: var(--red-base); --status-danger-bg: var(--red-dim);
  --status-info-fg: var(--blue-base); --status-info-bg: var(--blue-dim);
  --ring: rgba(250,250,250,0.55); --selection-bg: rgba(250,250,250,0.16);
  /* Effects */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4); --shadow-md: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-lg: 0 24px 64px rgba(0,0,0,0.6); --shadow-overlay: 0 16px 48px rgba(0,0,0,0.7);
  --focus-ring: 0 0 0 1px var(--bg-app), 0 0 0 3px var(--ring);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 120ms; --dur-base: 180ms; --dur-slow: 280ms;
  --blur-overlay: saturate(120%) blur(12px); --grid-line: rgba(255,255,255,0.035);
  /* Radius */
  --radius-none: 0px; --radius-sm: 0px; --radius-md: 0px; --radius-lg: 0px;
  --radius-pill: 999px; --radius-full: 9999px;
  /* Typography */
  --font-serif-display: 'Newsreader', 'Times New Roman', serif;
  --font-sans: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
  --text-display-2xl: 72px; --text-display-xl: 56px; --text-display-lg: 44px; --text-display-md: 34px;
  --text-h1: 28px; --text-h2: 22px; --text-h3: 18px; --text-body-lg: 16px; --text-body: 14px;
  --text-sm: 13px; --text-xs: 11px; --text-mono: 13px;
  --leading-tight: 1.05; --leading-snug: 1.2; --leading-normal: 1.5; --leading-relaxed: 1.65;
  --tracking-tight: -0.02em; --tracking-snug: -0.01em; --tracking-normal: 0;
  --tracking-wide: 0.04em; --tracking-caps: 0.12em;
  /* Spacing (4px grid) */
  --space-0: 0; --space-px: 1px; --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-20: 80px; --space-24: 96px; --space-32: 128px;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body { margin: 0; background: var(--bg-app); color: var(--text-primary); font-family: var(--font-sans); font-size: var(--text-body); line-height: var(--leading-normal); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
h1, h2, h3, h4, h5, h6, p { margin: 0; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font-family: inherit; font-size: inherit; color: inherit; }
::selection { background: var(--selection-bg); color: var(--text-primary); }
`;
}
// @font-face rules for the exported project: reference each font asset by its relative path from
// src/index.css (e.g. url('./assets/fonts/Inter-Bold.woff2')).
function exportFontFaceCss(assets) {
  if (!window.latticeFontFaceCss) return '';
  return window.latticeFontFaceCss(assets, a => "'./" + a.path.replace(/^src\//, '') + "'");
}
function genGitignore() { return "node_modules\ndist\ndist-ssr\n*.local\n.DS_Store\n.vscode/*\n!.vscode/extensions.json\n"; }
function genReadme(name) {
  return '# ' + (name || 'Lattice app') + '\n\nExported from **Lattice**. A Vite + React + TypeScript app.\n\n## Getting started\n\n```bash\nnpm install\nnpm run dev\n```\n\nThen open the printed local URL.\n\n## Structure\n\n- `src/pages/*` — one component per Lattice page. Each element carries its per-device geometry and\n  renders the layout for the active device via the `layer` prop.\n- `src/App.tsx` — the responsive stage: a device toolbar (desktop/tablet/mobile + desktop screen-types\n  + rotate) over a fixed-size artboard that is scaled to fit the window and centered (no scrollbars),\n  plus a hash router across the pages. Auto-picks the device by window width on load.\n- `src/assets/*` — images and other binaries you added in the editor.\n- `src/index.css` — design tokens + reset.\n\n> Generated pages are a faithful starting point (position, size, fill, border, radius, shadow, text,\n> images) per device. Refine them into idiomatic, reflowing components as you go.\n';
}

function scaffoldFiles(pages, projectName, assets) {
  return [
    { path: 'package.json', content: genPackageJson(projectName) },
    { path: 'index.html', content: genIndexHtml(projectName) },
    { path: 'vite.config.ts', content: genViteConfig() },
    { path: 'tsconfig.json', content: genTsconfig() },
    { path: 'tsconfig.node.json', content: genTsconfigNode() },
    { path: '.gitignore', content: genGitignore() },
    { path: 'README.md', content: genReadme(projectName) },
    { path: 'src/main.tsx', content: genMainTsx() },
    { path: 'src/index.css', content: genIndexCss(exportFontFaceCss(assets)) },
  ];
}

// ---------- zip (store / no compression) ----------

function crc32(u8) {
  let table = crc32._t;
  if (!table) {
    table = crc32._t = [];
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); table[n] = c >>> 0; }
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < u8.length; i++) crc = (crc >>> 8) ^ table[(crc ^ u8[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}
function strToU8(str) { return new TextEncoder().encode(str); }
function dataUrlToU8(dataUrl) {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
// A filename extension for a clipboard image blob (which often arrives nameless), by MIME type.
function mimeExt(mime) {
  return ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp',
    'image/svg+xml': '.svg', 'image/avif': '.avif', 'image/bmp': '.bmp' })[mime] || '.png';
}
function zipBlob(entries) {
  const u16 = (n) => [n & 0xFF, (n >>> 8) & 0xFF];
  const u32 = (n) => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  const enc = new TextEncoder();
  const chunks = []; const central = []; let offset = 0;
  entries.forEach(e => {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data); const size = e.data.length;
    const local = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0)));
    chunks.push(local, nameBytes, e.data);
    const cd = new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)));
    central.push(cd, nameBytes);
    offset += local.length + nameBytes.length + e.data.length;
  });
  let cdSize = 0; central.forEach(c => { cdSize += c.length; });
  const end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(cdSize), u32(offset), u16(0)));
  return new Blob(chunks.concat(central, [end]), { type: 'application/zip' });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadText(filename, text) { downloadBlob(filename, new Blob([text], { type: 'text/plain;charset=utf-8' })); }

// Every file the exported project should contain: scaffold-defaults < generated < user assets.
// `config` = { device, preset, orientation, responsive } sets App.tsx's initial device/screen-type.
function fullProjectFiles(pages, assets, projectName, config) {
  const map = {};
  scaffoldFiles(pages, projectName, assets).forEach(f => { map[f.path] = { text: f.content }; });
  generatedFiles(pages, config).forEach(f => { map[f.path] = { text: f.content }; });
  (assets || []).forEach(a => {
    if (a.type === 'folder') return;
    map[a.path] = a.dataUrl ? { dataUrl: a.dataUrl } : { text: a.content || '' };
  });
  return Object.keys(map).sort().map(path => ({ name: path, data: map[path].dataUrl ? dataUrlToU8(map[path].dataUrl) : strToU8(map[path].text) }));
}

// Text / dataURL map of every project file (scaffold-defaults < generated < user assets), keyed by
// path — the in-browser run engine compiles & executes exactly THIS source, so a successful run implies
// a successful export. `config` sets App.tsx's initial device. Exposed on window for RunEngine.jsx.
function projectFileMap(pages, projectName, assets, config) {
  const map = {};
  scaffoldFiles(pages, projectName, assets).forEach(f => { map[f.path] = { text: f.content }; });
  generatedFiles(pages, config).forEach(f => { map[f.path] = { text: f.content }; });
  (assets || []).forEach(a => {
    if (a.type === 'folder') return;
    map[a.path] = a.dataUrl ? { dataUrl: a.dataUrl } : { text: a.content || '' };
  });
  return map;
}
window.latticeProjectFileMap = projectFileMap;

// ---------- tree ----------

function buildTree(entries) {
  const root = { name: '', path: '', dir: true, children: {} };
  const put = (path, isDir, meta) => {
    const parts = path.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const cur = node.children[part];
      if (!cur) {
        node.children[part] = { name: part, path: parts.slice(0, i + 1).join('/'), dir: last ? isDir : true, children: {}, meta: last ? meta : null };
      } else if (last) {
        cur.dir = isDir; cur.meta = meta || cur.meta;
      }
      node = node.children[part];
    });
  };
  entries.forEach(e => put(e.path, e.type === 'folder', e));
  return root;
}
function sortedChildren(node) {
  return Object.values(node.children).sort((a, b) => (a.dir === b.dir) ? a.name.localeCompare(b.name) : (a.dir ? -1 : 1));
}
const IMG_RE = /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i;
function fileIcon(name) {
  if (/\.(woff2?|ttf|otf)$/i.test(name)) return 'type';
  if (IMG_RE.test(name)) return 'image';
  if (/\.(tsx|ts|jsx|js)$/.test(name)) return 'file-code';
  if (/\.css$/.test(name)) return 'palette';
  if (/\.json$/.test(name)) return 'braces';
  if (/\.md$/i.test(name)) return 'file-text';
  return 'file';
}

// ---------- component ----------

function CodePanel({ pages, activePageId, assets, onChangeAssets, projectName, settings, workflows = [], variables = [] }) {
  const { Button, Tag, Dialog, Input } = window.LatticeDesignSystem_e801cb;
  assets = assets || [];
  const setAssets = onChangeAssets || (() => {});

  const [railW, setRailW] = React.useState(() => {
    const n = parseInt(localStorage.getItem('lattice_code_rail') || '', 10);
    return isNaN(n) ? 250 : Math.max(180, Math.min(560, n));
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_code_rail', String(railW)); } catch (e) {} }, [railW]);

  // App.tsx's initial device in the code view / export: the project's desktop screen-type, device
  // auto-picked by width at runtime. (Run threads the editor's live device — see App.jsx.)
  const appConfig = React.useMemo(() => ({
    device: '', preset: (settings && settings.desktopPreset) || 'std', orientation: '',
    responsive: !settings || settings.responsive !== false,
    workflows, variables,
  }), [settings && settings.desktopPreset, settings && settings.responsive, workflows, variables]);
  const gen = React.useMemo(() => generatedFiles(pages, appConfig), [pages, appConfig]);
  const hasScaffold = assets.some(a => a.path === 'package.json');

  // Merge generated (read-only) + assets (editable). Assets override generated at the same path.
  const displayEntries = React.useMemo(() => {
    const byPath = {};
    gen.forEach(f => { byPath[f.path] = { path: f.path, type: 'file', generated: true }; });
    assets.forEach(a => { byPath[a.path] = { path: a.path, type: a.type, mime: a.mime, generated: false }; });
    return Object.values(byPath);
  }, [gen, assets]);
  const tree = React.useMemo(() => buildTree(displayEntries), [displayEntries]);

  const defaultSel = React.useMemo(() => {
    const meta = pageMetaOf(pages);
    const act = meta.find(m => m.id === activePageId) || meta[0];
    return act ? 'src/pages/' + act.comp + '.tsx' : (gen[0] && gen[0].path) || '';
  }, [pages, activePageId, gen]);

  const [selPath, setSelPath] = React.useState(defaultSel);
  React.useEffect(() => { if (!displayEntries.some(e => e.path === selPath && e.type === 'file')) setSelPath(defaultSel); }, [defaultSel]); // eslint-disable-line
  const [expanded, setExpanded] = React.useState(() => ({ src: true, 'src/pages': true, 'src/assets': true }));
  const [copied, setCopied] = React.useState(false);
  const [dlg, setDlg] = React.useState(null); // { mode:'file'|'folder'|'rename', parent, path } + value
  const [dlgVal, setDlgVal] = React.useState('');
  const fileInputRef = React.useRef(null);
  const uploadTargetRef = React.useRef('src/assets');

  // Repaint tree/file icons after any structural change (idempotent).
  React.useEffect(() => { const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 0); return () => clearTimeout(t); });

  // Resolve the currently selected file to viewable content.
  const selAsset = assets.find(a => a.path === selPath && a.type === 'file');
  const selGen = !selAsset && gen.find(f => f.path === selPath);
  const selContent = selAsset ? (selAsset.dataUrl ? null : (selAsset.content || '')) : (selGen ? selGen.content : null);
  const selIsImage = selAsset && !!selAsset.dataUrl;
  const selEditable = !!selAsset && !selAsset.dataUrl;

  // ----- asset mutations -----
  const commit = (next) => setAssets(next);
  const pathExists = (p) => assets.some(a => a.path === p) || gen.some(f => f.path === p);
  const addTextFile = (parent, name) => {
    const path = (parent ? parent + '/' : '') + name;
    if (pathExists(path)) return;
    commit(assets.concat([{ id: 'as_' + Date.now().toString(36), path, type: 'file', content: '' }]));
    setSelPath(path);
  };
  const addFolder = (parent, name) => {
    const path = (parent ? parent + '/' : '') + name;
    if (assets.some(a => a.path === path)) return;
    commit(assets.concat([{ id: 'as_' + Date.now().toString(36), path, type: 'folder' }]));
    setExpanded(e => Object.assign({}, e, { [path]: true }));
  };
  const setFileContent = (path, content) => commit(assets.map(a => a.path === path ? Object.assign({}, a, { content }) : a));
  const removePath = (path) => {
    commit(assets.filter(a => a.path !== path && a.path.indexOf(path + '/') !== 0));
    if (selPath === path || selPath.indexOf(path + '/') === 0) setSelPath(defaultSel);
  };
  const renamePath = (path, newName) => {
    const parent = path.split('/').slice(0, -1).join('/');
    const to = (parent ? parent + '/' : '') + newName;
    if (pathExists(to)) return;
    commit(assets.map(a => {
      if (a.path === path) return Object.assign({}, a, { path: to });
      if (a.path.indexOf(path + '/') === 0) return Object.assign({}, a, { path: to + a.path.slice(path.length) });
      return a;
    }));
    if (selPath === path) setSelPath(to);
  };

  // Read binary File/Blobs into the assets tree under `parent` (deduping names) — shared by the Upload
  // picker and clipboard paste. Ensures the target folder exists so a paste works before Initialize.
  const ingestFiles = (fileList, parent) => {
    const files = Array.from(fileList || []).filter(Boolean);
    parent = parent || 'src/assets';
    if (!files.length) return;
    let added = assets.slice();
    if (parent === 'src/assets' && !added.some(a => a.path === 'src/assets') && !gen.some(f => f.path === 'src/assets')) {
      added = added.concat([{ id: 'as_assets_' + Date.now().toString(36), path: 'src/assets', type: 'folder' }]);
    }
    let lastPath = ''; let pending = files.length; let seq = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawName = (file.name && file.name.trim()) || ('pasted-' + Date.now().toString(36) + mimeExt(file.type));
        let base = rawName.replace(/[^a-zA-Z0-9._-]+/g, '-');
        let path = parent + '/' + base; let i = 1;
        while (added.some(a => a.path === path)) { path = parent + '/' + base.replace(/(\.[^.]+)?$/, '-' + (i++) + '$1'); }
        added = added.concat([{ id: 'as_' + Date.now().toString(36) + '_' + (seq++), path, type: 'file', mime: file.type, dataUrl: reader.result }]);
        lastPath = path;
        if (--pending === 0) { commit(added); setExpanded(x => Object.assign({}, x, { [parent]: true, src: true })); setSelPath(lastPath); }
      };
      reader.readAsDataURL(file);
    });
  };

  const doUpload = (e) => { ingestFiles(e.target.files, uploadTargetRef.current || 'src/assets'); e.target.value = ''; };
  const triggerUpload = (parent) => { uploadTargetRef.current = parent || 'src/assets'; if (fileInputRef.current) fileInputRef.current.click(); };

  // Where a pasted image lands: an explicitly selected folder, else src/assets (the sensible default —
  // images shouldn't scatter into whatever code file happened to be open). Per-folder "Paste here" passes
  // its own target. Note folders aren't selectable in this tree today, so this resolves to src/assets.
  const pasteTargetFolder = () => {
    if (selPath) {
      const sel = assets.find(a => a.path === selPath);
      if (sel && sel.type === 'folder') return selPath;
    }
    return 'src/assets';
  };
  // Pull image files out of a DataTransfer (paste or drop). Returns true if any were ingested.
  const ingestImagesFrom = (dt) => {
    if (!dt) return false;
    const imgs = [];
    if (dt.files && dt.files.length) Array.from(dt.files).forEach(f => { if (/^image\//.test(f.type)) imgs.push(f); });
    if (!imgs.length && dt.items) Array.from(dt.items).forEach(it => { if (it.kind === 'file' && /^image\//.test(it.type || '')) { const f = it.getAsFile(); if (f) imgs.push(f); } });
    if (!imgs.length) return false;
    ingestFiles(imgs, pasteTargetFolder());
    return true;
  };
  // Toolbar button: read images straight from the OS clipboard (async Clipboard API, Chromium).
  // `targetFolder` is explicit for per-folder "Paste here" (selPath state updates lag a click).
  const pasteFromClipboard = async (targetFolder) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return;
      const items = await navigator.clipboard.read();
      const imgs = [];
      for (const it of items) {
        const type = (it.types || []).find(t => /^image\//.test(t));
        if (type) { const blob = await it.getType(type); imgs.push(new File([blob], 'pasted' + mimeExt(type), { type })); }
      }
      if (imgs.length) ingestFiles(imgs, targetFolder || pasteTargetFolder());
    } catch (e) { /* clipboard empty, not an image, or permission denied */ }
  };
  // Ctrl/⌘-V anywhere on the Code page drops copied images into assets (Telegram-style). Only acts when
  // the clipboard actually carries an image, so normal text paste into the code editor is untouched.
  React.useEffect(() => {
    const onPaste = (e) => { if (ingestImagesFrom(e.clipboardData)) e.preventDefault(); };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [assets, selPath, gen]); // eslint-disable-line

  const initProject = () => {
    const existing = new Set(assets.map(a => a.path));
    const additions = scaffoldFiles(pages, projectName, assets).filter(f => !existing.has(f.path))
      .map(f => ({ id: 'as_' + Math.random().toString(36).slice(2), path: f.path, type: 'file', content: f.content }));
    // ensure src/assets folder exists for uploads
    if (!assets.some(a => a.path === 'src/assets')) additions.push({ id: 'as_assets', path: 'src/assets', type: 'folder' });
    if (additions.length) commit(assets.concat(additions));
    setExpanded(e => Object.assign({}, e, { src: true, 'src/pages': true, 'src/assets': true }));
  };

  const exportZip = () => downloadBlob(slug(projectName) + '.zip', zipBlob(fullProjectFiles(pages, assets, projectName, appConfig)));

  const handleCopy = () => {
    if (selContent == null) return;
    const text = selContent;
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const handleExportOne = () => {
    if (selIsImage) return downloadBlob(selPath.split('/').pop(), new Blob([dataUrlToU8(selAsset.dataUrl)], { type: selAsset.mime || 'application/octet-stream' }));
    if (selContent != null) downloadText(selPath.split('/').pop(), selContent);
  };

  // ----- dialog helpers -----
  const openNew = (mode, parent) => { setDlg({ mode, parent }); setDlgVal(''); };
  const openRename = (path) => { setDlg({ mode: 'rename', path }); setDlgVal(path.split('/').pop()); };
  const submitDlg = () => {
    const v = dlgVal.trim(); if (!v) { setDlg(null); return; }
    if (dlg.mode === 'file') addTextFile(dlg.parent, v);
    else if (dlg.mode === 'folder') addFolder(dlg.parent, v);
    else if (dlg.mode === 'rename') renamePath(dlg.path, v);
    setDlg(null);
  };

  // ----- resizer -----
  const startResize = (e) => {
    e.preventDefault();
    const sx = e.clientX, cur = railW;
    const move = (ev) => setRailW(Math.max(180, Math.min(560, Math.round(cur + (ev.clientX - sx)))));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };

  // ----- tree rendering -----
  const rowBtn = { display: 'flex', alignItems: 'center', gap: 6, width: '100%', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontFamily: 'var(--font-mono)', padding: '4px 6px', color: 'var(--text-secondary)' };
  const iconBtn = (icon, title, onClick) => (
    <button type="button" title={title} onClick={onClick}
      style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 4 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
      <i data-lucide={icon} style={{ width: 13, height: 13 }}></i>
    </button>
  );

  const renderNode = (node, depth) => {
    const pad = 6 + depth * 12;
    if (node.dir) {
      const open = expanded[node.path] !== false && (expanded[node.path] || depth < 1 || node.path === 'src' || node.path === 'src/pages' || node.path === 'src/assets');
      const isOpen = expanded[node.path] != null ? expanded[node.path] : open;
      return (
        <div key={node.path || 'root'}>
          {node.path !== '' && (
            <div className="lt-tree-row" style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => setExpanded(e => Object.assign({}, e, { [node.path]: !isOpen }))}
                style={Object.assign({}, rowBtn, { paddingLeft: pad, color: 'var(--text-primary)', fontWeight: 500 })}>
                <i data-lucide={isOpen ? 'chevron-down' : 'chevron-right'} style={{ width: 12, height: 12, opacity: 0.7 }}></i>
                <i data-lucide={isOpen ? 'folder-open' : 'folder'} style={{ width: 13, height: 13, opacity: 0.8 }}></i>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
              </button>
              <span className="lt-row-actions" style={{ display: 'flex', flex: 'none', opacity: 0 }}>
                {iconBtn('file-plus', 'New file', () => openNew('file', node.path))}
                {iconBtn('upload', 'Upload here', () => triggerUpload(node.path))}
                {iconBtn('clipboard-paste', 'Paste image here', () => pasteFromClipboard(node.path))}
                {!node.meta || node.meta.generated ? null : iconBtn('trash-2', 'Delete', () => removePath(node.path))}
              </span>
            </div>
          )}
          {isOpen && sortedChildren(node).map(c => renderNode(c, node.path === '' ? 0 : depth + 1))}
        </div>
      );
    }
    const selected = node.path === selPath;
    const isGen = node.meta && node.meta.generated;
    return (
      <div key={node.path} className="lt-tree-row" style={{ display: 'flex', alignItems: 'center', background: selected ? 'var(--surface-hover)' : 'transparent' }}>
        <button type="button" onClick={() => setSelPath(node.path)}
          style={Object.assign({}, rowBtn, { paddingLeft: pad + 14, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' })}>
          <i data-lucide={fileIcon(node.name)} style={{ width: 13, height: 13, opacity: 0.75 }}></i>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          {isGen && <span style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: '0.08em' }}>gen</span>}
        </button>
        {!isGen && (
          <span className="lt-row-actions" style={{ display: 'flex', flex: 'none', opacity: 0 }}>
            {iconBtn('pencil', 'Rename', () => openRename(node.path))}
            {iconBtn('trash-2', 'Delete', () => removePath(node.path))}
          </span>
        )}
      </div>
    );
  };

  const langTag = selIsImage ? 'Image' : /\.css$/.test(selPath) ? 'CSS' : /\.(tsx|ts)$/.test(selPath) ? 'React + TS' : /\.json$/.test(selPath) ? 'JSON' : /\.md$/i.test(selPath) ? 'Markdown' : 'Text';

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', background: 'var(--bg-app)', position: 'relative' }}>
      <style>{'.lt-tree-row:hover .lt-row-actions{opacity:1 !important}.lt-tree-row:hover{background:var(--surface-hover)}'}</style>
      <input ref={fileInputRef} type="file" accept="image/*,.svg,.woff,.woff2,.ttf,.otf" multiple style={{ display: 'none' }} onChange={doUpload} />

      {/* File explorer rail (resizable) */}
      <div style={{ width: railW, flex: 'none', borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 8px 8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', flex: 1 }}>Explorer</span>
          {iconBtn('file-plus', 'New file', () => openNew('file', 'src'))}
          {iconBtn('folder-plus', 'New folder', () => openNew('folder', 'src'))}
          {iconBtn('image-plus', 'Upload asset (image, SVG, font)', () => triggerUpload('src/assets'))}
          {iconBtn('clipboard-paste', 'Paste image from clipboard (⌘/Ctrl+V) — keeps transparency', pasteFromClipboard)}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 4px' }}>
          {renderNode(tree, 0)}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Button variant={hasScaffold ? 'ghost' : 'solid'} size="sm" fullWidth onClick={initProject}
            iconLeft={<i data-lucide={hasScaffold ? 'refresh-cw' : 'sparkles'}></i>}>
            {hasScaffold ? 'Update scaffold' : 'Initialize project'}
          </Button>
          <Button variant="outline" size="sm" fullWidth onClick={exportZip} iconLeft={<i data-lucide="folder-down"></i>}>Export project (.zip)</Button>
        </div>
      </div>

      {/* Resizer */}
      <div onMouseDown={startResize} title="Drag to resize"
        style={{ width: 6, marginLeft: -3, cursor: 'col-resize', flex: 'none', zIndex: 5, background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} />

      {/* Viewer */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selPath || '—'}</span>
          {selPath && <Tag shape="pill">{langTag}</Tag>}
          {selGen && <Tag shape="pill">generated</Tag>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {!selIsImage && selContent != null && (
              <Button variant="ghost" size="sm" onClick={handleCopy} iconLeft={<i key={copied ? 'c' : 'o'} data-lucide={copied ? 'check' : 'copy'}></i>}>{copied ? 'Copied' : 'Copy'}</Button>
            )}
            {selPath && <Button variant="ghost" size="sm" onClick={handleExportOne} iconLeft={<i data-lucide="download"></i>}>Export</Button>}
          </div>
        </div>

        {selIsImage ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-inset)', padding: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <img src={selAsset.dataUrl} alt={selPath} style={{ maxWidth: '100%', maxHeight: '60vh', border: '1px solid var(--border-subtle)' }} />
              <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                internal path: <span style={{ color: 'var(--text-secondary)' }}>{selPath}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-disabled)', marginTop: 4 }}>Use this path as an Image component source.</div>
            </div>
          </div>
        ) : selEditable ? (
          <textarea value={selContent} onChange={e => setFileContent(selPath, e.target.value)} spellCheck={false}
            style={{ flex: 1, minHeight: 0, resize: 'none', border: 0, outline: 'none', padding: '18px 20px', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7 }} />
        ) : selContent != null ? (
          <pre style={{ margin: 0, padding: '18px 20px', flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, background: 'var(--surface-inset)', color: 'var(--text-secondary)' }}>
            <code style={{ whiteSpace: 'pre-wrap' }}>{selContent}</code>
          </pre>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Select a file to view.</div>
        )}
      </div>

      <Dialog open={!!dlg} onClose={() => setDlg(null)}
        title={dlg ? (dlg.mode === 'file' ? 'New file' : dlg.mode === 'folder' ? 'New folder' : 'Rename') : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="solid" size="sm" onClick={submitDlg}>{dlg && dlg.mode === 'rename' ? 'Rename' : 'Create'}</Button></>}>
        <Input autoFocus label={dlg && dlg.mode === 'folder' ? 'Folder name' : dlg && dlg.mode === 'rename' ? 'New name' : 'File name (e.g. utils.ts)'}
          value={dlgVal} onChange={e => setDlgVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitDlg(); }} />
        {dlg && dlg.parent && <div style={{ marginTop: 8, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>in {dlg.parent}/</div>}
      </Dialog>
    </div>
  );
}
window.CodePanel = CodePanel;
