/* global React, Topbar, PageTabs, LibraryPanel, PagesPanel, LayersTree, Canvas, PreviewCanvas, Inspector, CodePanel, RelationshipsView, WorkflowView, WorkflowRunLog, AnimCanvas, AIHelper */

const DEFAULT_NODES = [
  { id: 'cmp_root', name: 'Section',      icon: 'frame',  kind: 'frame',   x: 80,  y: 70,  w: 440, h: 150, label: 'Pricing — grid',  layout: 'Grid',        gap: 24, synced: true,  responsive: true,  clipContent: false, locked: false, hidden: false, fillColor: '' },
  { id: 'cmp_head', name: 'Heading',      icon: 'type',   kind: 'heading', x: 110, y: 300, w: 240, h: 80,  label: 'Simple pricing', layout: 'Stack',       gap: 0,  synced: true,  responsive: true,  clipContent: false, locked: false, hidden: false, fillColor: '' },
  { id: 'cmp_card', name: 'PricingCard',  icon: 'square', kind: 'card',    x: 600, y: 120, w: 220, h: 240, label: 'Card · ×3',      layout: 'Flex column', gap: 12, synced: false, responsive: true,  clipContent: false, locked: false, hidden: false, fillColor: '' },
  { id: 'cmp_cta',  name: 'Button',       icon: 'square', kind: 'button',  x: 640, y: 420, w: 140, h: 60,  label: 'Choose plan',    layout: 'Flex row',    gap: 0,  synced: true,  responsive: true,  clipContent: false, locked: false, hidden: false, fillColor: '' },
];

const DEFAULT_CONNECTIONS = [
  { from: 'cmp_root', to: 'cmp_head', kind: 'child' },
  { from: 'cmp_root', to: 'cmp_card', kind: 'child' },
  { from: 'cmp_card', to: 'cmp_cta',  kind: 'binds' },
];

const DEFAULT_SETTINGS = {
  snap: true, gridSize: 8, showGrid: true,
  responsive: true, desktopPreset: 'std',
  customSize: { w: 1200, h: 800 },
  palette: [
    { name: 'White', value: '#ffffff' }, { name: 'Ink', value: '#0a0a0c' },
    { name: 'Violet', value: '#9B8AFB' }, { name: 'Blue', value: '#60A5FA' },
    { name: 'Green', value: '#34D399' }, { name: 'Amber', value: '#FB923C' }, { name: 'Pink', value: '#F472B6' },
  ],
};

// Per-kind defaults applied when a component is placed from the library.
const KIND_DEFAULTS = {
  frame:    { w: 260, h: 160, label: 'Frame', layout: 'Flex column', gap: 12, padding: 16 },
  stack:    { w: 220, h: 160, label: 'Stack', layout: 'Flex column', gap: 8, padding: 12 },
  grid:     { w: 300, h: 180, label: 'Grid', layout: 'Grid', gap: 12, columns: 2, padding: 12 },
  card:     { w: 260, h: 160, label: 'Card', layout: 'Flex column', gap: 12, padding: 16 },
  divider:  { w: 220, h: 16, label: '' },
  heading:  { w: 260, h: 52, label: 'Heading', fontSize: 28, fontWeight: 'semibold', fontFamily: 'Serif display' },
  text:     { w: 200, h: 40, label: 'Text goes here', fontSize: 14 },
  icon:     { w: 56, h: 56, label: '', iconName: 'star', iconSize: 24 },
  image:    { w: 200, h: 140, label: '' },
  avatar:   { w: 48, h: 48, label: 'Rin Sato' },
  badge:    { w: 90, h: 30, label: 'Badge', tone: 'neutral' },
  link:     { w: 120, h: 30, label: 'Learn more', href: '#' },
  button:   { w: 150, h: 44, label: 'Button', variant: 'solid', btnSize: 'md' },
  input:    { w: 220, h: 40, label: '', placeholder: 'name@studio.com', inputType: 'text' },
  select:   { w: 200, h: 40, label: '', placeholder: 'Select…', optionsText: 'One, Two, Three' },
  switch:   { w: 120, h: 32, label: 'Enabled', checked: true },
  checkbox: { w: 160, h: 32, label: 'Accept terms', checked: false },
  list:     { w: 220, h: 120, label: '', itemsText: 'First item\nSecond item\nThird item' },
  progress: { w: 220, h: 24, label: '', value: 60 },
  chart:    { w: 300, h: 190, label: '', chartType: 'bar', chartData: [40, 70, 30, 90, 55], chartLabels: '' },
  textarea: { w: 240, h: 96, label: '', placeholder: 'Write a message…', inputValue: '', rows: 3 },
  radio:    { w: 200, h: 108, label: '', optionsText: 'Option A, Option B, Option C', selected: 0, radioDir: 'vertical', radioMulti: false },
  slider:   { w: 220, h: 36, label: '', min: 0, max: 100, value: 50, step: 1, showValue: true },
  tabs:     { w: 340, h: 40, label: '', tabsText: 'Overview, Activity, Settings', activeTab: 0 },
  breadcrumb:{ w: 280, h: 28, label: '', itemsText: 'Home, Projects, Lattice', separator: '/' },
  alert:    { w: 340, h: 68, label: 'Heads up!', alertText: 'This is an important message for you.', tone: 'info', alertIcon: 'info' },
  table:    { w: 340, h: 150, label: '', tableCols: 'Name, Role, Status', tableRows: 'Rin Sato, Design, Active\nLee Wong, Engineering, Away', striped: true },
  stat:     { w: 170, h: 92, label: 'Revenue', statValue: '$48.2k', statDelta: '+12.5%', statTrend: 'up' },
  rect:     { w: 160, h: 120, label: '', fillColor: 'var(--text-primary)', radius: 0 },
  ellipse:  { w: 140, h: 140, label: '', fillColor: 'var(--text-primary)' },
  line:     { w: 200, h: 12, label: '', borderColor: 'var(--text-primary)', borderWidth: 2 },
  triangle: { w: 140, h: 130, label: '', fillColor: 'var(--text-primary)' },
  star:     { w: 140, h: 140, label: '', fillColor: 'var(--amber-base)', points: 5, innerRatio: 0.5 },
  polygon:  { w: 140, h: 140, label: '', fillColor: 'var(--text-primary)', sides: 6 },
  arrow:    { w: 180, h: 90, label: '', fillColor: 'var(--text-primary)' },
};

const uid = (p = 'cmp') => p + '_' + Math.random().toString(36).slice(2, 7);

// A workflow variable's initial value, coerced to its declared type.
function coerceVar(v) {
  if (v.type === 'number') return v.initial === '' || v.initial == null ? 0 : Number(v.initial);
  if (v.type === 'boolean') return v.initial === true || v.initial === 'true';
  return v.initial == null ? '' : String(v.initial);
}

// --- Responsive device presets & per-device geometry (resolve-on-read) ---
// Desktop = the node's base x/y/w/h/hidden. Tablet/Mobile store overrides in node.bp[device].
const DEVICE = { desktop: { w: 1440, h: 1024 }, tablet: { w: 820, h: 1180 }, mobile: { w: 390, h: 844 } };
const GEOM_KEYS = ['x', 'y', 'w', 'h', 'hidden'];

// Desktop screen-type presets (aspect / resolution). The chosen id lives in settings.desktopPreset.
// Label = screen type only; the topbar readout shows the actual px size (so no duplication and it
// stays correct after Rotate, which swaps w/h).
const DESKTOP_PRESETS = [
  { id: 'std',  label: 'Standard (5:4)', w: 1440, h: 1024 },
  { id: 'fhd',  label: '16:9 · FHD',     w: 1920, h: 1080 },
  { id: 'wxga', label: '16:10',          w: 1680, h: 1050 },
  { id: 'uxga', label: '4:3',            w: 1440, h: 1080 },
  { id: 'uw',   label: '21:9 · Ultrawide', w: 2560, h: 1080 },
  { id: 'sq',   label: '1:1 · Square',   w: 1080, h: 1080 },
];
const desktopSize = (id) => DESKTOP_PRESETS.find(p => p.id === id) || DESKTOP_PRESETS[0];
window.DESKTOP_PRESETS = DESKTOP_PRESETS;
// Orientation is remembered per screen-type on desktop (each preset keeps its own state), and
// per-device for tablet/mobile/custom. Keeps 16:9 landscape/portrait from leaking into 4:3, etc.
const orientKeyFor = (dev, presetId) => dev === 'desktop' ? `desktop:${presetId}` : dev;
// Node geometry is remembered per desktop screen-type too, via the same override layer as
// tablet/mobile (node.bp[key]). The default preset (std) uses the node's base x/y/w/h; every other
// screen-type stores its own override under bp['desktop:<preset>']. So resizing a frame to fill
// 16:9 no longer leaks its size into 4:3 — each screen-type keeps the config you gave it.
const geomDeviceKey = (dev, presetId) => dev === 'desktop' ? (presetId && presetId !== 'std' ? `desktop:${presetId}` : 'desktop') : dev;

// Per-device geometry: overrides only apply when the node opts into responsive (default on).
function geomAt(n, dev) {
  if (dev && dev !== 'desktop' && n.responsive !== false && n.bp && n.bp[dev]) {
    const o = n.bp[dev];
    return { x: o.x, y: o.y, w: o.w, h: o.h, hidden: !!o.hidden };
  }
  return { x: n.x, y: n.y, w: n.w, h: n.h, hidden: !!n.hidden };
}
// Offset a node's per-device overrides by d (used when duplicating so clones shift on every device).
function offsetBp(bp, d) {
  if (!bp) return bp;
  const out = {};
  for (const k in bp) out[k] = { ...bp[k], x: bp[k].x + d, y: bp[k].y + d };
  return out;
}

function findOpenSpot(allNodes, w = 200, h = 120) {
  const M = 24;
  for (let row = 0; row < 10; row++)
    for (let col = 0; col < 10; col++) {
      const x = 80 + col * (w + M), y = 80 + row * (h + M);
      if (!allNodes.some(n => x < n.x + n.w + M && x + w + M > n.x && y < n.y + n.h + M && y + h + M > n.y))
        return { x, y };
    }
  return { x: 80, y: allNodes.reduce((m, n) => Math.max(m, n.y + n.h), 0) + M };
}

// The editor's snap grid, resolved for the executor. `snap:false` (the user turned snapping off) means
// no grid discipline — round to whole pixels and otherwise leave geometry exactly where layout put it.
//
// WHICH AXIS THE GRID OWNS: the vertical one. Heights, padding, gaps and stacked positions all snap, so
// the page has a real vertical rhythm. WIDTHS DO NOT: a `w:"fill"` child must tile its parent exactly,
// and half of a 1448 artboard is 724 — not a multiple of 8. Snapping that would either overflow the
// artboard or leave a seam between two panes. Fill is a harder constraint than the grid, exactly as it
// is in CSS, so the horizontal axis stays fluid and the vertical axis stays on-grid.
function agentGrid(g) {
  const on = !!(g && g.snap);
  const size = Math.max(1, Math.round((g && g.size) || 8));
  return {
    on: on, size: size,
    // nearest — for positions, where drifting half a step either way is fine
    to: (v) => (on ? Math.round(v / size) * size : Math.round(v)),
    // never DOWN — for heights: rounding a hugged height down would clip the content inside it
    up: (v) => (on ? Math.ceil(v / size) * size : Math.round(v)),
  };
}

// A page's scene timeline before anyone configures it. Module-scoped because BOTH the editor's own
// timeline controls and the agent executor build on it — two copies would drift.
const SCENE_DEFAULT = { on: true, loop: true, autoplay: true, duration: 2000, tracks: [] };
// The eases AnimEngine actually implements (its EASE table). An unknown ease silently falls back to
// ease-out at playback, so an unvalidated one from the model is a lie in the data rather than an error.
const AGENT_EASES = new Set(['linear', 'ease-in', 'ease-out', 'ease-in-out']);
const SCENE_MIN_MS = 50, SCENE_MAX_MS = 60000;
// Fallback for when TimelineEditor.jsx hasn't published its registry (tests, or a load-order change).
// Deliberately the UNIVERSAL props only: every kind has them, so nothing here can be wrong for a node.
const AGENT_ANIM_FALLBACK = new Set(['scale', 'rotation', 'x', 'y', 'skewX', 'skewY', 'w', 'h',
  'opacity', 'fillColor', 'borderColor', 'radius', 'borderWidth', 'label', 'textColor', 'fontSize']);
// The editor's OWN source of truth for what the timeline can animate (TimelineEditor publishes
// window.TL_ANIMATABLE = keys of TL_PROP). Reusing it means the agent can never be offered a property
// the timeline UI itself would refuse — and it can't rot when that list changes.
function agentAnimatable(prop) {
  if (!prop) return false;
  const reg = (typeof window !== 'undefined') ? window.TL_ANIMATABLE : null;
  if (reg && reg.size) return reg.has(prop);
  return AGENT_ANIM_FALLBACK.has(prop);
}
// Model-authored keyframes -> the shape AnimEngine samples: sorted, unique `t` in MILLISECONDS
// (absolute, against the clip duration — not 0..1), a known ease, and at least one key. Models reach
// for percentages and seconds, so a bare 0..1 `t` on a multi-second clip would otherwise collapse the
// whole animation into its first millisecond.
function normalizeAgentKeys(raw, duration) {
  const list = Array.isArray(raw) ? raw : [];
  const byT = new Map();
  for (let i = 0; i < list.length; i++) {
    const k = list[i];
    if (!k || typeof k !== 'object') continue;
    if (k.value === undefined || k.value === null || k.value === '') continue;
    // Percent FIRST: Number("50%") is NaN, so a finite-check before this branch silently drops the key
    // instead of converting it. A percent is explicit about meaning a fraction of the clip, so honour
    // it; a bare number is always milliseconds, which is the unit AnimEngine actually samples.
    const rawT = k.t != null ? k.t : k.time;
    let t;
    if (typeof rawT === 'string' && /%\s*$/.test(rawT)) {
      const pct = parseFloat(rawT);
      if (!Number.isFinite(pct)) continue;
      t = (pct / 100) * duration;
    } else {
      t = Number(rawT);
      if (!Number.isFinite(t)) continue;
    }
    t = Math.max(0, Math.min(duration, Math.round(t)));
    const ease = AGENT_EASES.has(String(k.ease)) ? String(k.ease) : 'ease-out';
    byT.set(t, { t: t, value: k.value, ease: ease });   // last write wins on a duplicate t
  }
  return Array.from(byT.values()).sort((a, b) => a.t - b.t);
}

// --- AI agent executor -------------------------------------------------------------------------
// Apply a batch of AI-agent actions to a working COPY of the project's pages. Pure (no React state):
// returns a fresh pages array + the resulting active page id + a summary, so the caller commits it in
// one undo step. Agent-supplied ref ids (e.g. "sidebar") are mapped to real generated ids so later
// actions can reference nodes the same batch created; existing node ids pass through untouched.
// A node has at most ONE parent, so adding a child edge REPLACES any existing one. Models routinely
// emit both `parent` on addNode and a separate connect op for the same pair; duplicate edges make
// sibling counts and subtree moves double-count, which throws the whole layout out.
function setChildEdge(pg, from, to) {
  pg.connections = pg.connections.filter(c => !(c.kind === 'child' && c.to === to));
  pg.connections.push({ from: from, to: to, kind: 'child' });
}

// `priorRefs` carries the ref->real-id map from earlier batches in the same conversation. The model
// has chat memory, so it naturally says "setProp btn1" about a button it created last turn — but a ref
// only ever existed inside the block that made it, so that silently no-opped ("couldn't apply them").
// Seeding the map makes the model's own mental model true. A ref reused by a new addNode simply
// rebinds, so newer always wins.
function buildAgentPages(prevPages, activeId, actions, priorRefs, project) {
  const pages = prevPages.map(p => ({ ...p, nodes: (p.nodes || []).map(n => ({ ...n })), connections: [...(p.connections || [])] }));
  let active = activeId;
  const idMap = { ...(priorRefs || {}) };   // AI ref id -> real editor id (nodes, pages, vars, workflows, components)
  // Project-level state the agent can also edit. Cloned so buildAgentPages stays pure; the `*Changed`
  // flags tell the caller which of these to write back (each lives in its OWN React state, and page
  // vars live on the page objects above). Global variables ≠ page variables.
  const proj = project || {};
  let variables = (proj.variables || []).map(v => ({ ...v }));
  let workflows = (proj.workflows || []).map(w => ({ ...w }));
  let customComponents = (proj.customComponents || []).map(c => ({ ...c }));
  let globalVarsChanged = false, workflowsChanged = false, componentsChanged = false;
  // The real artboard the user is looking at (desktop 1440, tablet 820, mobile 390, or a custom size).
  // Top-level nodes size/flow/clamp against THIS, not a hardcoded desktop width — otherwise a page built
  // on a phone artboard comes out 1440 wide.
  const artW = Math.round((proj.artboard && proj.artboard.w) || AGENT_ARTBOARD_W);
  const artH = Math.round((proj.artboard && proj.artboard.h) || AGENT_ARTBOARD_H);
  // The editor's snap grid (settings.snap + settings.gridSize, default 8). Canvas.jsx snaps every user
  // drag to it, so agent output that ignores it is off-grid the instant it lands: nudge an agent-made
  // node by 1px and it jumps to the nearest multiple. Laying the batch out on the SAME grid is what
  // makes agent work indistinguishable from hand-placed work.
  const grid = agentGrid(proj.grid);
  const newNodeIds = [];
  const fillW = new Set();                  // nodes that asked for w:"fill" — resolved in the layout pass
  const fillH = new Set();                  // nodes that asked for h:"fill" — a screen root that must span the artboard
  const newByPage = {};                     // pageId -> how many new nodes landed there
  const counts = { addNode: 0, setProp: 0, deleteNode: 0, addPage: 0, connect: 0, deletePage: 0, setPageProp: 0,
    moveNode: 0, addVar: 0, setVar: 0, deleteVar: 0, addWorkflow: 0, editWorkflow: 0, deleteWorkflow: 0, addComponent: 0,
    setTimeline: 0, addTrack: 0, deleteTrack: 0 };
  const cur = () => pages.find(p => p.id === active) || pages[0];
  const resolve = (ref) => (ref == null ? null : (idMap[ref] || ref));
  // A page reference can arrive under a few keys depending on how the model frames the op.
  const pageRefOf = (a) => (a.target != null ? a.target : (a.page != null ? a.page : a.id));
  // Targets can legitimately live on another page, and models also invent ids — resolve against the
  // current page first, then anywhere, and record what never resolved so the caller can say so.
  const missing = [];
  const unknownOps = [];   // ops the executor has no handler for — surfaced, never silently dropped
  const pageWith = (id) => (cur().nodes.some(n => n.id === id) ? cur() : pages.find(p => p.nodes.some(n => n.id === id)));
  const list = Array.isArray(actions) ? actions : [];
  for (let a of list) {
    if (!a || typeof a !== 'object') continue;
    // A custom component is a single-node variant (a `base` kind + captured props). Instantiating one is
    // just an addNode with those props merged in — rewrite it so the whole layout/placement path is reused.
    if (a.op === 'placeComponent') {
      const cc = customComponents.find(c => c.id === resolve(a.component) || c.name === a.component);
      if (!cc) { missing.push(String(a.component != null ? a.component : 'component')); continue; }
      a = { op: 'addNode', kind: cc.base, id: a.id, name: a.name || cc.name, label: a.label,
        page: a.page, parent: a.parent, x: a.x, y: a.y, w: a.w, h: a.h,
        props: Object.assign({}, cc.props || {}, a.props || {}) };
    }
    if (a.op === 'addPage') {
      const id = uid('page');
      if (a.id) idMap[a.id] = id;
      pages.push({ id, name: a.name || 'Page', route: a.route || '/', nodes: [], connections: [], vars: [] });
      if (a.activate !== false) active = id;
      counts.addPage++;
    } else if (a.op === 'deletePage') {
      // Pages are real ids in the context; a page the model just created resolves through idMap too.
      const raw = pageRefOf(a);
      const pid = resolve(raw);
      const idx = pages.findIndex(p => p.id === pid);
      // Never remove the last page — the editor must always have somewhere to land.
      if (idx >= 0 && pages.length > 1) {
        pages.splice(idx, 1);
        if (active === pid) active = pages[0].id;
        counts.deletePage++;
      } else missing.push(String(raw));
    } else if (a.op === 'setPageProp') {
      // Rename a page and/or change its route. name/route may arrive top-level or nested under props.
      const raw = pageRefOf(a);
      const p = pages.find(pp => pp.id === (resolve(raw) || active));
      if (p) {
        const pr = a.props || {};
        const name = a.name != null ? a.name : pr.name;
        const route = a.route != null ? a.route : pr.route;
        if (name != null) p.name = String(name);
        if (route != null) p.route = String(route);
        if (name != null || route != null) counts.setPageProp++;
        // A page has EXACTLY name + route. Anything else the model asks for here does not exist —
        // there is no page/canvas height, width or scroll property (the artboard is a DEVICE setting,
        // see `artboard` in App: activeDevice + settings.customSize). Reaching for one used to be a
        // SILENT no-op: the page resolved, nothing was written, nothing was counted, nothing was
        // reported — so the agent could announce "I updated the canvas height to 2600px" and the batch
        // still read as success. Surface it instead, and let the helper say it's out of scope.
        for (const k in pr) {
          if (k === 'name' || k === 'route') continue;
          unknownOps.push('setPageProp:' + k);
        }
        for (const k of ['height', 'h', 'width', 'w', 'scrollable', 'scroll', 'size']) {
          if (a[k] !== undefined) unknownOps.push('setPageProp:' + k);
        }
      } else missing.push(String(raw));
    } else if (a.op === 'setTimeline') {
      // The page's scene clip: one whole-screen animation whose tracks each drive one node's property.
      // Settings only — tracks are owned by addTrack/deleteTrack.
      const raw = pageRefOf(a);
      const p = pages.find(pp => pp.id === (resolve(raw) || active));
      if (p) {
        const src = a.props || a;
        const tl = { ...SCENE_DEFAULT, ...(p.timeline || {}), tracks: [...((p.timeline && p.timeline.tracks) || [])] };
        let touched = false;
        if (src.on != null) { tl.on = !!src.on; touched = true; }
        if (src.loop != null) { tl.loop = !!src.loop; touched = true; }
        if (src.autoplay != null) { tl.autoplay = !!src.autoplay; touched = true; }
        if (src.duration != null) {
          const d = Math.round(Number(src.duration));
          if (Number.isFinite(d) && d > 0) { tl.duration = Math.max(SCENE_MIN_MS, Math.min(SCENE_MAX_MS, d)); touched = true; }
        }
        if (touched) { p.timeline = tl; counts.setTimeline++; }
      } else missing.push(String(raw));
    } else if (a.op === 'addTrack') {
      // One track = one node's ONE property over time. Re-adding the same node+prop REPLACES it, which
      // matches the editor (sceneAddTrack refuses a duplicate) and makes a re-run idempotent instead of
      // stacking two tracks that fight over the same property.
      const tid = resolve(a.target != null ? a.target : a.node);
      const pg = (tid && pageWith(tid)) || cur();
      const node = tid ? pg.nodes.find(n => n.id === tid) : null;
      const prop = String(a.prop || '');
      if (!node) missing.push(String(a.target != null ? a.target : a.node));
      else if (!agentAnimatable(prop)) unknownOps.push('addTrack:' + (prop || 'noProp'));
      else {
        const tl = { ...SCENE_DEFAULT, ...(pg.timeline || {}), tracks: [...((pg.timeline && pg.timeline.tracks) || [])] };
        const keys = normalizeAgentKeys(a.keys, tl.duration);
        // A track with no usable key animates nothing but still renders a row in the timeline editor —
        // report it rather than leave the user a phantom track to clean up.
        if (!keys.length) missing.push(String(a.target != null ? a.target : a.node) + '.' + prop);
        else {
          tl.tracks = tl.tracks.filter(tr => !(tr.nodeId === tid && tr.prop === prop));
          tl.tracks.push({ nodeId: tid, prop: prop, keys: keys });
          pg.timeline = tl;
          counts.addTrack++;
        }
      }
    } else if (a.op === 'deleteTrack') {
      const tid = resolve(a.target != null ? a.target : a.node);
      const pg = (tid && pageWith(tid)) || cur();
      const prop = a.prop != null ? String(a.prop) : null;
      const tl = { ...SCENE_DEFAULT, ...(pg.timeline || {}), tracks: [...((pg.timeline && pg.timeline.tracks) || [])] };
      const before = tl.tracks.length;
      // No prop = drop every track on that node (what "stop animating the hero" means).
      tl.tracks = tl.tracks.filter(tr => !(tr.nodeId === tid && (prop == null || tr.prop === prop)));
      if (tl.tracks.length !== before) { pg.timeline = tl; counts.deleteTrack += before - tl.tracks.length; }
      else missing.push(String(a.target != null ? a.target : a.node) + (prop ? '.' + prop : ''));
    } else if (a.op === 'addNode') {
      const kind = (a.kind && KIND_DEFAULTS[a.kind]) ? a.kind : 'frame';
      const d = KIND_DEFAULTS[kind] || {};
      const ap = normalizeAgentProps(a.props);
      // `page` lets a node target a page explicitly. Without it, a model that emits every addPage
      // first and every addNode after would dump ALL the content on the last page it created.
      const pageRef = a.page != null ? resolve(a.page) : null;
      const pg = (pageRef && pages.find(p => p.id === pageRef)) || cur();
      const parent = resolve(a.parent);
      const parentNode = parent ? pg.nodes.find(n => n.id === parent) : null;
      const pad = parentNode && parentNode.padding != null ? parentNode.padding : 16;
      const gap = parentNode && parentNode.gap != null ? parentNode.gap : 8;
      // Size: an explicit number wins; "fill" spans the parent's inner box (models are far more
      // reliable saying "fill" than doing `1168 - 2*16` arithmetic); otherwise the kind default.
      const rawW = (a.w != null ? a.w : ap.w);
      const rawH = (a.h != null ? a.h : ap.h);
      const fitW = parentNode ? Math.max(24, parentNode.w - pad * 2) : artW;
      const fitH = parentNode ? Math.max(24, parentNode.h - pad * 2) : artH;
      const sizeOf = (raw, fit, def) => {
        if (raw === 'fill' || raw === '100%') return fit;
        const n = (raw === '' || raw == null) ? NaN : Number(raw);
        return Number.isFinite(n) && n > 0 ? n : def;
      };
      let w = sizeOf(rawW, fitW, d.w || 200);
      let h = sizeOf(rawH, fitH, d.h || 120);
      if (parentNode && rawW == null) {
        // Containers stacked in a column stretch to the parent's inner width (align-items:stretch).
        // Not in a row (siblings sit beside each other) and not in a Grid (the grid flow assigns
        // column widths itself).
        if (AGENT_STRETCH_KINDS[kind] && parentNode.layout !== 'Flex row' && parentNode.layout !== 'Grid') {
          w = fitW;
        } else if (fitW > 24 && w > fitW) {
          // A child sized only by its kind-default can still be wider than its container (a 260px
          // heading inside a 240px sidebar) — shrink it to fit rather than overflow.
          w = fitW;
        }
      }
      // Nodes live at absolute coords (parent/child is a hierarchy edge, not DOM nesting), so placement
      // is resolved here. Model-supplied coordinates are only trusted when they're actually sensible —
      // models routinely hand every node the same x/y (all 0,0) or position a child outside its parent.
      let spot = null;
      if (a.x != null && a.y != null) {
        const p = { x: +a.x, y: +a.y };
        if (parentNode) {
          // Trust a child's coords only if they land inside the parent; else fall through to auto-layout.
          const inside = p.x >= parentNode.x && p.y >= parentNode.y &&
            p.x + w <= parentNode.x + parentNode.w && p.y + h <= parentNode.y + parentNode.h;
          if (inside) spot = p;
        } else {
          // Take a top-level node's coords as a hint — relayoutAgentBatch resolves any overlap
          // afterwards, artboard-aware (slide right, else drop below). Don't send it to findOpenSpot
          // here: that tiles by the node's own width and marches wide nodes clean off the canvas.
          spot = p;
        }
      }
      if (!spot) {
        if (parentNode) {
          // Stack inside the parent, after its existing children, along its layout axis. Measured from
          // the siblings' real extent (not count × own height) so mixed-height children don't drift.
          const kids = pg.connections.filter(c => c.kind === 'child' && c.from === parent)
            .map(c => pg.nodes.find(n => n.id === c.to)).filter(Boolean);
          if (parentNode.layout === 'Flex row') {
            const right = kids.length ? Math.max.apply(null, kids.map(k => k.x + k.w)) : parentNode.x + pad - gap;
            spot = { x: right + gap, y: parentNode.y + pad };
          } else {
            const bottom = kids.length ? Math.max.apply(null, kids.map(k => k.y + k.h)) : parentNode.y + pad - gap;
            spot = { x: parentNode.x + pad, y: bottom + gap };
          }
        } else {
          spot = findOpenSpot(pg.nodes, w, h);
        }
      }
      const id = uid();
      if (a.id) idMap[a.id] = id;
      // Remember the intent — the final width is only knowable once the parent's own width settles.
      if (rawW === 'fill' || rawW === '100%') fillW.add(id);
      if (rawH === 'fill' || rawH === '100%') fillH.add(id);
      const name = a.name || (kind.charAt(0).toUpperCase() + kind.slice(1));
      const node = {
        name, icon: 'square', layout: 'Flex column', gap: 12,
        synced: false, responsive: true, clipContent: false, locked: false, hidden: false, fillColor: '',
        ...d, ...ap,
        id, kind, x: spot.x, y: spot.y, w, h,
      };
      if (a.label != null) node.label = a.label;
      else if (node.label === undefined) node.label = '';
      pg.nodes.push(node);
      newNodeIds.push(id);
      newByPage[pg.id] = (newByPage[pg.id] || 0) + 1;
      if (parentNode) setChildEdge(pg, parent, id);
      counts.addNode++;
    } else if (a.op === 'setProp') {
      const tid = resolve(a.target);
      const pg = pageWith(tid);
      const i = pg ? pg.nodes.findIndex(n => n.id === tid) : -1;
      if (i >= 0) { pg.nodes[i] = { ...pg.nodes[i], ...normalizeAgentProps(a.props) }; counts.setProp++; }
      else missing.push(String(a.target));
    } else if (a.op === 'deleteNode') {
      const tid = resolve(a.target);
      const pg = pageWith(tid);
      if (pg) {
        const before = pg.nodes.length;
        pg.nodes = pg.nodes.filter(n => n.id !== tid);
        pg.connections = pg.connections.filter(c => c.from !== tid && c.to !== tid);
        if (pg.nodes.length !== before) counts.deleteNode++;
      } else missing.push(String(a.target));
    } else if (a.op === 'connect') {
      const from = resolve(a.from), to = resolve(a.to);
      // Look on whichever page actually holds both nodes — by now `active` may have moved on.
      const pg = pages.find(p => p.nodes.some(n => n.id === from) && p.nodes.some(n => n.id === to)) || cur();
      if (from && to && pg.nodes.some(n => n.id === from) && pg.nodes.some(n => n.id === to)) {
        const kind = a.kind || 'child';
        if (kind === 'child') setChildEdge(pg, from, to);            // replaces, never duplicates
        else if (!pg.connections.some(c => c.kind === kind && c.from === from && c.to === to)) {
          pg.connections.push({ from: from, to: to, kind: kind });
        }
        counts.connect++;
      }
    } else if (a.op === 'moveNode') {
      // Relocate a node (and its whole child-subtree) to another page — the real "merge these pages" move.
      const nid = resolve(a.target);
      const from = pages.find(p => p.nodes.some(n => n.id === nid));
      const dest = pages.find(p => p.id === resolve(a.page));
      if (from && dest && from.id !== dest.id) {
        const kids = {};
        from.connections.filter(c => c.kind === 'child').forEach(c => { (kids[c.from] = kids[c.from] || []).push(c.to); });
        const moveSet = new Set();
        (function collect(id) { if (moveSet.has(id)) return; moveSet.add(id); (kids[id] || []).forEach(collect); })(nid);
        const moved = from.nodes.filter(n => moveSet.has(n.id));
        const internal = from.connections.filter(c => moveSet.has(c.from) && moveSet.has(c.to));
        from.nodes = from.nodes.filter(n => !moveSet.has(n.id));
        // Drop every source edge touching the moved set (external parent/binds are severed — a cross-page
        // relationship isn't valid anyway); carry the internal edges across.
        from.connections = from.connections.filter(c => !moveSet.has(c.from) && !moveSet.has(c.to));
        // Land the moved root in free space on the destination and shift the whole subtree by that delta.
        const root = moved.find(n => n.id === nid);
        const spot = findOpenSpot(dest.nodes, root.w, root.h);
        const dx = spot.x - root.x, dy = spot.y - root.y;
        moved.forEach(n => { n.x += dx; n.y += dy; });
        dest.nodes.push(...moved);
        dest.connections.push(...internal);
        const par = a.parent != null ? resolve(a.parent) : null;
        if (par && dest.nodes.some(n => n.id === par && !moveSet.has(n.id))) setChildEdge(dest, par, nid);
        counts.moveNode++;
      } else if (!from || !dest) missing.push(String(a.target));
    } else if (a.op === 'addVar') {
      // scope 'page' → the target/active page's own vars; otherwise a global variable.
      const id = uid('var');
      if (a.id) idMap[a.id] = id;
      const v = { id, name: a.name || 'var', type: (a.type === 'number' || a.type === 'boolean') ? a.type : 'string',
        initial: a.initial != null ? a.initial : '' };
      if ((a.scope || 'global') === 'page') {
        const pg = (a.page != null && pages.find(p => p.id === resolve(a.page))) || cur();
        pg.vars = [...(pg.vars || []), v];
      } else { variables = [...variables, v]; globalVarsChanged = true; }
      counts.addVar++;
    } else if (a.op === 'setVar') {
      const vid = resolve(a.target);
      const upd = (v) => ({ ...v,
        ...(a.name != null ? { name: String(a.name) } : {}),
        ...(a.type != null ? { type: (a.type === 'number' || a.type === 'boolean') ? a.type : 'string' } : {}),
        ...(a.initial !== undefined ? { initial: a.initial } : {}) });
      if (variables.some(v => v.id === vid)) { variables = variables.map(v => v.id === vid ? upd(v) : v); globalVarsChanged = true; counts.setVar++; }
      else {
        const pg = pages.find(p => (p.vars || []).some(v => v.id === vid));
        if (pg) { pg.vars = pg.vars.map(v => v.id === vid ? upd(v) : v); counts.setVar++; }
        else missing.push(String(a.target));
      }
    } else if (a.op === 'deleteVar') {
      const vid = resolve(a.target);
      if (variables.some(v => v.id === vid)) { variables = variables.filter(v => v.id !== vid); globalVarsChanged = true; counts.deleteVar++; }
      else {
        const pg = pages.find(p => (p.vars || []).some(v => v.id === vid));
        if (pg) { pg.vars = pg.vars.filter(v => v.id !== vid); counts.deleteVar++; }
        else missing.push(String(a.target));
      }
    } else if (a.op === 'addWorkflow') {
      const id = uid('wf');
      if (a.id) idMap[a.id] = id;
      // Matches the editor's own new-workflow shape (one trigger node, no edges). Wiring the graph is
      // not an agent op yet — the model can create/name/remove flows, the user wires them.
      workflows = [...workflows, { id, name: a.name || ('Workflow ' + (workflows.length + 1)),
        nodes: [{ id: uid('wn'), type: 'trigger', x: 80, y: 120 }], edges: [] }];
      workflowsChanged = true; counts.addWorkflow++;
    } else if (a.op === 'renameWorkflow') {
      const wid = resolve(a.target);
      if (a.name != null && workflows.some(w => w.id === wid)) {
        workflows = workflows.map(w => w.id === wid ? { ...w, name: String(a.name) } : w);
        workflowsChanged = true; counts.editWorkflow++;
      } else missing.push(String(a.target));
    } else if (a.op === 'deleteWorkflow') {
      const wid = resolve(a.target);
      if (workflows.some(w => w.id === wid)) {
        workflows = workflows.filter(w => w.id !== wid);
        workflowsChanged = true; counts.deleteWorkflow++;
      } else missing.push(String(a.target));
    } else if (a.op === 'createComponent') {
      // Capture an existing node's styling into a reusable Library component (mirrors confirmSaveAsComponent).
      const nid = resolve(a.target);
      const holder = pages.find(p => p.nodes.some(n => n.id === nid));
      const node = holder && holder.nodes.find(n => n.id === nid);
      if (node) {
        const id = uid('cc');
        if (a.id) idMap[a.id] = id;
        customComponents = [...customComponents, {
          id, name: a.name || node.name || 'Component', icon: node.icon || 'shapes',
          base: node.kind || 'frame', props: captureVariantProps(node),
        }];
        componentsChanged = true; counts.addComponent++;
      } else missing.push(String(a.target));
    } else if (a.op) {
      unknownOps.push(String(a.op));
    }
  }
  // Land the user where the content actually went: stay put if their own page got content, otherwise
  // open the FIRST page that did. Without this, a batch creating several pages leaves them staring at
  // whichever page happened to be created last — often an empty one.
  const landed = Object.keys(newByPage);
  if (landed.length) active = newByPage[activeId] ? activeId : landed[0];
  // The executor owns layout, not the model — grow containers and flow new top-level nodes clear of
  // existing work. Without this, model-supplied coordinates land charts on top of sidebars.
  const newIdSet = new Set(newNodeIds);
  if (newNodeIds.length) {
    pages.forEach(p => {
      if ((p.nodes || []).some(n => newIdSet.has(n.id))) {
        relayoutAgentBatch(p, newIdSet, fillW, artW, fillH, artH, grid);
        harmonizeAgentStyle(p.nodes, newIdSet); // unify radius/border per kind so the page reads as one system
      }
    });
  }

  const parts = [];
  if (counts.addPage) parts.push('+' + counts.addPage + ' page' + (counts.addPage > 1 ? 's' : ''));
  if (counts.deletePage) parts.push('−' + counts.deletePage + ' page' + (counts.deletePage > 1 ? 's' : ''));
  if (counts.setPageProp) parts.push(counts.setPageProp + ' page edit' + (counts.setPageProp > 1 ? 's' : ''));
  if (counts.addNode) parts.push('+' + counts.addNode + ' node' + (counts.addNode > 1 ? 's' : ''));
  if (counts.setProp) parts.push(counts.setProp + ' edit' + (counts.setProp > 1 ? 's' : ''));
  if (counts.deleteNode) parts.push('−' + counts.deleteNode + ' node' + (counts.deleteNode > 1 ? 's' : ''));
  if (counts.connect) parts.push(counts.connect + ' link' + (counts.connect > 1 ? 's' : ''));
  if (counts.addTrack) parts.push('+' + counts.addTrack + ' anim track' + (counts.addTrack > 1 ? 's' : ''));
  if (counts.deleteTrack) parts.push('−' + counts.deleteTrack + ' anim track' + (counts.deleteTrack > 1 ? 's' : ''));
  if (counts.setTimeline) parts.push('timeline updated');
  if (counts.moveNode) parts.push(counts.moveNode + ' moved');
  const varN = counts.addVar + counts.setVar + counts.deleteVar;
  if (varN) parts.push(varN + ' variable' + (varN > 1 ? 's' : ''));
  const wfN = counts.addWorkflow + counts.editWorkflow + counts.deleteWorkflow;
  if (wfN) parts.push(wfN + ' workflow' + (wfN > 1 ? 's' : ''));
  if (counts.addComponent) parts.push('+' + counts.addComponent + ' component' + (counts.addComponent > 1 ? 's' : ''));
  const total = counts.addNode + counts.setProp + counts.deleteNode + counts.addPage + counts.connect
    + counts.deletePage + counts.setPageProp + counts.moveNode
    + counts.addVar + counts.setVar + counts.deleteVar
    + counts.addWorkflow + counts.editWorkflow + counts.deleteWorkflow + counts.addComponent
    + counts.setTimeline + counts.addTrack + counts.deleteTrack;
  // Undo is a per-page nodes+connections snapshot (see pushHistory), so anything that lives ANYWHERE
  // else is not restored by Ctrl+Z: the scene timeline, variables, workflows, components, the page list.
  // The action bubble used to promise "Ctrl+Z to undo" unconditionally, which for a timeline-only batch
  // is simply false — the same shape of lie as a handler that accepts an op and ignores its payload.
  const outsideUndo = ['setTimeline', 'addTrack', 'deleteTrack', 'addVar', 'setVar', 'deleteVar',
    'addWorkflow', 'editWorkflow', 'deleteWorkflow', 'addComponent', 'addPage', 'deletePage', 'setPageProp']
    .some(k => counts[k] > 0);
  const inUndo = ['addNode', 'setProp', 'deleteNode', 'connect', 'moveNode'].some(k => counts[k] > 0);
  // `refs` goes back to the caller so the next batch in this conversation can resolve the same refs.
  // `unknownOps` lets the caller tell the user honestly when the model asked for something we can't do
  // yet instead of dropping it and reporting a hollow success. The project-state copies + their `*Changed`
  // flags let the caller write back only what actually changed (each is a separate React state).
  return { pages, active, summary: parts.length ? parts.join(' · ') : 'No changes', total, newNodeIds, missing, unknownOps, refs: idMap,
    variables, workflows, customComponents, globalVarsChanged, workflowsChanged, componentsChanged,
    // 'full' = Ctrl+Z restores everything this batch did. 'partial' = it restores the canvas edits only.
    // 'none' = Ctrl+Z will not undo any of it.
    undoScope: outsideUndo ? (inUndo ? 'partial' : 'none') : 'full' };
}

// Props the agent should see so it can read/rewrite real content (table rows/columns, chart series,
// list/select items) and match existing styling, rather than guessing. Kept tight — every key here is
// spent on every node in the context window.
const AGENT_DATA_KEYS = ['tableCols', 'tableRows', 'chartType', 'chartData', 'itemsText', 'optionsText',
  'tabsText', 'placeholder', 'checked', 'src', 'href', 'iconName',
  'variant', 'btnSize', 'tone', 'fillColor', 'textColor', 'fontSize', 'radius', 'layout', 'gap', 'padding',
  'justify', 'align', 'position', 'anchor'];
const AGENT_MAX_NODES = 40;
// A container child stacked in a column should span its parent — CSS's align-items:stretch. Without
// this, a grid the model didn't give an explicit width keeps its 300px KIND default, so a 3-column
// product grid inside a 1180px page renders ~84px cards squashed into the corner.
const AGENT_STRETCH_KINDS = { frame: 1, stack: 1, grid: 1, card: 1, divider: 1, table: 1, chart: 1 };

// --- Free / anchored placement (CSS `position:absolute`) -----------------------------------------
// Until this existed, EVERY child was force-flowed onto its parent's axis: step 3 of the layout pass
// overwrote whatever x/y a node was created with. That made a whole class of design impossible rather
// than merely hard — a dialog centred on a desktop, an icon at a chosen spot, a badge pinned to a
// card's corner, a FAB in the bottom-right. The model could only ever stack, so it stacked things that
// should float, which is what "the agent doesn't know where to put components" actually was.
//
// The model states INTENT (`anchor:"center"`), never arithmetic. That is the same division of labour as
// the rest of this executor: models are unreliable at 2D maths, so they say what they mean and the
// layout pass computes it. A raw x/y still works via `position:"free"` for the cases where the model
// genuinely knows a coordinate (a desktop icon grid it is placing deliberately).
const AGENT_ANCHORS = {
  'top-left': [0, 0], 'top': [0.5, 0], 'top-center': [0.5, 0], 'top-right': [1, 0],
  'left': [0, 0.5], 'center-left': [0, 0.5], 'center': [0.5, 0.5], 'middle': [0.5, 0.5],
  'right': [1, 0.5], 'center-right': [1, 0.5],
  'bottom-left': [0, 1], 'bottom': [0.5, 1], 'bottom-center': [0.5, 1], 'bottom-right': [1, 1],
};
function agentAnchor(v) {
  const k = String(v == null ? '' : v).toLowerCase().trim().replace(/\s+/g, '-');
  return Object.prototype.hasOwnProperty.call(AGENT_ANCHORS, k) ? k : null;
}
// A node is out of the flow if it anchors itself or explicitly asks to be free/absolute.
function agentIsFree(n) {
  if (!n) return false;
  const p = String(n.position || '').toLowerCase();
  return p === 'free' || p === 'absolute' || p === 'fixed' || !!agentAnchor(n.anchor);
}
// Place a free child against its parent's box. `anchor` picks the reference corner/edge; offsetX/offsetY
// nudge from there (a dialog 24px off the bottom-right). No anchor => keep the coords it was created
// with, clamped inside the parent so a guessed number can't put it off-canvas.
function placeFreeChild(parent, k, pad) {
  const a = agentAnchor(k.anchor);
  const ox = Number(k.offsetX) || 0, oy = Number(k.offsetY) || 0;
  let x = k.x, y = k.y;
  if (a) {
    const [fx, fy] = AGENT_ANCHORS[a];
    // Inset by padding at the edges, but never at the centre — a centred node is centred, not nudged.
    const insetX = fx === 0.5 ? 0 : (fx === 0 ? pad : -pad);
    const insetY = fy === 0.5 ? 0 : (fy === 0 ? pad : -pad);
    x = parent.x + Math.round((parent.w - k.w) * fx) + insetX + ox;
    y = parent.y + Math.round((parent.h - k.h) * fy) + insetY + oy;
  }
  // Clamp inside the parent. A free node is still INSIDE its container — free means "not in the flow",
  // not "allowed off the artboard".
  x = Math.max(parent.x, Math.min(x, parent.x + parent.w - k.w));
  y = Math.max(parent.y, Math.min(y, parent.y + parent.h - k.h));
  return { x: Math.round(x), y: Math.round(y) };
}

// Models reach for CSS names (`color`, `backgroundColor`, `borderRadius`) and CSS values
// (fontWeight 700, fontFamily "serif") because that is what their training is full of. This editor's
// vocabulary differs, and an unknown prop is silently ignored — which is how a fully-researched cream
// /red palette reached the canvas as no colour at all. Translate rather than fight it: prompt wording
// drifts every time a model is swapped, this mapping doesn't.
const AGENT_PROP_ALIAS = {
  color: 'textColor', fontcolor: 'textColor', foreground: 'textColor', textcolour: 'textColor',
  background: 'fillColor', backgroundcolor: 'fillColor', bg: 'fillColor', fill: 'fillColor', fillcolour: 'fillColor',
  borderradius: 'radius', cornerradius: 'radius', rounded: 'radius',
  bordercolour: 'borderColor', strokecolor: 'borderColor', strokewidth: 'borderWidth',
  weight: 'fontWeight', size: 'fontSize', font: 'fontFamily', family: 'fontFamily',
  placeholdertext: 'placeholder', text: 'label', title: 'label', value: 'value',
  // content props — the model reaches for the short names; the editor reads the *Text ones, so an
  // un-aliased `options`/`items`/`tabs` was dropped and the component showed its kind default (a
  // Role select rendered "One, Two, Three").
  options: 'optionsText', option: 'optionsText', choices: 'optionsText',
  items: 'itemsText', list: 'itemsText', listitems: 'itemsText',
  tabs: 'tabsText', tablist: 'tabsText',
  // Main/cross-axis distribution. The model writes the CSS names it was trained on; the editor's props
  // are the short ones, and the layout pass bakes them into coordinates.
  justifycontent: 'justify', alignitems: 'align', alignself: 'align',
  // Free/anchored placement. `pin`/`place` because a model reaching for absolute positioning rarely
  // reaches for our exact word for it.
  pin: 'anchor', place: 'anchor', anchorto: 'anchor', positioning: 'position',
  offsetx: 'offsetX', offsety: 'offsetY', dx: 'offsetX', dy: 'offsetY',
};
const AGENT_FONT_WEIGHT = {
  '100': 'regular', '200': 'regular', '300': 'regular', '400': 'regular', '500': 'medium',
  '600': 'semibold', '700': 'bold', '800': 'bold', '900': 'bold',
  normal: 'regular', regular: 'regular', book: 'regular', medium: 'medium',
  semibold: 'semibold', demibold: 'semibold', bold: 'bold', bolder: 'bold', heavy: 'bold', black: 'bold',
};
const AGENT_FONT_FAMILY = {
  serif: 'Serif display', 'serif display': 'Serif display', georgia: 'Serif display', times: 'Serif display',
  mono: 'Mono', monospace: 'Mono', 'ui-monospace': 'Mono', courier: 'Mono',
  system: 'System', 'system-ui': 'System',
  sans: 'Grotesk (UI)', 'sans-serif': 'Grotesk (UI)', inter: 'Grotesk (UI)', 'grotesk (ui)': 'Grotesk (UI)',
};
// CSS box-alignment values -> the editor's vocabulary (Inspector.jsx:353-354). An unrecognised value is
// dropped by the layout pass, so `justify:"flex-start"` would silently mean "no distribution at all".
const AGENT_JUSTIFY = {
  'flex-start': 'start', flexstart: 'start', start: 'start', top: 'start', left: 'start', normal: 'start',
  'flex-end': 'end', flexend: 'end', end: 'end', bottom: 'end', right: 'end',
  center: 'center', centre: 'center', middle: 'center',
  'space-between': 'space-between', spacebetween: 'space-between', between: 'space-between',
  'space-around': 'space-around', spacearound: 'space-around', around: 'space-around',
  'space-evenly': 'space-around', spaceevenly: 'space-around', evenly: 'space-around',
};
const AGENT_ALIGN = {
  'flex-start': 'start', flexstart: 'start', start: 'start', top: 'start', left: 'start',
  'flex-end': 'end', flexend: 'end', end: 'end', bottom: 'end', right: 'end',
  center: 'center', centre: 'center', middle: 'center',
  stretch: 'stretch', fill: 'stretch', normal: 'stretch',
};
// Map a model-authored props bag onto the editor's real prop names and accepted values.
function normalizeAgentProps(props) {
  const out = {};
  if (!props || typeof props !== 'object') return out;
  for (const k in props) {
    const lower = String(k).toLowerCase();
    // Don't alias a key that's already exactly right (e.g. a real `textColor` must not hit `color`).
    const key = Object.prototype.hasOwnProperty.call(AGENT_PROP_ALIAS, lower) && !/^(textColor|fillColor|radius|borderColor|borderWidth|fontWeight|fontSize|fontFamily|label|placeholder)$/.test(k)
      ? AGENT_PROP_ALIAS[lower] : k;
    let v = props[k];
    if (key === 'fontWeight') { const m = AGENT_FONT_WEIGHT[String(v).toLowerCase().trim()]; if (m) v = m; }
    if (key === 'fontFamily') { const m = AGENT_FONT_FAMILY[String(v).toLowerCase().trim()]; if (m) v = m; }
    if (key === 'justify') { const m = AGENT_JUSTIFY[String(v).toLowerCase().trim()]; if (m) v = m; }
    if (key === 'align') { const m = AGENT_ALIGN[String(v).toLowerCase().trim()]; if (m) v = m; }
    out[key] = v;
  }
  // `tone` is a real semantic prop (badge/alert: info|success|…), but models routinely stuff the brand
  // ACCENT hex into it on buttons — where the accent must be fillColor to render. A hex tone with no
  // explicit fill is that mistake; reroute it so the researched accent actually shows.
  if (typeof out.tone === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(out.tone) && out.fillColor == null) {
    out.fillColor = out.tone; delete out.tone;
  }
  // Border CSS shorthand ("1px solid #262B36" / "1px #E0E0E0") → the three props the editor renders
  // from; a raw `border` string draws nothing, so every shorthand border was being lost.
  if (typeof out.border === 'string' && out.borderColor == null) {
    const b = out.border;
    const col = (b.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|var\(--[^)]*\)/) || [])[0];
    const wid = (b.match(/(\d+(?:\.\d+)?)\s*px/) || [])[1];
    const sty = (b.match(/\b(solid|dashed|dotted)\b/) || [])[1];
    if (col) out.borderColor = col;
    out.borderWidth = wid ? Number(wid) : 1;
    out.borderStyle = sty || 'solid';
    delete out.border;
  }
  return out;
}

// Post-build coherence pass: models style the SAME component kind inconsistently (one card radius 8,
// the next radius 0; a border on some inputs, none on others). Within a batch, unify each kind's
// radius and border to the value the model used MOST for that kind — so a page reads as one system
// rather than a pile of one-offs. Only fills in from what the model actually chose (never invents a
// look), and only touches nodes from this batch.
function harmonizeAgentStyle(nodes, newIdSet) {
  const mode = (arr) => { const c = {}; let best = arr[0], bn = 0; arr.forEach(v => { const k = JSON.stringify(v); c[k] = (c[k] || 0) + 1; if (c[k] > bn) { bn = c[k]; best = v; } }); return best; };
  const byKind = {};
  nodes.forEach(n => { if (newIdSet.has(n.id)) (byKind[n.kind] = byKind[n.kind] || []).push(n); });
  ['button', 'card', 'input', 'select', 'textarea', 'badge', 'stat', 'image', 'frame'].forEach(kind => {
    const g = byKind[kind];
    if (!g || g.length < 2) return;
    const rads = g.map(n => n.radius).filter(r => r != null);
    if (rads.length) { const r = mode(rads); g.forEach(n => { n.radius = r; }); }
    const cols = g.map(n => n.borderColor).filter(Boolean);
    if (cols.length >= Math.ceil(g.length / 2)) { // only if a border is the norm for this kind
      const bc = mode(cols), bw = mode(g.map(n => n.borderWidth).filter(Boolean)) || 1;
      g.forEach(n => { if (!n.borderColor) { n.borderColor = bc; n.borderWidth = n.borderWidth || bw; n.borderStyle = n.borderStyle || 'solid'; } });
    }
  });
}

// Serialize the current design for the AI agent. Pure, so it can be measured/tested directly.
//
// `scope` comes from the chosen effort level and is the main token lever:
//   low    — only the selection's neighbourhood (selected nodes + ancestor chain + direct children)
//   medium — the current page, capped, selection first
//   high   — as medium, plus project variables / workflows / custom components
// Everything is kept lean: only set props are emitted, numbers rounded, long text clipped, and
// `parent`/empty collections omitted rather than sent as null/[].
function buildAgentContext(pages, activeId, selection, scope, extras) {
  const ex = extras || {};
  const pg = pages.find(p => p.id === activeId) || pages[0];
  const childOf = {};
  (pg.connections || []).filter(c => c.kind === 'child').forEach(c => { childOf[c.to] = c.from; });
  const clip = (v) => (typeof v === 'string' && v.length > 160) ? v.slice(0, 160) + '…' : v;
  const sel = new Set(selection || []);
  const all = pg.nodes || [];
  let ordered = all.filter(n => sel.has(n.id)).concat(all.filter(n => !sel.has(n.id)));
  let cap = AGENT_MAX_NODES;
  if (scope === 'low') {
    // Just the selection's neighbourhood. With nothing selected there's no neighbourhood to send, so
    // fall back to a small slice of the page.
    if (sel.size) {
      const keep = new Set(sel);
      sel.forEach(id => { let p = childOf[id]; while (p && !keep.has(p)) { keep.add(p); p = childOf[p]; } });
      (pg.connections || []).filter(c => c.kind === 'child' && sel.has(c.from)).forEach(c => keep.add(c.to));
      ordered = all.filter(n => keep.has(n.id));
    }
    cap = 12;
  }
  const kept = ordered.slice(0, cap);
  const keptIds = new Set(kept.map(n => n.id));
  const ctx = {
    // The live artboard the user is designing on — the model sizes a page's root frame to this width
    // instead of guessing. Ships on EVERY effort (it's tiny and always relevant to placement).
    // width/height alone left the model guessing where the artboard actually *is*: it reads x/y on every
    // node but was never told which coordinates are on-canvas, so designs drifted past the right edge or
    // stopped short of the bottom. The origin is fixed at 0,0, so spell the four edges out.
    canvas: ex.artboard ? {
      device: ex.device || 'desktop',
      width: Math.round(ex.artboard.w), height: Math.round(ex.artboard.h),
      left: 0, top: 0, right: Math.round(ex.artboard.w), bottom: Math.round(ex.artboard.h),
      note: 'Artboard spans x 0..' + Math.round(ex.artboard.w) + ', y 0..' + Math.round(ex.artboard.h) +
        '. Top-left is 0,0. Anything outside this rect is off-canvas and invisible to the user.',
    } : undefined,
    // The snap grid the USER's own drags land on. Sizes, padding and gaps that are multiples of it look
    // deliberate; ones that aren't look like a near-miss the moment anything is nudged.
    grid: (ex.grid && ex.grid.snap) ? {
      size: ex.grid.size || 8,
      note: 'Snap grid is ' + (ex.grid.size || 8) + 'px. Use multiples of it for padding, gap, and any ' +
        'explicit width/height. The editor snaps every hand-drag to this grid, so off-grid values visibly jump when touched.',
    } : undefined,
    activePage: { id: pg.id, name: pg.name, route: pg.route },
    pages: pages.map(p => ({ id: p.id, name: p.name, route: p.route, nodeCount: (p.nodes || []).length })),
    nodes: kept.map(n => {
      const o = { id: n.id, kind: n.kind || (window.kindOf ? window.kindOf(n) : 'frame'), x: Math.round(n.x), y: Math.round(n.y), w: Math.round(n.w), h: Math.round(n.h) };
      if (n.label) o.label = clip(n.label);
      if (childOf[n.id]) o.parent = childOf[n.id];
      AGENT_DATA_KEYS.forEach(k => { if (n[k] !== undefined && n[k] !== '' && n[k] !== null) o[k] = clip(n[k]); });
      return o;
    }),
    // Relationship graph for this page: kind 'child' = nesting, 'binds' = data/action link.
    // Only edges between nodes the agent can actually see.
    connections: (pg.connections || []).filter(c => keptIds.has(c.from) && keptIds.has(c.to))
      .map(c => ({ from: c.from, to: c.to, kind: c.kind })),
  };
  // The page's scene animation. Ships on EVERY effort and is deliberately compact: without it the agent
  // is blind to animation it already made, so "make it slower" would append a second track fighting the
  // first. Only tracks on nodes it can actually see — a track naming an id absent from `nodes` is
  // unactionable noise.
  if (pg.timeline && (pg.timeline.tracks || []).length) {
    const tl = pg.timeline;
    const tracks = tl.tracks.filter(tr => keptIds.has(tr.nodeId)).map(tr => ({
      nodeId: tr.nodeId, prop: tr.prop,
      keys: (tr.keys || []).map(k => ({ t: k.t, value: clip(k.value), ease: k.ease })),
    }));
    if (tracks.length) {
      ctx.timeline = {
        on: tl.on !== false, loop: tl.loop !== false, autoplay: tl.autoplay !== false,
        duration: tl.duration || 2000, tracks: tracks,
      };
    }
  }
  if (sel.size) ctx.selection = Array.from(sel);
  if (all.length > kept.length) ctx.note = 'showing ' + kept.length + ' of ' + all.length + ' nodes';
  // Project data + automation only ride along on High — they're rarely needed to place a button and
  // they're pure token cost on every other request.
  if (scope === 'high') {
    const vars = (ex.variables || []).map(v => ({ id: v.id, name: v.name, type: v.type, scope: 'global' }))
      .concat((ex.pageVars || []).map(v => ({ id: v.id, name: v.name, type: v.type, scope: 'page' })));
    if (vars.length) ctx.variables = vars;
    const wfs = (ex.workflows || []).map(w => ({ id: w.id, name: w.name }));
    if (wfs.length) ctx.workflows = wfs;
    const ccs = (ex.customComponents || []).map(c => ({ id: c.id, name: c.name, base: c.base }));
    if (ccs.length) ctx.customComponents = ccs;
  }
  return ctx;
}

function boxesOverlap(a, b, m) {
  m = m || 0;
  return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
}
// Nominal design width the agent lays out against (matches the "1440x1024 canvas" its System Message
// states). Used to decide whether displaced content still fits beside something or has to go below.
const AGENT_ARTBOARD_W = 1440;
const AGENT_ARTBOARD_H = 1024;

// Layout pass run after an agent batch. Models are unreliable at 2D placement — they overlap boxes,
// undersize containers and spill children past their parent's edge — so the executor owns layout:
//   1. containers grow to contain their children (deepest first)
//   2. newly added top-level nodes are flowed into free space instead of landing on existing work
// Only nodes from THIS batch move; whatever the user already had stays exactly where they put it.
function relayoutAgentBatch(pg, newIdSet, fillSet, artW, fillHSet, artH, gridIn) {
  fillSet = fillSet || new Set();
  fillHSet = fillHSet || new Set();
  artW = Math.round(artW || AGENT_ARTBOARD_W);   // real artboard width for this device (fallback: desktop)
  artH = Math.round(artH || AGENT_ARTBOARD_H);
  const grid = gridIn || agentGrid(null);        // no grid passed (older callers/tests) => plain rounding
  const childrenOf = {}, parentOf = {}, byId = {};
  pg.nodes.forEach(n => { byId[n.id] = n; });
  (pg.connections || []).filter(c => c.kind === 'child').forEach(c => {
    if (!childrenOf[c.from]) childrenOf[c.from] = [];
    childrenOf[c.from].push(c.to);
    parentOf[c.to] = c.from;
  });

  // Moving a node moves its whole subtree — children carry absolute coords, not offsets.
  const moveTree = (id, dx, dy) => {
    const n = byId[id];
    if (!n) return;
    n.x = Math.round(n.x + dx);
    n.y = Math.round(n.y + dy);
    (childrenOf[id] || []).forEach(k => moveTree(k, dx, dy));
  };

  // 1) Lay each container's children out along its layout axis, then grow it to contain them.
  //    Recursive, and the order matters: sizes settle bottom-up (a child container must know its
  //    final height before the sibling below it can be stacked), positions settle top-down.
  //    Only containers THIS batch created get re-flowed — re-flowing one the user hand-arranged would
  //    throw their work away. An existing container that merely gained a child still grows to fit.
  // Widths resolve TOP-DOWN (a child can only fill a parent whose own width is already final), then
  // we recurse, then heights and positions settle BOTTOM-UP. Getting this order wrong is why a
  // `w:"fill"` image inside a card filled the card's 260px DEFAULT and stayed 228px after the grid
  // resized that card to 353.
  const seen = new Set();
  // Forget a whole subtree so it can be laid out again — used when a child's height changes AFTER its
  // descendants were already sized against the old one.
  const clearSeen = (id) => { seen.delete(id); (childrenOf[id] || []).forEach(clearSeen); };
  // `defH` = this node's height is DEFINITE (pinned by the artboard or by a parent that stretched it),
  // as opposed to hugging its content. It has to travel top-down because a row can only give its
  // children a height if it has a real one itself — sizing them against a hugging row's 160px kind
  // default would be circular and wrong.
  const flow = (id, defH) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = byId[id];
    if (!n) return;
    // Free/anchored children are out of the flow entirely (CSS position:absolute): they are not sized
    // by the axis split, not stacked, and — like an absolutely-positioned element — do not grow their
    // parent. Everything below therefore works on `kids` (the flowed ones) and treats `freeKids`
    // separately, once the parent's own box has settled.
    const allKids = (childrenOf[id] || []).map(k => byId[k]).filter(Boolean);
    const kids = allKids.filter(k => !agentIsFree(k));
    const freeKids = allKids.filter(k => agentIsFree(k));
    // A top-level node must fit the 1440 artboard. Models size a page frame at 1440 but then place a
    // child wider than it, and the grow-to-contain step below used to expand the frame to ~1864 —
    // running the whole page off-canvas. Clamp here (before children size) so they size to the real
    // width, not a runaway one.
    if (newIdSet.has(id) && !parentOf[id]) {
      if (n.x < 0) n.x = 0;
      if (n.y < 0) n.y = 0;
      if (n.w > artW) n.w = artW;
      if (n.x + n.w > artW) n.x = Math.max(0, artW - n.w);
      // A screen root (h:"fill") spans the artboard exactly: pin it to 0,0 at full height BEFORE its
      // children size, so row panes stretch against the real height instead of a kind default. This is
      // what stops a login screen rendering as a short block with a dead band under it.
      if (fillHSet.has(id)) { n.y = 0; n.h = artH; }
    }
    // Padding and gap on the grid, for THIS batch's containers only — they are the two numbers every
    // child position is derived from, so putting them on the grid is what puts the children on it
    // (a 12px kind-default gap otherwise throws every row off an 8px grid). A container the user made
    // keeps whatever spacing they chose.
    let pad = n.padding != null ? n.padding : 16;
    let gap = n.gap != null ? n.gap : 8;
    if (newIdSet.has(id) && grid.on && kids.length) {
      // Containers only. Every node carries a default `gap`, so snapping unconditionally would rewrite
      // it on headings and buttons too — inert (a leaf has nothing to space) but visible in the
      // Inspector as a value nobody chose.
      pad = grid.to(pad); gap = grid.to(gap);
      if (n.padding != null) n.padding = pad;
      if (n.gap != null) n.gap = gap;
    }
    const inner = Math.max(24, n.w - pad * 2);
    const innerH = Math.max(24, n.h - pad * 2);
    const cols = Math.max(1, Math.round(n.columns) || 2);
    const cw = Math.max(24, Math.floor((inner - gap * (cols - 1)) / cols));

    // Kids this node hands a definite height to — they pass `true` into their own flow().
    const defKid = new Set();

    // 1) TOP-DOWN widths — before recursing, so descendants size against the real number. A child may
    //    NEVER be wider than the parent's inner box (that's what forced the frame to grow off-canvas).
    if (kids.length && newIdSet.has(id)) {
      if (n.layout === 'Grid') {
        kids.forEach(k => { k.w = cw; });
      } else if (n.layout === 'Flex row') {
        // Row items sit side by side; split the inner width for fill/stretch/oversized ones, leave
        // small explicit items (a logo, an icon) as they are.
        const per = Math.max(24, Math.floor((inner - gap * (kids.length - 1)) / kids.length));
        kids.forEach(k => { if (fillSet.has(k.id) || AGENT_STRETCH_KINDS[k.kind] || k.w > per) k.w = per; });
        // CSS `align-items: stretch` — THE DEFAULT ON A FLEX ROW. Every container child of a row with a
        // real height is full height, whether or not it asked. This mirrors the column branch below,
        // which has always stretched container children to the parent's inner WIDTH for free; the row
        // only ever honoured an explicit h:"fill", so a desktop body holding three columns sized them
        // horizontally and then let them hug vertically — leaving the page background showing under all
        // three ("the width is ok but the height is not"). Only when OUR height is definite: stretching
        // against a hugging row's kind default would be circular.
        // `align` is the CROSS axis, which on a row is the vertical one — so align:center/start/end opts
        // out, exactly as in CSS (and exactly as `align` opts out of width-stretch on a column).
        const vstretch = !n.align || n.align === 'stretch';
        kids.forEach(k => {
          if (!defH) return;
          if (fillHSet.has(k.id) || (vstretch && AGENT_STRETCH_KINDS[k.kind])) { k.h = innerH; defKid.add(k.id); }
        });
      } else {
        // Flex column (default): fill/stretch children span the inner width; any other child that
        // overshoots is clamped to fit. An `align` other than stretch opts out, exactly as CSS does —
        // align-items:center never stretches. Without this a 420px login card centred on a screen root
        // got stretched to the full artboard and the "centring" was invisible. An explicit w:"fill"
        // still wins either way: that child asked to span.
        const stretch = !n.align || n.align === 'stretch';
        kids.forEach(k => {
          if (fillSet.has(k.id) || (stretch && AGENT_STRETCH_KINDS[k.kind])) k.w = inner;
          else if (k.w > inner) k.w = inner;
        });
      }
    }

    // A free child still sizes against its parent (a w:"fill" dialog spans it) — it just isn't placed
    // by the flow. Do it before recursing, same order as the flowed kids.
    if (freeKids.length && newIdSet.has(id)) {
      freeKids.forEach(k => {
        if (fillSet.has(k.id)) k.w = inner;
        else if (k.w > inner) k.w = inner;
        if (fillHSet.has(k.id) && defH) k.h = innerH;
      });
    }

    // 2) recurse — children now know their final width, and a row's children their final height
    kids.forEach(k => flow(k.id, defKid.has(k.id)));
    freeKids.forEach(k => flow(k.id, fillHSet.has(k.id) && defH));
    // A leaf (heading, button, image) never reaches the hug below, so its own height is snapped here.
    // Snapping up keeps a 52px heading from clipping while putting the next sibling back on the grid —
    // and it is heights, not widths, that set the page's vertical rhythm.
    if (!allKids.length) {
      if (newIdSet.has(id) && grid.on) n.h = grid.up(n.h);
      return;
    }
    // Anchor the free kids once our own box is final. A node holding ONLY free children has no flow to
    // run, so this is also the point where it finishes.
    const anchorFree = () => {
      if (!newIdSet.has(id)) return;
      freeKids.forEach(k => {
        const p = placeFreeChild(n, k, pad);
        moveTree(k.id, p.x - k.x, p.y - k.y);
      });
    };
    if (!kids.length) { anchorFree(); return; }

    // 2.5) Column fill: a child that asked for h:"fill" takes the parent's leftover vertical space once
    //      its fixed-height siblings have settled — the flex-grow case (a body between a fixed nav and a
    //      fixed footer).
    //      It gets its EXACT share, up or down. This used to only ever grow, which looked safe and was
    //      wrong: `h:"fill"` is resolved once at addNode time against the parent's height AT THAT MOMENT,
    //      so a body inside a 1024 root is born 1024 — already bigger than the 936 of real slack. The
    //      grow-only guard then skipped it, the body stayed a full artboard tall, and the root hugged
    //      out to 1112 — taller than the artboard it was pinned to. Shrinking cannot clip content: the
    //      hug below still does `max(h, contentH)` for a fill node, so real content always wins.
    if (kids.length && newIdSet.has(id) && defH && n.layout !== 'Grid' && n.layout !== 'Flex row') {
      const growKids = kids.filter(k => fillHSet.has(k.id));
      if (growKids.length) {
        const fixed = kids.reduce((s, k) => s + (fillHSet.has(k.id) ? 0 : k.h), 0);
        const slack = innerH - fixed - gap * (kids.length - 1);
        const per = Math.max(24, Math.floor(slack / growKids.length));
        growKids.forEach(k => {
          if (per === k.h) return;
          k.h = per;
          // The child just went from hugging to definite, but its own subtree was already flowed
          // against the old height — so a row inside it never stretched ITS children. Re-flow that
          // subtree now that the real height is known. Bounded: only children that actually grew, and
          // `seen` still guards against cycles once the re-flow completes.
          clearSeen(k.id);
          flow(k.id, true);
        });
      }
    }

    // 3) BOTTOM-UP positions + grow to contain
    const place = (k, nx, ny) => moveTree(k.id, nx - k.x, ny - k.y);
    if (newIdSet.has(id)) {
      const x0 = n.x + pad, y0 = n.y + pad;
      if (n.layout === 'Grid') {
        // Real grid flow: `columns` cells sharing the inner width, wrapping into rows. Without this a
        // {"layout":"Grid","columns":3} row of cards just stacked vertically at full width.
        let cy = y0, rowH = 0;
        kids.forEach((k, i) => {
          const c = i % cols;
          if (c === 0 && i > 0) { cy += rowH + gap; rowH = 0; }
          place(k, x0 + c * (cw + gap), cy);
          rowH = Math.max(rowH, k.h);
        });
      } else if (n.layout === 'Flex row') {
        let cx = x0;
        kids.forEach(k => { place(k, cx, y0); cx += k.w + gap; });
      } else {
        // Flex column (default): stack using each child's SETTLED height, so a sibling that grew
        // can't be overlapped by the one after it (a chart used to land inside the grid above it).
        let cy = y0;
        kids.forEach(k => { place(k, x0, cy); cy += k.h + gap; });
      }

      // Distribute leftover space along the main axis. Nodes render at absolute coords, so `justify`
      // is inert metadata unless it is baked into them here. Without it, content shorter than its
      // container always piles at the top — which is the dead band under a full-height screen root,
      // and why a centred login card sits jammed against the artboard's top edge.
      const j = n.justify;
      const axis = n.layout === 'Flex row' ? 'x' : (n.layout === 'Grid' ? '' : 'y');
      if (j && j !== 'start' && axis) {
        const vert = axis === 'y';
        const lo = Math.min.apply(null, kids.map(k => (vert ? k.y : k.x)));
        const hi = Math.max.apply(null, kids.map(k => (vert ? k.y + k.h : k.x + k.w)));
        const slack = (vert ? innerH : inner) - (hi - lo);
        const shift = (k, d) => moveTree(k.id, vert ? 0 : d, vert ? d : 0);
        if (slack > 0) {
          if (j === 'center') kids.forEach(k => shift(k, Math.round(slack / 2)));
          else if (j === 'end') kids.forEach(k => shift(k, slack));
          else if ((j === 'space-between' || j === 'space-around') && kids.length > 1) {
            const step = j === 'space-between' ? slack / (kids.length - 1) : slack / kids.length;
            const lead = j === 'space-around' ? step / 2 : 0;
            kids.forEach((k, i) => shift(k, Math.round(lead + step * i)));
          }
        }
      }

      // Cross-axis alignment (CSS align-items), baked in for the same reason as `justify` above. Only
      // children narrower/shorter than the inner box can move — a fill/stretch child already spans it,
      // so `stretch` is a no-op here. This is what centres a fixed-width card inside a full-height pane.
      const al = n.align;
      if (al && al !== 'start' && al !== 'stretch' && axis) {
        const col = axis === 'y';   // column stacks on y, so its cross axis is x (and vice versa)
        kids.forEach(k => {
          const room = col ? inner - k.w : innerH - k.h;
          if (room <= 0) return;
          const d = al === 'center' ? Math.round(room / 2) : room;
          moveTree(k.id, col ? d : 0, col ? 0 : d);
        });
      }
    }
    const right = Math.max.apply(null, kids.map(k => k.x + k.w));
    const bottom = Math.max.apply(null, kids.map(k => k.y + k.h));
    n.w = Math.max(n.w, Math.round(right - n.x + pad));
    // Height HUGS the content for this batch's containers — auto-layout hugs, it does not keep a
    // guessed height. Math.max alone (grow-only) left every model-sized frame at whatever h it
    // invented, with a dead band under the content; six such frames stacked in a column then
    // overflowed the artboard bottom. A node the USER sized is still grow-only — shrinking a frame
    // they hand-sized would throw their work away. An h:"fill" node keeps its fill height.
    // Snap UP, never down: a hugged height rounded down would clip the content it just measured.
    const contentH = grid.up(bottom - n.y + pad);
    // Hug ONLY if nothing already decided this node's height. `defH` means a parent stretched us (a
    // row child), the artboard pinned us (a screen root), or we took a column's slack — in every one of
    // those the height is a decision, and hugging would immediately undo it. That is precisely what
    // silently defeated the row stretch: children were sized to the row's inner height in step 1 and
    // then collapsed back to their content here, three lines later. A definite node still GROWS to
    // contain overflowing content — being told a height is not a licence to clip.
    if (newIdSet.has(id) && !fillHSet.has(id) && !defH) n.h = contentH;
    else n.h = Math.max(n.h, contentH);
    // A screen root means EXACTLY the artboard. The hug above can push it past that when a child
    // overflows, and a root taller than the artboard is a contradiction — h:"fill" asked for the
    // artboard, not for whatever its contents happened to need. Re-pin it. Overflowing children keep
    // their own coordinates, so the overflow stays visible (and CanvasImage still draws them outside
    // the artboard box for the audit to catch) rather than being papered over by a taller root.
    if (newIdSet.has(id) && !parentOf[id] && fillHSet.has(id)) n.h = artH;
    // Last: our box is final, so a free child can be anchored against its real edges. Doing this any
    // earlier would centre a dialog against a height that was still about to change.
    anchorFree();
    // Belt: a top-level node never grows past the artboard, even if a child slipped through.
    if (!parentOf[id]) n.w = Math.min(n.w, artW - Math.max(0, n.x));
  };
  // A root's height is definite only when it's a screen root pinned to the artboard (h:"fill"); a page
  // section hugs its content, so nothing inside it can stretch to a height that isn't decided yet.
  pg.nodes.filter(n => !parentOf[n.id]).forEach(r => flow(r.id, newIdSet.has(r.id) && fillHSet.has(r.id)));

  // 1.5) Stack the batch's full-bleed sections FLUSH, in order, from the top of the artboard.
  //      A landing page is a continuous column of sections — nav against hero against features. Two
  //      things conspire against that: nodes created without coords go through findOpenSpot, which is
  //      the editor's MANUAL placement helper (it starts at 80,80 and tiles with 24px margins), and any
  //      y assigned at creation is stale anyway because heights only settle in flow() above, where
  //      containers hug their content. Both leave the artboard showing through as dark bands — above
  //      the nav and between every section. Re-stacking here, after heights settle, is the only place
  //      that can be right.
  //      Full-bleed only: a narrow floating node is not a page section and keeps its placement. If the
  //      user already has work on the page we stack BELOW it rather than on top of it.
  {
    const allRoots = pg.nodes.filter(n => !parentOf[n.id]);
    const isSection = (n) => n.w >= artW - 2;
    const sections = allRoots.filter(n => newIdSet.has(n.id) && isSection(n)).sort((a, b) => (a.y - b.y) || (a.x - b.x));
    if (sections.length) {
      const existing = allRoots.filter(n => !newIdSet.has(n.id));
      // Start on the grid: stacking flush from an off-grid baseline would put every section below it
      // off-grid too, however carefully their own heights were snapped.
      let cy = existing.length ? grid.to(Math.max.apply(null, existing.map(o => o.y + o.h))) : 0;
      sections.forEach(s => { moveTree(s.id, 0 - s.x, cy - s.y); cy += s.h; });
    }
  }

  // 2) Flow the batch's new top-level nodes into free space. Prefer sliding RIGHT when it still fits
  //    on the artboard — that's what you want beside a tall sidebar — and only fall back to pushing
  //    DOWN (the natural answer when two full-width sections collide).
  const roots = pg.nodes.filter(n => !parentOf[n.id]);
  const boxOf = (n) => ({ x: n.x, y: n.y, w: n.w, h: n.h });
  const obstacles = roots.filter(n => !newIdSet.has(n.id)).map(boxOf);
  roots.filter(n => newIdSet.has(n.id)).sort((a, b) => (a.y - b.y) || (a.x - b.x)).forEach(n => {
    let guard = 0;
    while (guard++ < 60) {
      // Margin 0 on purpose: only REAL overlap counts. A margin here treats a legitimately adjacent
      // layout (content flush against a 240px sidebar, 240+1199=1439 inside a 1440 artboard) as a
      // collision, and the relocation then dumps it off the bottom of the canvas.
      const hit = obstacles.filter(o => boxesOverlap(boxOf(n), o, 0));
      if (!hit.length) break;
      const right = Math.max.apply(null, hit.map(o => o.x + o.w));
      const bottom = Math.max.apply(null, hit.map(o => o.y + o.h));
      if (right + 24 + n.w <= artW) moveTree(n.id, right + 24 - n.x, 0);
      else moveTree(n.id, 0, bottom + 24 - n.y);
    }
    obstacles.push(boxOf(n));
  });
}

// Descendant set of `rootId` following child edges — used to prevent parenting cycles.
function descendantsOf(rootId, connections) {
  const childMap = {};
  connections.filter(c => c.kind === 'child').forEach(c => { (childMap[c.from] ||= []).push(c.to); });
  const out = new Set();
  const walk = (id) => (childMap[id] || []).forEach(cid => { if (!out.has(cid)) { out.add(cid); walk(cid); } });
  walk(rootId);
  return out;
}

// Ensure a loaded project has the workflow/variable fields (older saves predate them).
// Migrate a node's interaction states across the trigger-model change: the old single "clickOn"
// state becomes "click" (left-click). Key-agnostic runtime keeps everything else working as-is.
function migrateStateNode(n) {
  if (!n || !n.states || !n.states.clickOn) return n;
  const states = { ...n.states };
  states.click = { ...(states.click || {}), ...states.clickOn };
  delete states.clickOn;
  return { ...n, states };
}

function withWorkflowDefaults(project) {
  return {
    ...project,
    workflows: project.workflows || [],
    variables: project.variables || [],
    customComponents: project.customComponents || [],
    customShaders: project.customShaders || [],   // user-saved GLSL shaders: [{ id, name, code }]
    enabledLibrary: project.enabledLibrary || [],
    assets: project.assets || [],   // Code-view file system: user files/folders + uploaded binaries
    pages: (project.pages || []).map(p => ({ ...p, vars: p.vars || [], nodes: (p.nodes || []).map(migrateStateNode) })),
  };
}

// Resolve a node's image `src`: an http/data/blob URL passes through; an internal asset path
// (e.g. "src/assets/logo.png") is looked up in the project's assets and swapped for its data URL,
// so images referenced by internal path render on the canvas, in Preview, and in exports.
window.resolveAssetSrc = window.resolveAssetSrc || function (src) {
  if (!src || /^(https?:|data:|blob:|\/\/)/i.test(src)) return src;
  const list = window.__latticeAssets || [];
  const key = src.replace(/^\.?\//, '');
  const base = key.split('/').pop();
  const hit = list.find(a => a.type === 'file' && (a.path === key || a.path === 'src/' + key || a.path.replace(/^src\//, '') === key)) ||
              list.find(a => a.type === 'file' && a.dataUrl && a.path.split('/').pop() === base);
  return hit && hit.dataUrl ? hit.dataUrl : src;
};

// Custom fonts: any font-file asset uploaded into the project becomes a usable font family whose
// name is the filename without extension (e.g. "src/assets/fonts/Inter-Bold.woff2" -> "Inter-Bold").
const FONT_EXT_RE = /\.(woff2?|ttf|otf)$/i;
const FONT_FORMAT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
window.latticeFontFamilies = window.latticeFontFamilies || function (assets) {
  const out = [];
  (assets || []).forEach(a => {
    if (a.type !== 'file' || !FONT_EXT_RE.test(a.path)) return;
    const family = a.path.split('/').pop().replace(FONT_EXT_RE, '');
    if (family && out.indexOf(family) === -1) out.push(family);
  });
  return out;
};
// Build the @font-face CSS for every font asset (used both to inject into the editor <head> and to
// seed the exported project's index.css). `srcFor(path)` yields the url() value for that asset.
window.latticeFontFaceCss = window.latticeFontFaceCss || function (assets, srcFor) {
  return (assets || []).filter(a => a.type === 'file' && FONT_EXT_RE.test(a.path)).map(a => {
    const ext = (a.path.match(FONT_EXT_RE) || [])[1].toLowerCase();
    const family = a.path.split('/').pop().replace(FONT_EXT_RE, '');
    const url = srcFor(a);
    if (!url) return '';
    return "@font-face { font-family: '" + family + "'; src: url(" + url + ") format('" + (FONT_FORMAT[ext] || 'truetype') + "'); font-display: swap; }";
  }).filter(Boolean).join('\n');
};

// Props captured when saving a configured node as a reusable custom component (its "variant").
const VARIANT_PROP_KEYS = ['label', 'variant', 'btnSize', 'tone', 'fillColor', 'gradient', 'shader',
  'textColor', 'fontSize', 'fontWeight', 'fontFamily', 'letterSpacing', 'textAlign', 'textTransform',
  'radius', 'radii', 'borderWidth', 'borderStyle', 'borderColor', 'effects', 'opacity',
  'layout', 'gap', 'padding', 'columns', 'align', 'justify', 'w', 'h',
  'iconName', 'iconSize', 'iconSrc', 'iconSvg', 'placeholder', 'inputType', 'optionsText', 'checked', 'src',
  'chartType', 'chartColor', 'value'];
function captureVariantProps(node) {
  const o = {};
  for (const k of VARIANT_PROP_KEYS) if (node[k] !== undefined && node[k] !== '') o[k] = node[k];
  return o;
}

// --- Asset persistence (IndexedDB) ----------------------------------------------------------------
// Image/font assets are base64 data URLs — routinely several MB, far past localStorage's ~5MB origin
// quota. Bundling them into the single `lattice_project_v2` key made setItem throw QuotaExceededError,
// which was swallowed silently — so the WHOLE project (pages + scaffold + assets) failed to save and
// every reload fell back to defaults (hence re-"Initialize project" and lost uploads). Assets now live
// in IndexedDB (hundreds of MB+); the light structural project stays in localStorage for instant boot.
const IDB_NAME = 'lattice_editor', IDB_STORE = 'kv', IDB_ASSETS_KEY = 'assets_v1';
function idbOpen() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'));
    let req;
    try { req = indexedDB.open(IDB_NAME, 1); } catch (e) { return reject(e); }
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbGet(key) {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  })).catch(() => undefined);
}
function idbSet(key, val) {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite'); tx.objectStore(IDB_STORE).put(val, key);
    tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error);
  })).catch(() => false);
}

function loadState() {
  try {
    const v2 = JSON.parse(localStorage.getItem('lattice_project_v2'));
    if (v2?.project?.pages?.length) return { project: withWorkflowDefaults(v2.project), settings: { ...DEFAULT_SETTINGS, ...(v2.settings || {}) } };
  } catch {}
  // Migrate a v1 single-canvas save into a one-page project
  try {
    const v1 = JSON.parse(localStorage.getItem('lattice_canvas_v1'));
    if (v1?.nodes) {
      return {
        project: withWorkflowDefaults({ pages: [{ id: 'page_home', name: 'Pricing page', route: '/pricing', nodes: v1.nodes, connections: v1.connections || [] }], activePageId: 'page_home' }),
        settings: DEFAULT_SETTINGS,
      };
    }
  } catch {}
  return {
    project: withWorkflowDefaults({ pages: [{ id: 'page_home', name: 'Pricing page', route: '/pricing', nodes: DEFAULT_NODES, connections: DEFAULT_CONNECTIONS }], activePageId: 'page_home' }),
    settings: DEFAULT_SETTINGS,
  };
}
window.withWorkflowDefaults = withWorkflowDefaults;

// Shown full-screen while a cloud project is being fetched, so the editor never paints the previous
// (localStorage-seeded) project for a frame before the real one loads. Uses only the token CSS vars,
// which are already applied via the stylesheet link before React mounts.
function ProjectLoadingScreen({ name }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <style>{`
        @keyframes lt-boot-spin { to { transform: rotate(360deg); } }
        @keyframes lt-boot-pulse { 0%, 100% { opacity: .4 } 50% { opacity: .9 } }
        @keyframes lt-boot-shimmer { 0% { background-position: -260px 0 } 100% { background-position: 260px 0 } }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: 260 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--action-solid)', animation: 'lt-boot-spin .8s linear infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'Loading project'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', animation: 'lt-boot-pulse 1.4s ease-in-out infinite' }}>Loading components…</div>
        </div>
        {/* Skeleton bars imply the components streaming in, rather than a bare spinner. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 2 }}>
          {[100, 78, 90].map((w, i) => (
            <div key={i} style={{ height: 9, width: w + '%', borderRadius: 5, background: 'linear-gradient(90deg, var(--surface-inset) 0px, var(--surface-hover) 110px, var(--surface-inset) 220px)', backgroundSize: '440px 100%', animation: `lt-boot-shimmer 1.25s ease-in-out ${i * 0.16}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LatticeApp() {
  const { Dialog, Toast, Button, Input, Switch, Select } = window.LatticeDesignSystem_e801cb;

  const bootRef = React.useRef(null);
  if (bootRef.current === null) bootRef.current = loadState();
  const boot = bootRef.current;
  const [pages, setPages] = React.useState(boot.project.pages);
  const [activePageId, setActivePageId] = React.useState(boot.project.activePageId);
  const [settings, setSettings] = React.useState(boot.settings);

  // --- Workflow tab: named automation graphs + project-wide variables ---
  const [workflows, setWorkflows] = React.useState(boot.project.workflows || []);
  const [variables, setVariables] = React.useState(boot.project.variables || []); // global vars
  const [customComponents, setCustomComponents] = React.useState(boot.project.customComponents || []); // saved variants
  const [customShaders, setCustomShaders] = React.useState(boot.project.customShaders || []);          // user-saved GLSL shaders
  const [libraryItems, setLibraryItems] = React.useState([]);                                          // this account's installed assets/plugins
  const [enabledLibrary, setEnabledLibrary] = React.useState(boot.project.enabledLibrary || []);       // library item ids enabled for THIS project
  const [assets, setAssets] = React.useState(boot.project.assets || []);                                // Code-view files/folders + uploaded images
  // Keep the global asset table in sync so window.resolveAssetSrc (used by the node renderer) sees them.
  // Also register uploaded fonts: expose their family names and inject @font-face rules so text
  // components render the custom font on the canvas AND in Preview (both use window.PreviewNode).
  React.useEffect(() => {
    window.__latticeAssets = assets;
    window.__latticeFonts = window.latticeFontFamilies(assets);
    let el = document.getElementById('lattice-fonts');
    if (!el) { el = document.createElement('style'); el.id = 'lattice-fonts'; document.head.appendChild(el); }
    el.textContent = window.latticeFontFaceCss(assets, a => a.dataUrl);
  }, [assets]);
  // Add an uploaded image under src/assets/ and return its internal path (used by the Inspector so a
  // component can reference an image by internal path instead of a URL).
  const addImageAsset = (name, dataUrl, mime) => {
    const safe = (name || 'image').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const taken = new Set(assets.map(a => a.path));
    let path = 'src/assets/' + safe, i = 1;
    while (taken.has(path)) path = 'src/assets/' + safe.replace(/(\.[^.]+)?$/, '-' + (i++) + '$1');
    setAssets(list => list.concat([{ id: 'as_' + Date.now().toString(36), path, type: 'file', mime, dataUrl }]));
    return path;
  };
  const toggleLibraryItem = (id) => setEnabledLibrary(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  // Items enabled for this project, resolved into the editor's existing systems.
  const enabledItems = React.useMemo(() => libraryItems.filter(i => enabledLibrary.includes(i.id)), [libraryItems, enabledLibrary]);
  const shaderPresets = React.useMemo(() => {
    const out = { ...(window.SHADER_PRESETS || {}) };
    enabledItems.filter(i => i.type === 'shader' && i.data && i.data.code).forEach(i => { out[i.name] = i.data.code; });
    (customShaders || []).forEach(s => { if (s && s.name && s.code) out[s.name] = s.code; });
    return out;
  }, [enabledItems, customShaders]);
  const libraryComponents = React.useMemo(() =>
    enabledItems.filter(i => i.type === 'component' && i.data && i.data.base)
      .map(i => ({ id: 'lib_' + i.id, name: i.name, icon: 'component', base: i.data.base, props: i.data.props || {} })),
    [enabledItems]);
  const [activeWorkflowId, setActiveWorkflowId] = React.useState((boot.project.workflows || [])[0]?.id || null);
  // Runtime state, live only in Preview: variable values (by var id) and workflow-driven prop overrides.
  const [runtimeVars, setRuntimeVars] = React.useState({}); // varId -> value
  const [runtimeProps, setRuntimeProps] = React.useState({}); // nodeId -> patch
  const [runLog, setRunLog] = React.useState([]); // recent workflow runs (newest first): { id, name, at, steps, result }

  const [view, setView] = React.useState('design');
  const [previewMode, setPreviewMode] = React.useState(false);
  // Run system (popup windows): active toggles Run↔Stop; refs hold the webpage + debug-console windows.
  const [runState, setRunState] = React.useState({ active: false, paused: false, debug: false });
  const runWinRef = React.useRef(null);
  const conWinRef = React.useRef(null);
  const runPollRef = React.useRef(null);
  const [activeDevice, setActiveDevice] = React.useState('desktop');
  const [orient, setOrient] = React.useState({ desktop: 'landscape', tablet: 'landscape', mobile: 'portrait', custom: 'landscape' });
  const [selectedIds, setSelectedIds] = React.useState(['cmp_card']);
  const selectedId = selectedIds[0] || null;
  const [editingState, setEditingState] = React.useState('default'); // default | hoverOn | hoverOff | clickOn | custom id
  const [editingFrame, setEditingFrame] = React.useState(null);      // index of the animation frame being viewed
  // Animation-editor tabs (transient, not persisted): each { id, pageId, nodeId, stateId }.
  const [openAnimTabs, setOpenAnimTabs] = React.useState([]);
  const [activeAnimId, setActiveAnimId] = React.useState(null);      // active anim tab id, or null when a page is active
  const [animFrameIdx, setAnimFrameIdx] = React.useState(0);         // selected keyframe in the active anim tab
  const [sceneOpen, setSceneOpen] = React.useState(false);           // page scene-timeline editor open
  const [sceneReplay, setSceneReplay] = React.useState(0);           // bumped to restart Preview's scene timeline
  const [panelW, setPanelW] = React.useState(() => {                 // resizable side-panel widths (per-user)
    try { return { left: 280, right: 280, ...JSON.parse(localStorage.getItem('lattice_panels') || '{}') }; } catch { return { left: 280, right: 280 }; }
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_panels', JSON.stringify(panelW)); } catch {} }, [panelW]);
  // Resizable left-section heights. `null` = fit content (no reserved empty space); a number = an
  // explicit height the user dragged to. Layers always flexes to fill whatever remains.
  const [panelH, setPanelH] = React.useState(() => {
    try { return { pages: null, library: 300, ...JSON.parse(localStorage.getItem('lattice_left_sizes') || '{}') }; } catch { return { pages: null, library: 300 }; }
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_left_sizes', JSON.stringify(panelH)); } catch {} }, [panelH]);
  const pagesSecRef = React.useRef(null);     // left-panel section wrappers, measured on resize-drag start
  const librarySecRef = React.useRef(null);
  // Height of the timeline dock as a fraction of the center column (the rest shows the live page above).
  const [timelineFrac, setTimelineFrac] = React.useState(() => {
    const v = parseFloat(localStorage.getItem('lattice_timeline_frac')); return v >= 0.2 && v <= 0.94 ? v : 0.58;
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_timeline_frac', String(timelineFrac)); } catch {} }, [timelineFrac]);
  const timelineAreaRef = React.useRef(null); // measured to convert a resize-drag into a fraction
  // Fully collapse a side panel for more canvas space (independent of its resizable width).
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return { left: false, right: false, ...JSON.parse(localStorage.getItem('lattice_collapsed') || '{}') }; } catch { return { left: false, right: false }; }
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_collapsed', JSON.stringify(collapsed)); } catch {} }, [collapsed]);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);   // AI Helper assistant panel (Plan Pro)
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(null);
  const [allowEditing, setAllowEditing] = React.useState(true);
  const [toast, setToast] = React.useState(null);
  const [inviteEmail, setInviteEmail] = React.useState('');

  // Project sync — when the editor is opened from the dashboard as ?project=<id>
  const projectId = React.useRef(new URLSearchParams(window.location.search).get('project')).current;
  // "Run" opens this same URL with ?run=1 in a new tab — a chromeless, live run of the prototype.
  const runFlag = React.useRef(new URLSearchParams(window.location.search).get('run')).current;
  const [projectName, setProjectName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const projectLoadedRef = React.useRef(false);
  // Only a cloud project has a remote load to wait for; standalone (localStorage) mode is ready at once.
  const [loading, setLoading] = React.useState(!!projectId);

  const page = pages.find(p => p.id === activePageId) || pages[0];
  const nodes = page.nodes;
  const connections = page.connections;
  // Geometry "device": resolves desktop screen-types to their own override layer (see geomDeviceKey),
  // so each 16:9 / 4:3 / … screen-type remembers its own node sizes & positions.
  const geomDevice = geomDeviceKey(activeDevice, settings.desktopPreset);
  // Nodes resolved to the active device's geometry — what the canvas/preview/inspector render.
  const viewNodes = React.useMemo(() => nodes.map(n => ({ ...n, ...geomAt(n, geomDevice) })), [nodes, geomDevice]);
  const selected = viewNodes.find(n => n.id === selectedId) || null;
  // When editing a non-default interaction state, the Inspector shows/edits the merged node and the
  // design canvas previews that state on the selected node only.
  const mergeState = (n, s) => (window.mergeState ? window.mergeState(n, s) : n);
  // The pose shown/edited for the selected node: a viewed animation frame if one is selected, else
  // the state's working overrides.
  const posed = (n) => {
    const cs = (n.customStates || []).find(c => c.id === editingState);
    if (cs && editingFrame != null && cs.frames && cs.frames[editingFrame] && window.mergeFrame) return window.mergeFrame(n, cs.frames[editingFrame]);
    return mergeState(n, editingState);
  };
  const inspectorNode = (selected && editingState !== 'default') ? posed(selected) : selected;
  const canvasNodes = React.useMemo(() => {
    if (editingState === 'default' || !selectedId) return viewNodes;
    return viewNodes.map(n => n.id === selectedId ? posed(n) : n);
  }, [viewNodes, selectedId, editingState, editingFrame]);

  // --- Animation editor tab: resolve the active tab → its node + custom anim state + selected frame ---
  const activeAnim = openAnimTabs.find(t => t.id === activeAnimId) || null;
  const animNode = activeAnim ? (viewNodes.find(n => n.id === activeAnim.nodeId) || null) : null;
  const animState = (activeAnim && animNode) ? (animNode.customStates || []).find(c => c.id === activeAnim.stateId) || null : null;
  const animValid = !!(activeAnim && animNode && animState);       // tab still points at a live node+state
  const showScene = sceneOpen && !animValid;                       // page scene-timeline editor is active
  // Is there a component animation to switch *back* to from page scope? Either an anim tab is already
  // open on this page, or the selected node owns an animation state we could open one for.
  const canComponentTimeline = openAnimTabs.some(t => t.pageId === activePageId) || (() => {
    const n = nodes.find(x => x.id === selectedIds[0]);
    return !!(n && (n.customStates || []).some(c => (c.type || 'static') === 'anim'));
  })();
  const animFrame = animValid ? (animState.frames || [])[animFrameIdx] : null;
  // While an anim tab is open, the Inspector edits the selected keyframe's captured pose.
  const animInspectorNode = animValid ? (window.mergeFrame ? window.mergeFrame(animNode, animFrame) : animNode) : null;
  // Tab-bar labels for the open animation editors (state name, resolved from its page's node).
  const animTabList = openAnimTabs.map(t => {
    const pg = pages.find(p => p.id === t.pageId);
    const n = pg && pg.nodes.find(x => x.id === t.nodeId);
    const cs = n && (n.customStates || []).find(c => c.id === t.stateId);
    return { id: t.id, label: (cs && cs.name) || 'Animation' };
  });
  // Artboard size = custom size as-is, or a preset oriented portrait/landscape.
  const artboard = React.useMemo(() => {
    if (activeDevice === 'custom') return (settings.customSize && settings.customSize.w) ? settings.customSize : { w: 1200, h: 800 };
    const b = activeDevice === 'desktop' ? desktopSize(settings.desktopPreset) : (DEVICE[activeDevice] || DEVICE.desktop);
    const lo = Math.max(b.w, b.h), sh = Math.min(b.w, b.h);
    return (orient[orientKeyFor(activeDevice, settings.desktopPreset)] || 'landscape') === 'portrait' ? { w: sh, h: lo } : { w: lo, h: sh };
  }, [activeDevice, orient, settings.customSize, settings.desktopPreset]);

  const setCustomSize = (w, h) => setSettings(s => ({ ...s, customSize: { w: Math.max(200, Math.round(+w) || 1200), h: Math.max(200, Math.round(+h) || 800) } }));
  const setDesktopPreset = (id) => setSettings(s => ({ ...s, desktopPreset: id }));
  // When responsive mode is off the project is desktop-only — keep the active device on desktop.
  React.useEffect(() => { if (!settings.responsive && activeDevice !== 'desktop') setActiveDevice('desktop'); }, [settings.responsive, activeDevice]);
  const toggleOrientation = () => {
    if (activeDeviceRef.current === 'custom') {
      setSettings(s => { const c = s.customSize || { w: 1200, h: 800 }; return { ...s, customSize: { w: c.h, h: c.w } }; });
    } else {
      setOrient(o => { const k = orientKeyFor(activeDeviceRef.current, settings.desktopPreset); return { ...o, [k]: (o[k] || 'landscape') === 'landscape' ? 'portrait' : 'landscape' }; });
    }
  };

  // Undo/redo — per page
  const historyRef = React.useRef({});
  const [, setHistoryTick] = React.useState(0);
  const bumpHistory = () => setHistoryTick(t => t + 1);
  const getHist = (pid) => (historyRef.current[pid] ||= { past: [], future: [] });
  const activeHist = historyRef.current[activePageId] || { past: [], future: [] };
  const canUndo = activeHist.past.length > 0;
  const canRedo = activeHist.future.length > 0;

  // Mirrors for stable callbacks / document-level listeners (avoid stale closures)
  const nodesRef = React.useRef(nodes);
  const connectionsRef = React.useRef(connections);
  const selectedIdsRef = React.useRef(selectedIds);
  const activePageIdRef = React.useRef(activePageId);
  const activeDeviceRef = React.useRef('desktop');
  const geomDeviceRef = React.useRef('desktop'); // active geometry layer (device or desktop:<preset>)
  const clipboardRef = React.useRef(null);
  const lastNudgeRef = React.useRef(0);
  const dragUndoRef = React.useRef(null);
  const canvasViewRef = React.useRef(null);   // persists Canvas pan/zoom across preview toggles
  const canvasApiRef = React.useRef(null);    // Canvas publishes { fit, reset, zoomTo, zoomToSelection } here
  const artboardRef = React.useRef(null);     // current device artboard box, for single-node align
  const settingsRef = React.useRef(null);     // { snap, gridSize, … } — the agent lays out on the same grid
  const editingStateRef = React.useRef('default');
  const openAnimTabsRef = React.useRef([]);
  const activeAnimRef = React.useRef(null);
  const animFrameIdxRef = React.useRef(0);
  const workflowsRef = React.useRef(workflows);
  const variablesRef = React.useRef(variables);
  const customComponentsRef = React.useRef(customComponents);
  const runtimeVarsRef = React.useRef(runtimeVars);
  const pagesRef = React.useRef(pages);
  const viewRef = React.useRef(view);
  const timelineOpenRef = React.useRef(false); // a TimelineEditor covers the canvas — it owns ⌫ and ←/→
  const timelinePlayheadRef = React.useRef(0);  // live playhead (ms) of the open timeline; read when the Inspector keys a property
  const animCtlRef = React.useRef(null);       // PreviewCanvas publishes { playAnim } here while mounted
  React.useEffect(() => { editingStateRef.current = editingState; }, [editingState]);
  React.useEffect(() => { openAnimTabsRef.current = openAnimTabs; }, [openAnimTabs]);
  React.useEffect(() => { activeAnimRef.current = activeAnim; }, [activeAnim]);
  React.useEffect(() => { animFrameIdxRef.current = animFrameIdx; }, [animFrameIdx]);
  React.useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  React.useEffect(() => { connectionsRef.current = connections; }, [connections]);
  React.useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  React.useEffect(() => { activePageIdRef.current = activePageId; }, [activePageId]);
  React.useEffect(() => { activeDeviceRef.current = activeDevice; }, [activeDevice]);
  React.useEffect(() => { geomDeviceRef.current = geomDevice; }, [geomDevice]);
  React.useEffect(() => { artboardRef.current = artboard; }, [artboard]);
  // The snap grid, for the agent. Every drag the USER makes is snapped to it (Canvas.jsx), so agent
  // output that ignores it is off-grid the moment it lands — nudge one node and it visibly jumps.
  React.useEffect(() => { settingsRef.current = settings; }, [settings]);
  React.useEffect(() => { workflowsRef.current = workflows; }, [workflows]);
  React.useEffect(() => { variablesRef.current = variables; }, [variables]);
  React.useEffect(() => { customComponentsRef.current = customComponents; }, [customComponents]);
  React.useEffect(() => { runtimeVarsRef.current = runtimeVars; }, [runtimeVars]);
  React.useEffect(() => { pagesRef.current = pages; }, [pages]);
  React.useEffect(() => { viewRef.current = view; }, [view]);
  React.useEffect(() => { timelineOpenRef.current = animValid || showScene; }, [animValid, showScene]);

  // Load the project's canvas from the API (falls back to localStorage boot if standalone)
  React.useEffect(() => {
    if (!projectId) { projectLoadedRef.current = true; return; }
    fetch('/api/projects/' + projectId, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('load failed'); return r.json(); })
      .then(d => {
        const c = withWorkflowDefaults(d.project.canvas || {});
        if (c.pages && c.pages.length) {
          setPages(c.pages); setActivePageId(c.activePageId || c.pages[0].id);
        } else {
          // Fresh project — start from a clean page (changing pages also triggers the first save)
          setPages([{ id: 'page_1', name: 'Page 1', route: '/', nodes: [], connections: [], vars: [] }]);
          setActivePageId('page_1');
        }
        setWorkflows(c.workflows || []); setVariables(c.variables || []);
        setCustomComponents(c.customComponents || []);
        setCustomShaders(c.customShaders || []);
        setEnabledLibrary(c.enabledLibrary || []);
        setAssets(c.assets || []);   // the save sends assets; without this they're dropped on every open (scaffold + uploads lost → forced re-init)
        setActiveWorkflowId((c.workflows || [])[0]?.id || null);
        setSelectedIds([]);
        setProjectName(d.project.name || '');
        document.title = (d.project.name || 'Project') + ' — Lattice';
      })
      .catch(() => {})
      // setPages(realData) already ran in .then above, so dropping the loader here reveals the real
      // project directly — the stale localStorage seed is never shown.
      .finally(() => { projectLoadedRef.current = true; setLoading(false); });
  }, [projectId]);

  // Load this account's installed library (assets/plugins). Shared across projects; enabled per project.
  React.useEffect(() => {
    fetch('/api/library', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(d => setLibraryItems(d.items || []))
      .catch(() => {});
  }, []);

  // Debounced save of the canvas to the API
  React.useEffect(() => {
    if (!projectId || !projectLoadedRef.current) return;
    setSaving(true);
    const t = setTimeout(() => {
      fetch('/api/projects/' + projectId, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas: { pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary, assets } }),
      }).catch(() => {}).finally(() => setSaving(false));
    }, 800);
    return () => clearTimeout(t);
  }, [projectId, pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary, assets]);

  const fireToast = (t) => {
    setToast(t);
    clearTimeout(window.__lt);
    window.__lt = setTimeout(() => setToast(null), 3200);
  };

  const runWorkflowRef = React.useRef(null); // set below; used by the preview dispatcher

  // Preview-mode action dispatcher (interactive prototype: navigate, url, dialog, toast, submit).
  const onPreviewAction = React.useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case 'navigate': if (action.to) setActivePageId(action.to); break;
      case 'url': if (action.to) window.open(action.to, '_blank', 'noopener'); break;
      case 'toast': fireToast({ tone: 'neutral', title: action.message || 'Action' }); break;
      case 'submit': fireToast({ tone: 'success', title: 'Submitted' }); break;
      case 'runWorkflow': if (action.workflowId && runWorkflowRef.current) runWorkflowRef.current(action.workflowId); break;
      case 'dialog': {
        const t = nodesRef.current.find(n => n.id === action.target);
        setPreviewDialog({ title: t ? t.name : 'Dialog', message: t ? (t.label || '') : '' });
        break;
      }
      case 'closeDialog': setPreviewDialog(null); break;
      default: break;
    }
  }, []); // eslint-disable-line

  // --- Workflow tab: setters ---
  const changeWorkflow = React.useCallback((id, patch) =>
    setWorkflows(ws => ws.map(w => w.id === id ? { ...w, ...patch } : w)), []);
  const addWorkflow = React.useCallback(() => {
    const id = uid('wf');
    const n = workflowsRef.current.length + 1;
    const wf = { id, name: 'Workflow ' + n, nodes: [{ id: uid('wn'), type: 'trigger', x: 80, y: 120 }], edges: [] };
    setWorkflows(ws => [...ws, wf]); setActiveWorkflowId(id);
  }, []);
  const renameWorkflow = React.useCallback((id, name) => setWorkflows(ws => ws.map(w => w.id === id ? { ...w, name } : w)), []);
  const deleteWorkflow = React.useCallback((id) => {
    setWorkflows(ws => ws.filter(w => w.id !== id));
    setActiveWorkflowId(cur => cur === id ? (workflowsRef.current.find(w => w.id !== id)?.id || null) : cur);
  }, []);
  // Page-local variables live on the active page object.
  const changePageVars = React.useCallback((next) =>
    setPages(ps => ps.map(p => p.id === activePageIdRef.current ? { ...p, vars: next } : p)), []);

  // Merged variable list (global + a page's locals) — used by the engine for id↔name lookup.
  const mergedVarsFor = (pageId) => {
    const pg = pagesRef.current.find(p => p.id === pageId);
    return [...variablesRef.current, ...((pg && pg.vars) || [])];
  };
  // Build the name→value scope from initials, overridden by whatever's live in the runtime store.
  const buildScope = () => {
    const rv = runtimeVarsRef.current;
    const scope = {};
    mergedVarsFor(activePageIdRef.current).forEach(v => {
      scope[v.name] = rv[v.id] !== undefined ? rv[v.id] : coerceVar(v);
    });
    return scope;
  };

  // Run a named workflow through the shared engine (Preview only), capturing a step-by-step run log.
  const runWorkflow = React.useCallback(async (workflowId) => {
    const wf = workflowsRef.current.find(w => w.id === workflowId);
    if (!wf) return;
    const runId = uid('run');
    const steps = [];
    setRunLog(rs => [{ id: runId, name: wf.name, at: Date.now(), steps: [], result: 'running' }, ...rs].slice(0, 25));
    const pushStep = (s) => { steps.push(s); setRunLog(rs => rs.map(r => r.id === runId ? { ...r, steps: [...steps] } : r)); };
    let result = 'done';
    try {
      await window.execWorkflow(wf, {
        variables: mergedVarsFor(activePageIdRef.current),
        scope: buildScope(),
        log: pushStep,
        pageNameFor: (id) => (pagesRef.current.find(p => p.id === id) || {}).name || id,
        onVarChange: (varId, value) => setRuntimeVars(s => ({ ...s, [varId]: value })),
        navigate: (pageId) => setActivePageId(pageId),
        setProp: (nodeId, prop, value) => setRuntimeProps(s => ({ ...s, [nodeId]: { ...s[nodeId], [prop]: value } })),
        toast: (msg) => fireToast({ tone: 'neutral', title: msg }),
        // Animations only run in Preview, where PreviewCanvas has published its controller.
        playAnim: (nodeId, animId) => !!(animCtlRef.current && animCtlRef.current.playAnim(nodeId, animId)),
        playPageAnim: (pageId) => {
          if (pageId && pageId !== activePageIdRef.current) setActivePageId(pageId);
          setSceneReplay(v => v + 1);
        },
        animNameFor: (nodeId, animId) => {
          const n = nodesRef.current.find(x => x.id === nodeId);
          const c = n && (n.customStates || []).find(s => s.id === animId);
          return n && c ? `${n.name} · ${c.name}` : 'playing';
        },
        callApi: async ({ method, url, headers, body }) => {
          try {
            const r = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, method, headers, body }) });
            return await r.json();
          } catch (e) { return { status: 0, ok: false, body: null, error: String(e) }; }
        },
        // Confirm dialog (Confirm node) and persistent key/value (Local storage node), guarded so a
        // locked-down browser can't throw. `workflows` lets a Run-workflow node call a sibling flow.
        confirm: (msg) => { try { return window.confirm(msg); } catch { return false; } },
        storage: {
          get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
          set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
          remove: (k) => { try { localStorage.removeItem(k); } catch {} },
        },
        workflows: workflowsRef.current,
      });
    } catch (e) { result = 'error'; pushStep({ label: 'Error', tone: 'danger', text: String(e) }); }
    setRunLog(rs => rs.map(r => r.id === runId ? { ...r, result } : r));
  }, []); // eslint-disable-line
  runWorkflowRef.current = runWorkflow;

  // Seed / reset the runtime variable store whenever Preview is entered; clear prop overrides too.
  React.useEffect(() => {
    if (!previewMode) { setRuntimeProps({}); return; }
    const seed = {};
    [...variablesRef.current, ...pagesRef.current.flatMap(p => p.vars || [])].forEach(v => { seed[v.id] = coerceVar(v); });
    setRuntimeVars(seed); setRuntimeProps({});
  }, [previewMode]);

  // --- Page-scoped state setters (stable) ---
  const setNodes = React.useCallback((updater) =>
    setPages(ps => ps.map(p => p.id === activePageIdRef.current
      ? { ...p, nodes: typeof updater === 'function' ? updater(p.nodes) : updater } : p)), []);
  const setConnections = React.useCallback((updater) =>
    setPages(ps => ps.map(p => p.id === activePageIdRef.current
      ? { ...p, connections: typeof updater === 'function' ? updater(p.connections) : updater } : p)), []);

  // --- History helpers ---
  const pushHistory = React.useCallback(() => {
    const h = getHist(activePageIdRef.current);
    h.past.push({ nodes: JSON.parse(JSON.stringify(nodesRef.current)), connections: JSON.parse(JSON.stringify(connectionsRef.current)) });
    h.future = [];
    if (h.past.length > 100) h.past.shift();
    bumpHistory();
  }, []);

  // Coalesce rapid Inspector edits into a single undo step: snapshot only when the edited field changes
  // or the pointer/keyboard goes idle past the window — so dragging a slider or typing a word is one undo,
  // while each distinct field is its own step. Node-based edits only (matches the nodes+connections snapshot).
  const editHistRef = React.useRef({ t: 0, key: '' });
  const coalesceHistory = React.useCallback((key) => {
    const now = Date.now();
    const last = editHistRef.current;
    if (key !== last.key || now - last.t > 600) pushHistory();
    editHistRef.current = { t: now, key };
  }, [pushHistory]);
  // Force the next edit to open a fresh undo step (e.g. after a selection change), so unrelated edits
  // never merge just because they happened close together.
  const breakEditHistory = React.useCallback(() => { editHistRef.current = { t: 0, key: '' }; }, []);

  const applySnapshot = React.useCallback((snap) =>
    setPages(ps => ps.map(p => p.id === activePageIdRef.current
      ? { ...p, nodes: snap.nodes, connections: snap.connections } : p)), []);

  const undo = React.useCallback(() => {
    const h = getHist(activePageIdRef.current);
    if (!h.past.length) return;
    const prev = h.past.pop();
    h.future.push({ nodes: JSON.parse(JSON.stringify(nodesRef.current)), connections: JSON.parse(JSON.stringify(connectionsRef.current)) });
    bumpHistory();
    applySnapshot(prev);
  }, [applySnapshot]);

  const redo = React.useCallback(() => {
    const h = getHist(activePageIdRef.current);
    if (!h.future.length) return;
    const next = h.future.pop();
    h.past.push({ nodes: JSON.parse(JSON.stringify(nodesRef.current)), connections: JSON.parse(JSON.stringify(connectionsRef.current)) });
    bumpHistory();
    applySnapshot(next);
  }, [applySnapshot]);

  // Device-aware geometry write: desktop (default screen-type) → base props; tablet/mobile and every
  // non-default desktop screen-type → node.bp[key] override.
  // A non-responsive node ignores the device and always writes its shared base (identical everywhere).
  const writeGeom = React.useCallback((id, patch) => {
    setNodes(ns => ns.map(n => {
      if (n.id !== id) return n;
      const dev = n.responsive === false ? 'desktop' : geomDeviceRef.current;
      if (dev === 'desktop') return { ...n, ...patch };
      const cur = (n.bp && n.bp[dev]) || { x: n.x, y: n.y, w: n.w, h: n.h, hidden: !!n.hidden };
      return { ...n, bp: { ...n.bp, [dev]: { ...cur, ...patch } } };
    }));
  }, [setNodes]);

  // --- Node mutators (history-free; drag/typing commit their own history) ---
  // Geometry/visibility keys route to the active device; everything else edits the shared base.
  const updateNode = React.useCallback((id, patch) => {
    const geom = {}, base = {};
    for (const k in patch) (GEOM_KEYS.includes(k) ? geom : base)[k] = patch[k];
    if (Object.keys(base).length) setNodes(ns => ns.map(n => n.id === id ? { ...n, ...base } : n));
    if (Object.keys(geom).length) writeGeom(id, geom);
  }, [setNodes, writeGeom]);

  const renameNode = React.useCallback((id, name) =>
    setNodes(ns => ns.map(n => n.id === id ? { ...n, name } : n)), [setNodes]);

  // Inspector write router: when a non-default interaction state is being edited, visual edits to the
  // selected node land in node.states[editingState]; geometry keys and everything else fall through
  // to the normal updateNode path.
  const editNode = React.useCallback((id, patch) => {
    if (editingStateRef.current === 'default' || id !== selectedIdsRef.current[0]) return updateNode(id, patch);
    const geom = {}, ov = {};
    for (const k in patch) (GEOM_KEYS.includes(k) ? geom : ov)[k] = patch[k];
    if (Object.keys(geom).length) updateNode(id, geom);
    if (Object.keys(ov).length) {
      const st = editingStateRef.current;
      setNodes(ns => ns.map(n => n.id === id ? { ...n, states: { ...n.states, [st]: { ...(n.states && n.states[st]), ...ov } } } : n));
    }
  }, [updateNode, setNodes]);

  // Inspector edit entry points that record a (coalesced) undo step before mutating. These wrap the
  // history-free mutators so property-panel changes — colours, sizes, toggles, typography, renames —
  // are undoable, keyed per node+field so a burst of tweaks to one field collapses to a single step.
  const inspChange = React.useCallback((id, patch) => {
    coalesceHistory('e:' + id + ':' + Object.keys(patch).sort().join(','));
    return editNode(id, patch);
  }, [coalesceHistory, editNode]);
  const inspBaseChange = React.useCallback((id, patch) => {
    coalesceHistory('b:' + id + ':' + Object.keys(patch).sort().join(','));
    return updateNode(id, patch);
  }, [coalesceHistory, updateNode]);
  const inspRename = React.useCallback((id, name) => {
    coalesceHistory('r:' + id);
    return renameNode(id, name);
  }, [coalesceHistory, renameNode]);
  // While a component timeline is open, Inspector visual edits scope to that animation state's own
  // override layer (node.states[stateId]) — the resting pose its tracks animate over — instead of the
  // shared base, so they never leak into Default or other states. Geometry still writes through to the
  // active device layer. Mirrors editNode, but targets the open anim tab's node + state.
  const inspAnimStateChange = React.useCallback((id, patch) => {
    const t = activeAnimRef.current;
    if (!t || id !== t.nodeId) return inspBaseChange(id, patch);
    coalesceHistory('a:' + t.stateId + ':' + id + ':' + Object.keys(patch).sort().join(','));
    const geom = {}, ov = {};
    for (const k in patch) (GEOM_KEYS.includes(k) ? geom : ov)[k] = patch[k];
    if (Object.keys(geom).length) updateNode(id, geom);
    if (Object.keys(ov).length) {
      const st = t.stateId;
      setNodes(ns => ns.map(n => n.id === id ? { ...n, states: { ...n.states, [st]: { ...(n.states && n.states[st]), ...ov } } } : n));
    }
  }, [inspBaseChange, coalesceHistory, updateNode, setNodes]);

  const resetState = React.useCallback((id, st) =>
    setNodes(ns => ns.map(n => {
      if (n.id !== id || !n.states) return n;
      const rest = { ...n.states }; delete rest[st];
      return { ...n, states: rest };
    })), [setNodes]);

  // Enable/disable a state (built-in or custom). Always writes the `off` flag into node.states[stateKey]
  // — never the node base — so it works identically whether or not the timeline editor is open, and only
  // toggles availability (it never touches customStates, so a disabled custom state is never lost).
  const setStateEnabled = React.useCallback((id, stateKey, on) =>
    setNodes(ns => ns.map(n => n.id === id
      ? { ...n, states: { ...n.states, [stateKey]: { ...(n.states && n.states[stateKey]), off: !on } } }
      : n)), [setNodes]);

  // Drop any open animation tabs whose node/state/page no longer exists (and deactivate if the active one goes).
  const pruneAnimTabs = React.useCallback((keep) => {
    const cur = openAnimTabsRef.current;
    const next = cur.filter(keep);
    if (next.length !== cur.length) { setOpenAnimTabs(next); setActiveAnimId(a => (next.some(t => t.id === a) ? a : null)); }
  }, []);

  // --- Custom interaction states (named, static or keyframe-animation) ---
  const addCustomState = React.useCallback(() => {
    const id = uid('st');
    setNodes(ns => ns.map(n => {
      if (n.id !== selectedIdsRef.current[0]) return n;
      const list = n.customStates || [];
      return { ...n, customStates: [...list, { id, name: 'State ' + (list.length + 1), type: 'static', loop: false, frames: [] }] };
    }));
    setEditingState(id); setEditingFrame(null);
  }, [setNodes]);
  const updateCustomState = React.useCallback((id, patch) =>
    setNodes(ns => ns.map(n => n.id === selectedIdsRef.current[0]
      ? { ...n, customStates: (n.customStates || []).map(c => c.id === id ? { ...c, ...patch } : c) } : n)), [setNodes]);
  const deleteCustomState = React.useCallback((id) => {
    setNodes(ns => ns.map(n => {
      if (n.id !== selectedIdsRef.current[0]) return n;
      const states = { ...n.states }; delete states[id];
      return { ...n, states, customStates: (n.customStates || []).filter(c => c.id !== id) };
    }));
    setEditingState('default'); setEditingFrame(null);
    pruneAnimTabs(t => t.stateId !== id);
  }, [setNodes, pruneAnimTabs]);
  const editFrames = (id, fn) => setNodes(ns => ns.map(n => n.id === selectedIdsRef.current[0]
    ? { ...n, customStates: (n.customStates || []).map(c => c.id === id ? { ...c, frames: fn(c.frames || []) } : c) } : n));
  const addFrame = React.useCallback((id) => {
    const n = nodesRef.current.find(x => x.id === selectedIdsRef.current[0]);
    const pose = (window.capturePose && window.mergeState) ? window.capturePose(window.mergeState(n, id)) : {};
    editFrames(id, fr => [...fr, { id: uid('fr'), dur: 400, ov: pose }]);
  }, [setNodes]); // eslint-disable-line
  const updateFrame = React.useCallback((id, i, patch) => editFrames(id, fr => fr.map((f, j) => j === i ? { ...f, ...patch } : f)), [setNodes]); // eslint-disable-line
  const deleteFrame = React.useCallback((id, i) => { setEditingFrame(null); editFrames(id, fr => fr.filter((_, j) => j !== i)); }, [setNodes]); // eslint-disable-line

  // --- Animation editor tab: open/close + node-targeted writers (target the tab's node, not the selection) ---
  const framesOf = (nodeId, stateId, fn) => setNodes(ns => ns.map(n => n.id === nodeId
    ? { ...n, customStates: (n.customStates || []).map(c => c.id === stateId ? { ...c, frames: fn(c.frames || []) } : c) } : n));
  const openAnimEditor = React.useCallback((stateId) => {
    const nodeId = selectedIdsRef.current[0];
    if (!nodeId || !stateId) return;
    const pageId = activePageIdRef.current;
    // The timeline opens empty (no tracks) — the user adds property tracks + keyframes themselves.
    const existing = openAnimTabsRef.current.find(t => t.nodeId === nodeId && t.stateId === stateId && t.pageId === pageId);
    if (existing) setActiveAnimId(existing.id);
    else { const id = uid('anim'); setOpenAnimTabs(ts => [...ts, { id, pageId, nodeId, stateId }]); setActiveAnimId(id); }
    // Land on component scope even if the scene timeline was the last thing open.
    setSceneOpen(false); setAnimFrameIdx(0); setView('design');
  }, []);
  const closeAnimTab = React.useCallback((id) => {
    setOpenAnimTabs(ts => ts.filter(t => t.id !== id));
    setActiveAnimId(cur => (cur === id ? null : cur));
  }, []);
  const selectAnimTab = React.useCallback((id) => {
    const t = openAnimTabsRef.current.find(x => x.id === id);
    if (!t) return;
    setActiveAnimId(id); setSceneOpen(false); setAnimFrameIdx(0); setView('design');
    if (t.pageId !== activePageIdRef.current) setActivePageId(t.pageId);
    setSelectedIds([t.nodeId]);
  }, []);

  // The timeline editor's Component|Page scope switch. 'page' opens this page's scene timeline.
  // 'component' returns to an already-open anim tab on this page, else opens one for the selected
  // node's first animation state. `canComponentTimeline` below mirrors whether a target exists.
  const componentAnimTarget = () => {
    const tab = openAnimTabsRef.current.find(t => t.pageId === activePageIdRef.current);
    if (tab) return { tabId: tab.id };
    const n = nodesRef.current.find(x => x.id === selectedIdsRef.current[0]);
    const st = n && (n.customStates || []).find(c => (c.type || 'static') === 'anim');
    return st ? { stateId: st.id } : null;
  };
  const setTimelineMode = React.useCallback((m) => {
    if (m === 'page') { setActiveAnimId(null); setSceneOpen(true); setView('design'); return; }
    const t = componentAnimTarget(); if (!t) return;
    if (t.tabId) selectAnimTab(t.tabId); else openAnimEditor(t.stateId);
  }, [selectAnimTab, openAnimEditor]); // eslint-disable-line

  // --- Interaction-state bindings: one-click presets + assigning animations to built-in triggers ---
  // Apply a default preset to a trigger — either a static override or a freshly-bound animation.
  const applyPreset = React.useCallback((trigger) => {
    const nodeId = selectedIdsRef.current[0]; if (!nodeId) return;
    const n = nodesRef.current.find(x => x.id === nodeId); if (!n) return;
    const desc = window.applyStatePreset && window.applyStatePreset(n, trigger);
    if (!desc) return;
    if (desc.kind === 'static') {
      setNodes(ns => ns.map(x => x.id === nodeId
        ? { ...x, states: { ...x.states, [trigger]: { off: false, ...desc.states } } } : x));
    } else {
      const id = uid('st');
      setNodes(ns => ns.map(x => x.id === nodeId
        ? { ...x, customStates: [...(x.customStates || []), { id, ...desc.state }],
            states: { ...x.states, [trigger]: { ...(x.states && x.states[trigger]), off: false, animId: id, preset: desc.preset } } } : x));
    }
  }, [setNodes]);

  // Bind/unbind an animation to a built-in trigger. value: '' → static · '__use' → enter animation
  // mode (reuse newest or create) · '__new' → create + open editor · <id> → assign that animation.
  const bindAnim = React.useCallback((trigger, value) => {
    const nodeId = selectedIdsRef.current[0]; if (!nodeId) return;
    const n = nodesRef.current.find(x => x.id === nodeId); if (!n) return;
    const anims = (n.customStates || []).filter(c => (c.type || 'static') === 'anim');
    const setBinding = (animId) => setNodes(ns => ns.map(x => x.id === nodeId
      ? { ...x, states: { ...x.states, [trigger]: { ...(x.states && x.states[trigger]), off: false, animId } } } : x));
    if (value === '') { setBinding(''); return; }
    if (value === '__use') {
      const cur = n.states && n.states[trigger] && n.states[trigger].animId;
      if (cur) return;                           // already in animation mode
      if (anims.length) { setBinding(anims[anims.length - 1].id); return; }
      value = '__new';                           // no animation yet → create one
    }
    if (value === '__new') {
      const id = uid('st');
      const name = 'Animation ' + ((n.customStates || []).length + 1);
      setNodes(ns => ns.map(x => x.id === nodeId
        ? { ...x, customStates: [...(x.customStates || []), { id, name, type: 'anim', loop: false, duration: 400, tracks: [], frames: [] }],
            states: { ...x.states, [trigger]: { ...(x.states && x.states[trigger]), off: false, animId: id } } } : x));
      setTimeout(() => openAnimEditor(id), 0);
      return;
    }
    setBinding(value);                           // assign an existing animation by id
  }, [setNodes, openAnimEditor]);

  const animAddFrame = React.useCallback(() => {
    const t = activeAnimRef.current; if (!t) return;
    const n = nodesRef.current.find(x => x.id === t.nodeId);
    const cs = n && (n.customStates || []).find(c => c.id === t.stateId);
    const frames = (cs && cs.frames) || [];
    const last = frames[frames.length - 1];
    const ov = last ? { ...last.ov } : ((window.capturePose && window.mergeState) ? window.capturePose(window.mergeState(n, t.stateId)) : {});
    framesOf(t.nodeId, t.stateId, fr => [...fr, { id: uid('fr'), dur: 400, ov }]);
    setAnimFrameIdx(frames.length);
  }, []);
  const animUpdateFrame = React.useCallback((i, patch) => {
    const t = activeAnimRef.current; if (!t) return;
    framesOf(t.nodeId, t.stateId, fr => fr.map((f, j) => j === i ? { ...f, ...patch } : f));
  }, []);
  const animDeleteFrame = React.useCallback((i) => {
    const t = activeAnimRef.current; if (!t) return;
    framesOf(t.nodeId, t.stateId, fr => fr.filter((_, j) => j !== i));
    setAnimFrameIdx(idx => (idx > i ? idx - 1 : idx === i ? Math.max(0, i - 1) : idx));
  }, []);
  const animUpdateState = React.useCallback((patch) => {
    const t = activeAnimRef.current; if (!t) return;
    setNodes(ns => ns.map(n => n.id === t.nodeId
      ? { ...n, customStates: (n.customStates || []).map(c => c.id === t.stateId ? { ...c, ...patch } : c) } : n));
  }, [setNodes]);
  // Reorder the playback sequence (independent of where cards sit on the board).
  const animReorderFrame = React.useCallback((i, dir) => {
    const t = activeAnimRef.current; if (!t) return;
    const j = i + dir;
    const n = nodesRef.current.find(x => x.id === t.nodeId);
    const cs = n && (n.customStates || []).find(c => c.id === t.stateId);
    if (!cs || j < 0 || j >= (cs.frames || []).length) return;
    framesOf(t.nodeId, t.stateId, fr => { const next = fr.slice(); const [m] = next.splice(i, 1); next.splice(j, 0, m); return next; });
    setAnimFrameIdx(idx => (idx === i ? j : idx === j ? i : idx));
  }, []);
  // Drop saved board positions so the cards re-flow into the tidy auto-row.
  // NOTE: no object-rest destructuring here — Babel hoists a `const _excluded` helper to the top of
  // each text/babel script, and those all share one global scope (PreviewCanvas.jsx already emits one).
  const animTidyUp = React.useCallback(() => {
    const t = activeAnimRef.current; if (!t) return;
    framesOf(t.nodeId, t.stateId, fr => fr.map(f => { const c = { ...f }; delete c.bx; delete c.by; return c; }));
  }, []);
  // Inspector write path while a keyframe is being edited: merge the patch into that frame's captured pose.
  const editFrameOv = React.useCallback((patch) => {
    const t = activeAnimRef.current; if (!t) return;
    const i = animFrameIdxRef.current;
    framesOf(t.nodeId, t.stateId, fr => fr.map((f, j) => j === i ? { ...f, ov: { ...f.ov, ...patch } } : f));
  }, []);

  // --- Timeline (dope-sheet) editing: mutate the active anim tab's per-property tracks ------------
  // Every edit runs the active state's tracks through `fn`; legacy card `frames` migrate to tracks on
  // first touch (then are cleared so the old auto-play path yields to the timeline).
  const mutTracks = (fn) => {
    const t = activeAnimRef.current; if (!t) return;
    setNodes(ns => ns.map(n => n.id !== t.nodeId ? n : {
      ...n, customStates: (n.customStates || []).map(c => {
        if (c.id !== t.stateId) return c;
        const base = window.ensureTracks ? window.ensureTracks(c) : c;
        const tracks = fn((base.tracks || []).map(tr => ({ ...tr, keys: (tr.keys || []).slice() })));
        return { ...base, tracks, frames: [] };
      }),
    }));
  };
  const animAddTrack = React.useCallback((prop, nodeId, value) => mutTracks(trs => {
    if (trs.some(tr => tr.prop === prop && (!nodeId || tr.nodeId === nodeId))) return trs; // no duplicate track
    return [...trs, Object.assign({ prop, keys: [{ t: 0, value, ease: 'ease-out' }] }, nodeId ? { nodeId } : null)];
  }), [setNodes]);
  const animDeleteTrack = React.useCallback((ti) => mutTracks(trs => trs.filter((_, i) => i !== ti)), [setNodes]);
  // Add a key (replacing any at the exact same time). Storage order is not sorted — the sampler sorts.
  const animAddKey = React.useCallback((ti, t, value) => mutTracks(trs => trs.map((tr, i) => i === ti
    ? { ...tr, keys: [...tr.keys.filter(k => k.t !== t), { t, value, ease: 'ease-out' }] } : tr)), [setNodes]);
  const animUpdateKey = React.useCallback((ti, ki, patch) => mutTracks(trs => trs.map((tr, i) => i === ti
    ? { ...tr, keys: tr.keys.map((k, j) => j === ki ? { ...k, ...patch } : k) } : tr)), [setNodes]);
  const animDeleteKey = React.useCallback((ti, ki) => mutTracks(trs => trs.map((tr, i) => i === ti
    ? { ...tr, keys: tr.keys.filter((_, j) => j !== ki) } : tr).filter(tr => (tr.keys || []).length)), [setNodes]);
  // One undo checkpoint for direct timeline gestures (dragging a keyframe, scrubbing a key value) that
  // stream through animUpdateKey without recording history. The timeline calls this ONCE at the start of
  // the gesture, before the first mutation, so pushHistory snapshots the pre-gesture pose → undo works.
  const animKeyCheckpoint = React.useCallback(() => pushHistory(), [pushHistory]);
  // Coalesced variant for streamed key edits (e.g. scrubbing several keyframes' time at once): repeated
  // calls with the same key inside the idle window collapse into a single undo step.
  const animKeyCoalesce = React.useCallback((key) => coalesceHistory(key), [coalesceHistory]);
  // Batch key ops for multi-select (marquee delete, copy/cut/paste/duplicate). Every {ti,ki}/{ti,t,…}
  // in the list is resolved against the SAME pre-mutation track indices in one pass, so nothing shifts
  // mid-batch. Coalesced into one undo step (component keyframes live on customStates, in the snapshot).
  const animAddKeys = React.useCallback((adds) => {
    if (!adds || !adds.length) return;
    coalesceHistory('kf');
    const byT = {}; adds.forEach(a => (byT[a.ti] = byT[a.ti] || []).push(a));
    mutTracks(trs => trs.map((tr, i) => byT[i]
      ? { ...tr, keys: [...tr.keys.filter(k => !byT[i].some(a => a.t === k.t)), ...byT[i].map(a => ({ t: a.t, value: a.value, ease: a.ease || 'ease-out' }))] }
      : tr));
  }, [coalesceHistory, setNodes]); // eslint-disable-line
  const animDeleteKeys = React.useCallback((dels) => {
    if (!dels || !dels.length) return;
    coalesceHistory('kf');
    const byT = {}; dels.forEach(d => (byT[d.ti] = byT[d.ti] || new Set()).add(d.ki));
    mutTracks(trs => trs.map((tr, i) => byT[i] ? { ...tr, keys: tr.keys.filter((_, j) => !byT[i].has(j)) } : tr).filter(tr => (tr.keys || []).length));
  }, [coalesceHistory, setNodes]); // eslint-disable-line
  const animSetDuration = React.useCallback((ms) => { const t = activeAnimRef.current; if (!t) return; setNodes(ns => ns.map(n => n.id === t.nodeId ? { ...n, customStates: (n.customStates || []).map(c => c.id === t.stateId ? { ...c, duration: ms } : c) } : n)); }, [setNodes]);
  const animSetLoopState = React.useCallback((on) => { const t = activeAnimRef.current; if (!t) return; setNodes(ns => ns.map(n => n.id === t.nodeId ? { ...n, customStates: (n.customStates || []).map(c => c.id === t.stateId ? { ...c, loop: on } : c) } : n)); }, [setNodes]);
  const animSetLoopWrap = React.useCallback((on) => { const t = activeAnimRef.current; if (!t) return; setNodes(ns => ns.map(n => n.id === t.nodeId ? { ...n, customStates: (n.customStates || []).map(c => c.id === t.stateId ? { ...c, loopWrap: on } : c) } : n)); }, [setNodes]);
  // Loop presets (AnimPresets.jsx): the timeline authors a motion onto ONE selected track, then hands
  // back the finished keyframes here. We replace that track's keys and apply the loop settings the
  // dialog chose (duration + loop). Snapshotted as a single undo step.
  const animApplyPresetToTrack = React.useCallback((ti, keys, opts) => {
    const t = activeAnimRef.current; if (!t || !Array.isArray(keys)) return;
    pushHistory();
    setNodes(ns => ns.map(n => {
      if (n.id !== t.nodeId) return n;
      return { ...n, customStates: (n.customStates || []).map(c => {
        if (c.id !== t.stateId) return c;
        const base = window.ensureTracks ? window.ensureTracks(c) : c;
        const tracks = (base.tracks || []).map((tr, i) => i === ti ? { ...tr, keys } : tr);
        const patch = {};
        if (opts && opts.duration) patch.duration = Math.max(50, Math.round(opts.duration));
        if (opts && opts.loop != null) patch.loop = opts.loop;
        if (opts && opts.loopWrap != null) patch.loopWrap = opts.loopWrap;
        return { ...base, tracks, frames: [], ...patch };
      }) };
    }));
  }, [setNodes, pushHistory]);

  // --- Page scene timeline: a whole-screen animation whose tracks each target one node's property. --
  // SCENE_DEFAULT is module-scoped (above buildAgentPages) so the agent executor and this editor can
  // never drift apart on what an un-configured timeline is.
  const mutTimeline = (fn) => setPages(ps => ps.map(p => p.id === activePageIdRef.current
    ? { ...p, timeline: fn({ ...SCENE_DEFAULT, ...(p.timeline || {}) }) } : p));
  const sceneAddTrack = (prop, nodeId, value) => mutTimeline(tl => (tl.tracks.some(tr => tr.nodeId === nodeId && tr.prop === prop) ? tl : { ...tl, tracks: [...tl.tracks, { nodeId, prop, keys: [{ t: 0, value, ease: 'ease-out' }] }] }));
  const sceneDeleteTrack = (ti) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.filter((_, i) => i !== ti) }));
  const sceneAddKey = (ti, t, value) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: [...tr.keys.filter(k => k.t !== t), { t, value, ease: 'ease-out' }] } : tr) }));
  const sceneUpdateKey = (ti, ki, patch) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: tr.keys.map((k, j) => j === ki ? { ...k, ...patch } : k) } : tr) }));
  const sceneDeleteKey = (ti, ki) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: tr.keys.filter((_, j) => j !== ki) } : tr).filter(tr => (tr.keys || []).length) }));
  // Batch variants for multi-select (see animAddKeys/animDeleteKeys). Scene keyframes stay outside undo.
  const sceneAddKeys = (adds) => {
    if (!adds || !adds.length) return;
    const byT = {}; adds.forEach(a => (byT[a.ti] = byT[a.ti] || []).push(a));
    mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => byT[i]
      ? { ...tr, keys: [...tr.keys.filter(k => !byT[i].some(a => a.t === k.t)), ...byT[i].map(a => ({ t: a.t, value: a.value, ease: a.ease || 'ease-out' }))] }
      : tr) }));
  };
  const sceneDeleteKeys = (dels) => {
    if (!dels || !dels.length) return;
    const byT = {}; dels.forEach(d => (byT[d.ti] = byT[d.ti] || new Set()).add(d.ki));
    mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => byT[i] ? { ...tr, keys: tr.keys.filter((_, j) => !byT[i].has(j)) } : tr).filter(tr => (tr.keys || []).length) }));
  };
  const sceneSetDuration = (ms) => mutTimeline(tl => ({ ...tl, duration: ms }));
  const sceneSetLoop = (on) => mutTimeline(tl => ({ ...tl, loop: on }));
  const sceneSetLoopWrap = (on) => mutTimeline(tl => ({ ...tl, loopWrap: on }));
  const openSceneTimeline = () => { setSceneOpen(s => !s); setActiveAnimId(null); setView('design'); };

  // --- Inspector ⇄ timeline bridge -----------------------------------------------------------------
  // From an Inspector field's key button: record `value` for `prop` as a keyframe at the live playhead.
  // Creates the track if the property isn't animated yet. Routes to the active component-animation tab,
  // or to the page scene timeline (keyed against the selected node), whichever is open.
  const keyframeProp = (prop, value) => {
    const t = Math.max(0, Math.round(timelinePlayheadRef.current || 0));
    const upsert = (keys) => [...keys.filter(k => k.t !== t), { t, value, ease: 'ease-out' }];
    if (animValid) {
      // Component keyframes live on the node's customStates → captured by the undo snapshot. Coalesce so
      // a "KEY ALL" burst (many props in one tick) is a single undo. (Scene keyframes live on the page
      // timeline, which the snapshot doesn't carry, so those stay outside undo — as the rest of the
      // scene dope-sheet already is.)
      coalesceHistory('kf');
      mutTracks(trs => {
        const ti = trs.findIndex(tr => tr.prop === prop);
        return ti < 0 ? [...trs, { prop, keys: [{ t, value, ease: 'ease-out' }] }]
                      : trs.map((tr, i) => i === ti ? { ...tr, keys: upsert(tr.keys) } : tr);
      });
    } else if (showScene && selectedId) {
      mutTimeline(tl => {
        const ti = tl.tracks.findIndex(tr => tr.prop === prop && tr.nodeId === selectedId);
        return ti < 0 ? { ...tl, tracks: [...tl.tracks, { nodeId: selectedId, prop, keys: [{ t, value, ease: 'ease-out' }] }] }
                      : { ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: upsert(tr.keys) } : tr) };
      });
    }
  };
  // Is a timeline open (so key buttons show), and which props are already animated for the shown node?
  const animActive = animValid || showScene;
  const animTrackedProps = animValid
    ? ((animState && animState.tracks) || []).map(tr => tr.prop)
    : (showScene ? (((page && page.timeline) || {}).tracks || []).filter(tr => tr.nodeId === selectedId).map(tr => tr.prop) : []);

  // Canvas signals move/resize start → capture the RAW pre-drag state (base + bp) for undo.
  const onInteractStart = React.useCallback(() => {
    dragUndoRef.current = { nodes: JSON.parse(JSON.stringify(nodesRef.current)), connections: JSON.parse(JSON.stringify(connectionsRef.current)) };
  }, []);
  const commitDrag = React.useCallback(() => {
    const snap = dragUndoRef.current;
    if (!snap) return;
    dragUndoRef.current = null;
    const h = getHist(activePageIdRef.current);
    h.past.push(snap);
    h.future = [];
    if (h.past.length > 100) h.past.shift();
    bumpHistory();
  }, []);

  const setParent = React.useCallback((childId, parentId) => {
    if (parentId && (childId === parentId || descendantsOf(childId, connectionsRef.current).has(parentId))) {
      fireToast({ tone: 'warning', title: 'Cannot nest', message: 'That would create a loop.' });
      return;
    }
    pushHistory();
    setConnections(cs => {
      const filtered = cs.filter(c => !(c.to === childId && c.kind === 'child'));
      return parentId ? [...filtered, { from: parentId, to: childId, kind: 'child' }] : filtered;
    });
  }, [pushHistory, setConnections]);

  const detachNode = React.useCallback((id) => {
    if (!connectionsRef.current.some(c => c.to === id && c.kind === 'child')) return;
    pushHistory();
    setConnections(cs => cs.filter(c => !(c.to === id && c.kind === 'child')));
    fireToast({ tone: 'neutral', title: 'Detached from parent' });
  }, [pushHistory, setConnections]);

  const addConnection = React.useCallback((from, to, kind = 'child') => {
    if (from === to) return;
    if (kind === 'child' && descendantsOf(to, connectionsRef.current).has(from)) {
      fireToast({ tone: 'warning', title: 'Cannot connect', message: 'That would create a loop.' });
      return;
    }
    pushHistory();
    setConnections(cs => {
      let base = cs.filter(c => !(c.from === from && c.to === to && c.kind === kind));
      if (kind === 'child') base = base.filter(c => !(c.to === to && c.kind === 'child'));
      return [...base, { from, to, kind }];
    });
    fireToast({ tone: 'success', title: 'Connected', message: kind });
  }, [pushHistory, setConnections]);

  const selectOne = React.useCallback((id) => { breakEditHistory(); setSelectedIds(id ? [id] : []); setEditingState('default'); setEditingFrame(null); setActiveAnimId(null); }, [breakEditHistory]);
  const selectMany = React.useCallback((ids) => { breakEditHistory(); setSelectedIds(ids); setEditingState('default'); setEditingFrame(null); setActiveAnimId(null); }, [breakEditHistory]);
  const setEditingStateReset = React.useCallback((s) => { setEditingState(s); setEditingFrame(null); }, []);

  const deleteNode = React.useCallback((id) => {
    pushHistory();
    // Drop the node, and clear any dangling maskId that pointed at it (a deleted mask un-clips its layers).
    setNodes(ns => ns.filter(n => n.id !== id).map(n => { if (n.maskId !== id) return n; const rest = { ...n }; delete rest.maskId; return rest; }));
    setConnections(cs => cs.filter(c => c.from !== id && c.to !== id));
    setSelectedIds(ids => ids.filter(i => i !== id));
    pruneAnimTabs(t => t.nodeId !== id);
  }, [pushHistory, setNodes, setConnections, pruneAnimTabs]);

  const deleteMany = React.useCallback((ids) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    pushHistory();
    setNodes(ns => ns.filter(n => !idSet.has(n.id)).map(n => { if (!n.maskId || !idSet.has(n.maskId)) return n; const rest = { ...n }; delete rest.maskId; return rest; }));
    setConnections(cs => cs.filter(c => !idSet.has(c.from) && !idSet.has(c.to)));
    setSelectedIds([]);
    pruneAnimTabs(t => !idSet.has(t.nodeId));
  }, [pushHistory, setNodes, setConnections, pruneAnimTabs]);

  const duplicateNodes = React.useCallback((ids) => {
    if (!ids || !ids.length) return;
    pushHistory();
    const idMap = {};
    const clones = nodesRef.current.filter(n => ids.includes(n.id))
      .map(n => { const nid = uid(); idMap[n.id] = nid; return { ...n, id: nid, x: n.x + 16, y: n.y + 16, bp: offsetBp(n.bp, 16), synced: false }; });
    setNodes(ns => [...ns, ...clones]);
    setConnections(cs => [...cs, ...cs.filter(c => idMap[c.from] && idMap[c.to]).map(c => ({ ...c, from: idMap[c.from], to: idMap[c.to] }))]);
    setSelectedIds(clones.map(c => c.id));
  }, [pushHistory, setNodes, setConnections]);

  const copySelection = React.useCallback(() => {
    const sel = nodesRef.current.filter(n => selectedIdsRef.current.includes(n.id));
    if (!sel.length) return;
    const idSet = new Set(sel.map(n => n.id));
    const edges = connectionsRef.current.filter(c => idSet.has(c.from) && idSet.has(c.to));
    clipboardRef.current = JSON.parse(JSON.stringify({ nodes: sel, edges }));
    fireToast({ tone: 'neutral', title: sel.length + ' copied' });
  }, []);

  const paste = React.useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip?.nodes?.length) return;
    pushHistory();
    const idMap = {};
    const clones = clip.nodes.map(n => { const nid = uid(); idMap[n.id] = nid; return { ...n, id: nid, x: n.x + 24, y: n.y + 24, bp: offsetBp(n.bp, 24), synced: false }; });
    setNodes(ns => [...ns, ...clones]);
    setConnections(cs => [...cs, ...clip.edges.map(c => ({ ...c, from: idMap[c.from], to: idMap[c.to] }))]);
    setSelectedIds(clones.map(c => c.id));
  }, [pushHistory, setNodes, setConnections]);

  const nudge = React.useCallback((dx, dy) => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    const now = Date.now();
    if (now - lastNudgeRef.current > 600) pushHistory();
    lastNudgeRef.current = now;
    const dev = geomDeviceRef.current;
    ids.forEach(id => {
      const n = nodesRef.current.find(x => x.id === id);
      if (n && !n.locked) { const g = geomAt(n, dev); writeGeom(id, { x: g.x + dx, y: g.y + dy }); }
    });
  }, [pushHistory, writeGeom]);

  const toggleVisibility = React.useCallback((id) => {
    const n = nodesRef.current.find(x => x.id === id);
    if (!n) return;
    pushHistory();
    writeGeom(id, { hidden: !geomAt(n, geomDeviceRef.current).hidden });
  }, [pushHistory, writeGeom]);

  const toggleLock = React.useCallback((id) => {
    pushHistory();
    setNodes(ns => ns.map(n => n.id === id ? { ...n, locked: !n.locked } : n));
  }, [pushHistory, setNodes]);

  const bringToFront = React.useCallback((id) => {
    pushHistory();
    setNodes(ns => { const n = ns.find(x => x.id === id); return n ? [...ns.filter(x => x.id !== id), n] : ns; });
  }, [pushHistory, setNodes]);

  // --- Design-tool batch ops (drive the command palette + context menu) --------------------------
  const selOr = (ids) => (ids && ids.length ? ids : selectedIdsRef.current) || [];

  // Z-order within the nodes array (later = drawn on top). front/back jump to an end; forward/backward
  // shift one slot past the nearest non-selected neighbour (iterating from the far side so a run of
  // selected layers keeps its internal order and never leapfrogs itself).
  const orderSelection = React.useCallback((mode, ids) => {
    const sel = selOr(ids); if (!sel.length) return;
    const set = new Set(sel);
    pushHistory();
    setNodes(ns => {
      if (mode === 'front') return [...ns.filter(n => !set.has(n.id)), ...ns.filter(n => set.has(n.id))];
      if (mode === 'back') return [...ns.filter(n => set.has(n.id)), ...ns.filter(n => !set.has(n.id))];
      const arr = ns.slice();
      if (mode === 'forward') { for (let i = arr.length - 2; i >= 0; i--) if (set.has(arr[i].id) && !set.has(arr[i + 1].id)) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; } }
      else if (mode === 'backward') { for (let i = 1; i < arr.length; i++) if (set.has(arr[i].id) && !set.has(arr[i - 1].id)) { [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; } }
      return arr;
    });
  }, [pushHistory, setNodes]);

  const flipSelection = React.useCallback((axis, ids) => {
    const sel = selOr(ids); if (!sel.length) return;
    const set = new Set(sel), key = axis === 'v' ? 'flipV' : 'flipH';
    pushHistory();
    setNodes(ns => ns.map(n => set.has(n.id) ? { ...n, [key]: !n[key] } : n));
  }, [pushHistory, setNodes]);

  const rotateSelection = React.useCallback((deg, ids) => {
    const sel = selOr(ids); if (!sel.length) return;
    const set = new Set(sel);
    pushHistory();
    setNodes(ns => ns.map(n => set.has(n.id) ? { ...n, rotation: ((((n.rotation || 0) + deg) % 360) + 360) % 360 } : n));
  }, [pushHistory, setNodes]);

  const resetTransformSelection = React.useCallback((ids) => {
    const sel = selOr(ids); if (!sel.length) return;
    const set = new Set(sel);
    pushHistory();
    setNodes(ns => ns.map(n => set.has(n.id) ? { ...n, rotation: 0, scale: 100, skewX: 0, skewY: 0, flipH: false, flipV: false } : n));
    fireToast({ tone: 'neutral', title: 'Transform reset' });
  }, [pushHistory, setNodes]);

  const hideSelection = React.useCallback(() => {
    const sel = selectedIdsRef.current || []; if (!sel.length) return;
    pushHistory();
    const dev = geomDeviceRef.current;
    sel.forEach(id => { const n = nodesRef.current.find(x => x.id === id); if (n && !geomAt(n, dev).hidden) writeGeom(id, { hidden: true }); });
    fireToast({ tone: 'neutral', title: 'Hid ' + sel.length + ' layer' + (sel.length > 1 ? 's' : '') });
  }, [pushHistory, writeGeom]);

  const showAllNodes = React.useCallback(() => {
    pushHistory();
    const dev = geomDeviceRef.current;
    nodesRef.current.forEach(n => { if (geomAt(n, dev).hidden) writeGeom(n.id, { hidden: false }); });
    fireToast({ tone: 'neutral', title: 'All layers shown' });
  }, [pushHistory, writeGeom]);

  const lockSelection = React.useCallback((v) => {
    const sel = selectedIdsRef.current || []; if (!sel.length) return;
    const set = new Set(sel);
    pushHistory();
    setNodes(ns => ns.map(n => set.has(n.id) ? { ...n, locked: v } : n));
    fireToast({ tone: 'neutral', title: v ? 'Locked selection' : 'Unlocked selection' });
  }, [pushHistory, setNodes]);

  const unlockAll = React.useCallback(() => {
    pushHistory();
    setNodes(ns => ns.map(n => n.locked ? { ...n, locked: false } : n));
    fireToast({ tone: 'neutral', title: 'All layers unlocked' });
  }, [pushHistory, setNodes]);

  const isolateSelection = React.useCallback(() => {
    const sel = selectedIdsRef.current || []; if (!sel.length) return;
    const set = new Set(sel);
    pushHistory();
    const dev = geomDeviceRef.current;
    nodesRef.current.forEach(n => { const want = !set.has(n.id); if (!!geomAt(n, dev).hidden !== want) writeGeom(n.id, { hidden: want }); });
    fireToast({ tone: 'neutral', title: 'Isolated selection', message: 'Run “Show all layers” to exit.' });
  }, [pushHistory, writeGeom]);

  const kOf = (n) => (window.kindOf ? window.kindOf(n) : (n && n.kind));
  const selectInverse = React.useCallback(() => {
    const set = new Set(selectedIdsRef.current || []);
    setSelectedIds(nodesRef.current.filter(n => !set.has(n.id)).map(n => n.id));
  }, []);
  const selectSameKind = React.useCallback(() => {
    const sel = selectedIdsRef.current || []; if (!sel.length) return;
    const kinds = new Set(sel.map(id => kOf(nodesRef.current.find(x => x.id === id))));
    setSelectedIds(nodesRef.current.filter(n => kinds.has(kOf(n))).map(n => n.id));
  }, []);
  const FRAME_KINDS = new Set(['frame', 'card', 'stack', 'grid', 'section']);
  const selectAllFrames = React.useCallback(() => {
    const ids = nodesRef.current.filter(n => FRAME_KINDS.has(kOf(n))).map(n => n.id);
    ids.length ? setSelectedIds(ids) : fireToast({ tone: 'warning', title: 'No frames on this page' });
  }, []);
  const selectChildrenOfSelection = React.useCallback(() => {
    const sel = selectedIdsRef.current || []; if (!sel.length) return;
    const kids = connectionsRef.current.filter(c => c.kind === 'child' && sel.includes(c.from)).map(c => c.to);
    kids.length ? setSelectedIds(kids) : fireToast({ tone: 'warning', title: 'No nested layers', message: 'The selection has no children.' });
  }, []);

  const alignNodes = React.useCallback((ids, edge) => {
    if (!ids || ids.length === 0) return;
    const dev = geomDeviceRef.current;

    // Single node: align/center within its parent frame, or the artboard if it has no parent.
    // Centering yields equal margins on both sides ("center" does both axes at once).
    if (ids.length === 1) {
      const id = ids[0];
      const n = nodesRef.current.find(x => x.id === id);
      if (!n || n.locked) return;
      const gm = geomAt(n, dev);
      const parentConn = connectionsRef.current.find(c => c.to === id && c.kind === 'child');
      let box = null;
      // 1) explicit parent frame
      if (parentConn) { const p = nodesRef.current.find(x => x.id === parentConn.from); if (p) { const pg = geomAt(p, dev); box = { x: pg.x, y: pg.y, w: pg.w, h: pg.h }; } }
      // 2) else the smallest node that visually contains this one (its on-screen parent)
      if (!box) {
        let bestArea = Infinity;
        nodesRef.current.forEach(o => {
          if (o.id === id) return;
          const og = geomAt(o, dev), area = og.w * og.h;
          if (gm.x >= og.x && gm.y >= og.y && gm.x + gm.w <= og.x + og.w && gm.y + gm.h <= og.y + og.h && area > gm.w * gm.h && area < bestArea) {
            bestArea = area; box = { x: og.x, y: og.y, w: og.w, h: og.h };
          }
        });
      }
      // 3) else the artboard
      if (!box) { const ab = artboardRef.current || { w: 1440, h: 1024 }; box = { x: 0, y: 0, w: ab.w, h: ab.h }; }
      const cX = Math.round(box.x + (box.w - gm.w) / 2);
      const cY = Math.round(box.y + (box.h - gm.h) / 2);
      const patch = {
        left: { x: box.x }, hcenter: { x: cX }, right: { x: box.x + box.w - gm.w },
        top: { y: box.y }, vmiddle: { y: cY }, bottom: { y: box.y + box.h - gm.h },
        center: { x: cX, y: cY },
      }[edge];
      if (patch) { pushHistory(); writeGeom(id, patch); }
      return;
    }

    pushHistory();
    const g = {};
    ids.forEach(id => { const n = nodesRef.current.find(x => x.id === id); if (n) g[id] = { n, ...geomAt(n, dev) }; });
    const arr = Object.values(g);
    const minX = Math.min(...arr.map(a => a.x)), maxX = Math.max(...arr.map(a => a.x + a.w));
    const minY = Math.min(...arr.map(a => a.y)), maxY = Math.max(...arr.map(a => a.y + a.h));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    ids.forEach(id => {
      const a = g[id];
      if (!a || a.n.locked) return;
      let patch = null;
      switch (edge) {
        case 'left':    patch = { x: minX }; break;
        case 'hcenter': patch = { x: Math.round(cx - a.w / 2) }; break;
        case 'right':   patch = { x: maxX - a.w }; break;
        case 'top':     patch = { y: minY }; break;
        case 'vmiddle': patch = { y: Math.round(cy - a.h / 2) }; break;
        case 'bottom':  patch = { y: maxY - a.h }; break;
      }
      if (patch) writeGeom(id, patch);
    });
  }, [pushHistory, writeGeom]);

  const distributeNodes = React.useCallback((ids, axis) => {
    if (!ids || ids.length < 3) return;
    pushHistory();
    const dev = geomDeviceRef.current;
    const key = axis === 'h' ? 'x' : 'y', size = axis === 'h' ? 'w' : 'h';
    const arr = ids.map(id => { const n = nodesRef.current.find(x => x.id === id); return n ? { id, n, ...geomAt(n, dev) } : null; })
      .filter(Boolean).sort((a, b) => a[key] - b[key]);
    const first = arr[0], last = arr[arr.length - 1];
    const start = first[key] + first[size] / 2, end = last[key] + last[size] / 2;
    const step = (end - start) / (arr.length - 1);
    arr.forEach((a, i) => {
      if (a.n.locked || a.id === first.id || a.id === last.id) return;
      writeGeom(a.id, { [key]: Math.round(start + step * i - a[size] / 2) });
    });
  }, [pushHistory, writeGeom]);

  // Even out the *gap* between the selected nodes so every adjacent pair sits the same distance apart —
  // like a flexbox `gap`. Unlike distribute (which evens the centres, so gaps still vary with size), this
  // packs them edge-to-edge along one axis with a single consistent gap. The first node stays put and the
  // gap used is the AVERAGE of the gaps they already have, so it tidies the existing layout rather than
  // imposing an arbitrary number. axis: 'v' (column), 'h' (row), or 'auto' (pick the layout's run direction).
  const gapNodes = React.useCallback((ids, axis = 'auto') => {
    if (!ids || ids.length < 2) return;
    const dev = geomDeviceRef.current;
    const items = ids.map(id => { const n = nodesRef.current.find(x => x.id === id); return n ? { id, n, ...geomAt(n, dev) } : null; }).filter(Boolean);
    if (items.length < 2) return;
    // Auto: whichever axis the node centres spread across further is the run direction (tall stack → column).
    let ax = axis;
    if (ax === 'auto') {
      const cx = items.map(a => a.x + a.w / 2), cy = items.map(a => a.y + a.h / 2);
      const spreadX = Math.max(...cx) - Math.min(...cx), spreadY = Math.max(...cy) - Math.min(...cy);
      ax = spreadY >= spreadX ? 'v' : 'h';
    }
    const key = ax === 'v' ? 'y' : 'x', size = ax === 'v' ? 'h' : 'w';
    const arr = items.slice().sort((a, b) => a[key] - b[key]);
    // Consistent gap = mean of the current edge-to-edge gaps, clamped ≥ 0 so nothing ends up overlapping.
    let sum = 0;
    for (let i = 1; i < arr.length; i++) sum += arr[i][key] - (arr[i - 1][key] + arr[i - 1][size]);
    const gap = Math.max(0, Math.round(sum / (arr.length - 1)));
    pushHistory();
    let cursor = arr[0][key] + arr[0][size] + gap;   // first node holds its position; pack the rest after it
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i];
      if (a.n.locked) { cursor = a[key] + a[size] + gap; continue; } // a locked node anchors where it is
      writeGeom(a.id, { [key]: Math.round(cursor) });
      cursor += a[size] + gap;
    }
  }, [pushHistory, writeGeom]);

  // Turn the current selection into a single-active menu ("nav group"): clicking one item in Preview
  // highlights it and clears the others — the piece the interaction states alone can't do. It reuses
  // the existing engine: the active look is each item's Left click state, the hover look its Hover On
  // state, so both stay fully editable in the Inspector (assign a custom animation there too). `style`
  // seeds the look — container items (frame/card/…) get a filled pill; icon/text items get a
  // colour + scale pop, since a raw icon paints no background.
  const setupMenu = React.useCallback((ids, style = 'sidebar') => {
    const BOX = new Set(['frame', 'stack', 'grid', 'card', 'section']);
    const items = ((ids && ids.length ? ids : selectedIdsRef.current) || [])
      .map(id => nodesRef.current.find(n => n.id === id)).filter(Boolean);
    if (items.length < 2) { fireToast({ tone: 'warning', title: 'Pick the menu items first', message: 'Select 2 or more components, then run this again.' }); return; }
    // Active glyph/pill colour = the menu's background (nearest ancestor with a fill), so a white pill
    // gets a legible icon (and a filled pill gets white text).
    const parentOf = {}; connectionsRef.current.filter(c => c.kind === 'child').forEach(c => { parentOf[c.to] = c.from; });
    let cur = parentOf[items[0].id], guard = 0, ink = null;
    while (cur && guard++ < 12) { const p = nodesRef.current.find(n => n.id === cur); if (p && p.fillColor) { ink = p.fillColor; break; } cur = parentOf[cur]; }
    ink = ink || '#3b2f96';
    const active = (n) => {
      const box = BOX.has(n.kind);
      if (style === 'pills') return box ? { fillColor: ink, textColor: '#ffffff', radius: 999 } : { textColor: '#ffffff', scale: 112 };
      if (style === 'tabs')  return box ? { borderColor: '#ffffff', borderWidth: 2, textColor: '#ffffff' } : { textColor: '#ffffff', scale: 106 };
      return box ? { fillColor: '#ffffff', textColor: ink, radius: 14 } : { textColor: '#ffffff', scale: 108 }; // sidebar
    };
    const hover = (n) => (BOX.has(n.kind) && style === 'sidebar') ? { fillColor: 'rgba(255,255,255,0.14)', radius: 14 } : { scale: 104 };
    const gid = uid('menu');
    const firstId = items.slice().sort((a, b) => a.y - b.y)[0].id;
    const idSet = new Set(items.map(n => n.id));
    // Resting labels read white on the dark menu. Only items that render their OWN label respect
    // node.textColor — a container's label is a separate child node this command doesn't own (and
    // whitening it would hide the label when its parent becomes the white active pill), so leave those
    // for a manual colour. Never clobber a textColor the user already set.
    const LABEL_KINDS = new Set(['button', 'text', 'link', 'heading']);
    pushHistory();
    setNodes(ns => ns.map(n => {
      if (!idSet.has(n.id)) return n;
      const whiten = LABEL_KINDS.has(n.kind) && (n.textColor == null || n.textColor === '');
      return {
        ...n, navGroup: gid, navActive: n.id === firstId, clickMode: 'toggle',
        ...(whiten ? { textColor: '#ffffff' } : null),
        states: {
          ...(n.states || {}),
          click:   { ...(n.states && n.states.click),   ...active(n), dur: 150, ease: 'ease-out' },
          hoverOn: { ...(n.states && n.states.hoverOn), ...hover(n),  dur: 120, ease: 'ease-out' },
        },
      };
    }));
    fireToast({ tone: 'success', title: 'Menu ready', message: items.length + ' items linked · open Preview and click one.' });
  }, [pushHistory, setNodes]);

  // Reorder / reparent from the layers tree. mode: 'before' | 'after' | 'inside'
  const reorderLayer = React.useCallback((dragId, targetId, mode) => {
    if (dragId === targetId) return;
    if (descendantsOf(dragId, connectionsRef.current).has(targetId)) {
      fireToast({ tone: 'warning', title: 'Cannot move', message: 'That would create a loop.' });
      return;
    }
    pushHistory();
    const targetParent = connectionsRef.current.find(c => c.to === targetId && c.kind === 'child')?.from || null;
    const newParent = mode === 'inside' ? targetId : targetParent;
    setConnections(cs => {
      const filtered = cs.filter(c => !(c.to === dragId && c.kind === 'child'));
      return newParent ? [...filtered, { from: newParent, to: dragId, kind: 'child' }] : filtered;
    });
    if (mode !== 'inside') {
      setNodes(ns => {
        const arr = ns.filter(n => n.id !== dragId);
        const moved = ns.find(n => n.id === dragId);
        const ti = arr.findIndex(n => n.id === targetId);
        if (!moved || ti < 0) return ns;
        arr.splice(mode === 'after' ? ti + 1 : ti, 0, moved);
        return arr;
      });
    }
  }, [pushHistory, setNodes, setConnections]);

  // Drag-reparent/reorder for a MULTI-selection (Layers panel): move every dragged node to the target,
  // preserving their top-to-bottom order and keeping them grouped together. Without this, dropping a
  // multi-selection only moved the one row the user physically grabbed (see LayersTree.onRowDrop).
  const reorderLayers = React.useCallback((dragIds, targetId, mode) => {
    const order = nodesRef.current.map(n => n.id);
    let ids = Array.from(new Set(dragIds)).filter(id => id !== targetId && nodesRef.current.some(n => n.id === id));
    // Drop any node whose own subtree contains the target — moving it under the target would loop.
    const looped = ids.filter(id => descendantsOf(id, connectionsRef.current).has(targetId));
    ids = ids.filter(id => !looped.includes(id));
    const targetParent = connectionsRef.current.find(c => c.to === targetId && c.kind === 'child')?.from || null;
    const newParent = mode === 'inside' ? targetId : targetParent;
    ids = ids.filter(id => id !== newParent);                        // a node can't become its own parent
    ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));          // keep their relative order
    if (!ids.length) { if (looped.length) fireToast({ tone: 'warning', title: 'Cannot move', message: 'That would create a loop.' }); return; }
    pushHistory();
    const idSet = new Set(ids);
    setConnections(cs => {
      const filtered = cs.filter(c => !(idSet.has(c.to) && c.kind === 'child'));
      return newParent ? [...filtered, ...ids.map(id => ({ from: newParent, to: id, kind: 'child' }))] : filtered;
    });
    setNodes(ns => {
      const moving = ids.map(id => ns.find(n => n.id === id)).filter(Boolean);
      const arr = ns.filter(n => !idSet.has(n.id));
      const ti = arr.findIndex(n => n.id === targetId);
      if (ti < 0) return ns;
      arr.splice(mode === 'before' ? ti : ti + 1, 0, ...moving);      // 'inside'/'after' land just below the target
      return arr;
    });
  }, [pushHistory, setNodes, setConnections]);

  // Group the selected layers into a new "folder" (a frame that becomes their parent). Children
  // keep their absolute positions; the group is sized to their bounding box and adopts the first
  // node's parent so it slots into the existing hierarchy.
  const groupNodes = React.useCallback((ids) => {
    const targetIds = ((ids && ids.length ? ids : selectedIdsRef.current) || []).filter(id => nodesRef.current.some(n => n.id === id));
    if (!targetIds.length) return;
    pushHistory();
    const dev = geomDeviceRef.current;
    const geoms = targetIds.map(id => geomAt(nodesRef.current.find(x => x.id === id), dev));
    const minX = Math.min(...geoms.map(g => g.x)), minY = Math.min(...geoms.map(g => g.y));
    const maxX = Math.max(...geoms.map(g => g.x + g.w)), maxY = Math.max(...geoms.map(g => g.y + g.h));
    const gid = uid('grp');
    const group = {
      id: gid, name: 'Group', icon: 'folder', kind: 'frame',
      x: minX, y: minY, w: Math.max(40, maxX - minX), h: Math.max(24, maxY - minY),
      layout: 'Flex column', gap: 12, synced: false, responsive: true, clipContent: false, locked: false, hidden: false, fillColor: '',
    };
    const firstParent = connectionsRef.current.find(c => c.to === targetIds[0] && c.kind === 'child')?.from || null;
    setNodes(ns => {
      const arr = [...ns];
      const at = Math.min(...targetIds.map(id => arr.findIndex(n => n.id === id)).filter(i => i >= 0));
      arr.splice(at, 0, group);
      return arr;
    });
    setConnections(cs => {
      const base = cs.filter(c => !(targetIds.includes(c.to) && c.kind === 'child'));
      const parentLink = firstParent ? [{ from: firstParent, to: gid, kind: 'child' }] : [];
      const childLinks = targetIds.map(id => ({ from: gid, to: id, kind: 'child' }));
      return [...base, ...parentLink, ...childLinks];
    });
    setSelectedIds([gid]);
    fireToast({ tone: 'success', title: 'Grouped', message: targetIds.length + ' layer' + (targetIds.length > 1 ? 's' : '') });
  }, [pushHistory, setNodes, setConnections]);

  // Dissolve a group: move its children up to the group's own parent, then delete the group node.
  const ungroupNodes = React.useCallback((groupId) => {
    const gid = groupId || (selectedIdsRef.current.length === 1 ? selectedIdsRef.current[0] : null);
    if (!gid) return;
    const kids = connectionsRef.current.filter(c => c.from === gid && c.kind === 'child').map(c => c.to);
    if (!kids.length) return;
    pushHistory();
    const groupParent = connectionsRef.current.find(c => c.to === gid && c.kind === 'child')?.from || null;
    setConnections(cs => {
      let base = cs.filter(c => !((c.from === gid || c.to === gid) && c.kind === 'child'));
      if (groupParent) base = [...base, ...kids.map(k => ({ from: groupParent, to: k, kind: 'child' }))];
      return base;
    });
    setNodes(ns => ns.filter(n => n.id !== gid));
    setSelectedIds(kids);
    fireToast({ tone: 'neutral', title: 'Ungrouped' });
  }, [pushHistory, setNodes, setConnections]);

  // Clipping mask: from a multi-selection, one shape becomes the mask and the rest are clipped to it
  // (Figma-style, non-destructive — both layers survive, `content.maskId → mask.id`). The mask is the
  // one vector shape in the selection, else the top-most layer. An image is auto-fitted to the shape
  // (box = mask box, object-fit: cover) so "drop image, drop circle, mask" yields the expected crop.
  const MASK_SHAPE_KINDS = React.useMemo(() => new Set(['ellipse', 'rect', 'star', 'polygon', 'triangle', 'arrow']), []);
  const applyClipMask = React.useCallback((ids) => {
    const sel = (ids && ids.length ? ids : selectedIdsRef.current) || [];
    const all = nodesRef.current;
    const chosen = sel.map(id => all.find(n => n.id === id)).filter(Boolean);
    if (chosen.length < 2) {
      fireToast({ tone: 'warning', title: 'Select two layers', message: 'Pick the image (or any layer) plus a shape to mask it with.' });
      return;
    }
    const kof = (n) => (window.kindOf ? window.kindOf(n) : n.kind);
    const zi = (n) => all.findIndex(x => x.id === n.id); // later in the array = drawn on top
    const shapes = chosen.filter(n => MASK_SHAPE_KINDS.has(kof(n)));
    const mask = (shapes.length && shapes.length < chosen.length)
      ? shapes.reduce((a, b) => (zi(b) > zi(a) ? b : a))
      : chosen.reduce((a, b) => (zi(b) > zi(a) ? b : a));
    const content = chosen.filter(n => n.id !== mask.id);
    if (!content.length) { fireToast({ tone: 'warning', title: 'Nothing to mask', message: 'Add a layer to clip into the shape.' }); return; }
    pushHistory();
    const box = { x: mask.x, y: mask.y, w: mask.w, h: mask.h };
    const contentIds = new Set(content.map(c => c.id));
    setNodes(ns => ns.map(n => {
      if (!contentIds.has(n.id)) return n;
      const patch = { ...n, maskId: mask.id };
      if (kof(n) === 'image') { patch.x = box.x; patch.y = box.y; patch.w = box.w; patch.h = box.h; patch.fit = n.fit || 'cover'; }
      return patch;
    }));
    setSelectedIds(content.map(c => c.id));
    fireToast({ tone: 'success', title: 'Clipping mask applied', message: content.length + ' layer' + (content.length > 1 ? 's' : '') + ' clipped to ' + (mask.name || 'the shape') });
  }, [pushHistory, setNodes, MASK_SHAPE_KINDS]);

  // Release a mask. Passing the mask shape frees every layer it clips; passing a clipped layer frees
  // just that one.
  const releaseMask = React.useCallback((id) => {
    const all = nodesRef.current;
    const target = all.find(n => n.id === id);
    if (!target) return;
    const clippedByThis = all.filter(n => n.maskId === id).map(n => n.id);
    const affected = clippedByThis.length ? clippedByThis : (target.maskId ? [id] : []);
    if (!affected.length) return;
    pushHistory();
    const set = new Set(affected);
    setNodes(ns => ns.map(n => { if (!set.has(n.id)) return n; const rest = { ...n }; delete rest.maskId; return rest; }));
    fireToast({ tone: 'neutral', title: 'Mask released' });
  }, [pushHistory, setNodes]);

  const placeNode = (c, spot) => {
    const id = uid();
    const kind = c.kind || 'frame';
    const d = KIND_DEFAULTS[kind] || {};
    const w = d.w || 200, h = d.h || 120;
    const s = spot || findOpenSpot(nodesRef.current, w, h);
    const props = c.props || {}; // custom-component captured variant props (override kind defaults)
    const n = {
      name: c.name, icon: c.icon, layout: 'Flex column', gap: 12,
      synced: false, responsive: true, clipContent: false, locked: false, hidden: false, fillColor: '',
      ...d,
      ...props,
      id, kind, x: s.x, y: s.y, w: props.w || w, h: props.h || h, // identity/placement always win
    };
    if (n.label === undefined) n.label = c.name;
    pushHistory();
    setNodes(ns => [...ns, n]);
    setSelectedIds([id]);
    fireToast({ tone: 'neutral', title: c.name + ' placed', message: 'Drag it into position on the canvas.' });
  };

  // Drop a library component at canvas coordinates (component centered on the drop point)
  const dropComponent = React.useCallback((c, cx, cy) => {
    placeNode(c, { x: Math.round(cx - 100), y: Math.round(cy - 60) });
  }, []); // eslint-disable-line

  // --- AI agent bridge: lets the AI Helper read the current design and apply a batch of edits ------
  const applyAgentActions = React.useCallback((actions, priorRefs) => {
    const s = settingsRef.current || {};
    const res = buildAgentPages(pagesRef.current, activePageIdRef.current, actions, priorRefs, {
      variables: variablesRef.current, workflows: workflowsRef.current, customComponents: customComponentsRef.current,
      artboard: artboardRef.current, grid: { snap: !!s.snap, size: s.gridSize || 8 },
    });
    if (!res.total) return { total: 0, summary: 'No changes', missing: res.missing, unknownOps: res.unknownOps, refs: res.refs, undoScope: res.undoScope };
    pushHistory();
    setPages(res.pages);
    // Project-level state lives in its own React state (and outside the page-scoped undo, same as the
    // editor's own add-workflow / delete-page). Write back only what the batch actually touched.
    if (res.globalVarsChanged) setVariables(res.variables);
    if (res.workflowsChanged) setWorkflows(res.workflows);
    if (res.componentsChanged) setCustomComponents(res.customComponents);
    if (res.active !== activePageIdRef.current) setActivePageId(res.active);
    // Select the freshly created nodes that live on the (possibly new) active page, for visible feedback.
    const activePage = res.pages.find(p => p.id === res.active);
    const onActive = activePage ? res.newNodeIds.filter(id => activePage.nodes.some(n => n.id === id)) : [];
    if (onActive.length) { setSelectedIds(onActive); setView('design'); setPreviewMode(false); }
    return { total: res.total, summary: res.summary, missing: res.missing, unknownOps: res.unknownOps, refs: res.refs, undoScope: res.undoScope };
  }, [pushHistory]); // eslint-disable-line
  const agentApi = React.useMemo(() => ({
    // `scope` comes from the chosen effort level (low/medium/high) — see buildAgentContext.
    getContext: (scope) => {
      const pg = pagesRef.current.find(p => p.id === activePageIdRef.current) || pagesRef.current[0];
      return buildAgentContext(pagesRef.current, activePageIdRef.current, selectedIdsRef.current, scope, {
        variables: variablesRef.current, pageVars: pg && pg.vars,
        workflows: workflowsRef.current, customComponents: customComponents,
        artboard: artboardRef.current, device: activeDeviceRef.current,
        grid: { snap: !!(settingsRef.current && settingsRef.current.snap), size: (settingsRef.current && settingsRef.current.gridSize) || 8 },
      });
    },
    // A PNG of the active page, so the audit stage can look at the design instead of only reading its
    // coordinates. Drawn from node data (CanvasImage.jsx), so it needs no preview mounted and is a pure
    // function of the same state getContext serializes — which is what keeps the audit cache honest.
    getImage: () => {
      if (!window.renderCanvasImage) return null;
      const pg = pagesRef.current.find(p => p.id === activePageIdRef.current) || pagesRef.current[0];
      if (!pg) return null;
      try {
        return window.renderCanvasImage(pg.nodes, pg.connections, artboardRef.current, {});
      } catch (e) { console.warn('[ai] canvas image failed: ' + e.message); return null; }
    },
    apply: applyAgentActions,
  }), [applyAgentActions, customComponents]); // eslint-disable-line

  // --- Custom components: capture a configured node's variant into a reusable Library item ---
  const [saveCompFor, setSaveCompFor] = React.useState(null);  // node id awaiting a name
  const [saveCompName, setSaveCompName] = React.useState('');
  const openSaveAsComponent = (id) => {
    const n = nodesRef.current.find(x => x.id === id);
    if (!n) return;
    setSaveCompFor(id);
    setSaveCompName((n.name || 'Component') + ' variant');
  };
  const confirmSaveAsComponent = () => {
    const n = nodesRef.current.find(x => x.id === saveCompFor);
    const name = saveCompName.trim();
    if (!n || !name) { setSaveCompFor(null); return; }
    const base = n.kind || (window.kindOf ? window.kindOf(n) : 'frame');
    const cc = { id: uid('cc'), name, icon: n.icon || 'shapes', base, props: captureVariantProps(n) };
    setCustomComponents(list => [...list, cc]);
    setSaveCompFor(null);
    fireToast({ tone: 'success', title: 'Component saved', message: name + ' added to the Library.' });
  };
  const deleteCustomComponent = (id) => setCustomComponents(list => list.filter(c => c.id !== id));

  // --- Shader code editor ---
  const [shaderEditFor, setShaderEditFor] = React.useState(null); // node id being edited
  const [shaderError, setShaderError] = React.useState(null);
  const [customShaderName, setCustomShaderName] = React.useState(''); // name field for saving a custom shader
  const openShaderEditor = (id) => { setShaderError(null); setCustomShaderName(''); setShaderEditFor(id); };
  const setShaderCode = (code) => {
    const n = nodesRef.current.find(x => x.id === shaderEditFor);
    if (n) updateNode(shaderEditFor, { shader: { ...(n.shader || {}), on: true, code } });
  };
  const loadShaderPreset = (k) => {
    const n = nodesRef.current.find(x => x.id === shaderEditFor);
    if (n) updateNode(shaderEditFor, { shader: { ...(n.shader || {}), on: true, preset: k, code: shaderPresets[k] } });
  };
  // Save the current shader code as a reusable custom preset (project-level; same name overwrites).
  const isBuiltInShader = (name) => !!(window.SHADER_PRESETS && window.SHADER_PRESETS[name]);
  const saveCustomShader = (name, code) => {
    const nm = (name || '').trim();
    if (!nm || !code) { fireToast({ tone: 'warning', title: 'Nothing to save', message: 'Enter a name and some shader code.' }); return; }
    if (isBuiltInShader(nm)) { fireToast({ tone: 'warning', title: 'Reserved name', message: '"' + nm + '" is a built-in preset — pick another name.' }); return; }
    setCustomShaders(list => [...list.filter(s => s.name !== nm), { id: uid('sh'), name: nm, code }]);
    setCustomShaderName('');
    fireToast({ tone: 'success', title: 'Shader saved', message: nm + ' added to your presets.' });
  };
  const deleteCustomShader = (name) => setCustomShaders(list => list.filter(s => s.name !== name));

  // --- Plugin / animation command menu (⌘/Ctrl-K) ---
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [cmdQuery, setCmdQuery] = React.useState('');
  // Enabled plugins contribute their actions; enabled animations become "Apply: <name>" commands.
  const commands = React.useMemo(() => {
    const cmds = [];
    enabledItems.filter(i => i.type === 'plugin').forEach(pl => {
      ((pl.data && pl.data.actions) || []).forEach(a => cmds.push({ id: pl.id + ':' + a.id, group: pl.name, label: a.label, shortcut: a.shortcut, type: a.type, params: a.params || {} }));
    });
    enabledItems.filter(i => i.type === 'animation').forEach(an => {
      cmds.push({ id: 'anim:' + an.id, group: 'Animation', label: 'Apply: ' + an.name, type: 'applyStates', params: { states: (an.data && an.data.states) || {} } });
    });
    return cmds;
  }, [enabledItems]);

  // Fixed dispatcher — maps a declarative action to an existing editor op (no code execution).
  const runCommand = React.useCallback((cmd) => {
    // Editor commands carry a `run` closure and act globally (no selection needed), Blender-style.
    if (cmd.run) { setCmdOpen(false); cmd.run(); return; }
    const ids = selectedIdsRef.current;
    if (!ids || !ids.length) { fireToast({ tone: 'warning', title: 'Select a component first' }); return; }
    const p = cmd.params || {};
    if (cmd.type === 'align') { alignNodes(ids, p.edge || 'hcenter'); }
    else if (cmd.type === 'distribute') { distributeNodes(ids, p.axis || 'h'); }
    else {
      pushHistory();
      if (cmd.type === 'applyStyle') ids.forEach(id => updateNode(id, p.props || {}));
      else if (cmd.type === 'applyShader') ids.forEach(id => { const n = nodesRef.current.find(x => x.id === id); updateNode(id, { shader: { ...((n && n.shader) || {}), on: true, code: p.code, speed: (n && n.shader && n.shader.speed) || 1 } }); });
      else if (cmd.type === 'applyStates') ids.forEach(id => { const n = nodesRef.current.find(x => x.id === id); updateNode(id, { states: { ...((n && n.states) || {}), ...(p.states || {}) } }); });
      else if (cmd.type === 'autoStack') ids.forEach(id => updateNode(id, { layout: 'Flex column', gap: p.gap != null ? p.gap : 12 }));
    }
    setCmdOpen(false);
    fireToast({ tone: 'success', title: cmd.label });
  }, [updateNode, alignNodes, distributeNodes, pushHistory]);

  // ⌘/Ctrl-K opens the menu; a single-key plugin shortcut runs its action (when not typing, with a selection).
  React.useEffect(() => {
    const onKey = (e) => {
      const ae = document.activeElement || {};
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName || '') || ae.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setCmdQuery(''); setCmdOpen(o => !o); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = (e.key || '').toLowerCase();
      const cmd = commands.find(c => c.shortcut && c.shortcut.toLowerCase() === key);
      if (cmd && selectedIdsRef.current && selectedIdsRef.current.length) { e.preventDefault(); runCommand(cmd); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [commands, runCommand]);

  // --- Pages ---
  const selectPage = (id) => { setActivePageId(id); setSelectedIds([]); setActiveAnimId(null); };
  const addPage = () => {
    const id = uid('page');
    const nth = pages.length + 1;
    const np = { id, name: 'Page ' + nth, route: '/page-' + nth, nodes: [], connections: [], vars: [] };
    setPages(ps => [...ps, np]);
    setActivePageId(id);
    setSelectedIds([]);
    fireToast({ tone: 'neutral', title: 'Page added', message: np.name });
  };
  const renamePage = (id, name) => setPages(ps => ps.map(p => p.id === id ? { ...p, name } : p));
  const deletePage = (id) => {
    if (pages.length <= 1) { fireToast({ tone: 'warning', title: 'Cannot delete', message: 'A project needs at least one page.' }); return; }
    const remaining = pages.filter(p => p.id !== id);
    setPages(remaining);
    delete historyRef.current[id];
    if (activePageId === id) { setActivePageId(remaining[0].id); setSelectedIds([]); }
    pruneAnimTabs(t => t.pageId !== id);
    fireToast({ tone: 'neutral', title: 'Page deleted' });
  };

  const resetActivePage = () => {
    pushHistory();
    setPages(ps => ps.map(p => p.id === activePageIdRef.current
      ? { ...p, nodes: JSON.parse(JSON.stringify(DEFAULT_NODES)), connections: JSON.parse(JSON.stringify(DEFAULT_CONNECTIONS)) } : p));
    setSelectedIds([]);
    setShareOpen(false);
    fireToast({ tone: 'neutral', title: 'Page reset' });
  };

  const generate = () => {
    setView('code');
    fireToast({ tone: 'success', title: 'Code generated', message: nodes.length + ' nodes → React + TypeScript.' });
  };

  // ---- Run system: compile the generated source and launch it in real popup window(s) ----
  // Release = one webpage window. Debug = webpage + a console window (logs, network, build errors). The
  // run executes the SAME files the export ships (RunEngine + CodePanel.latticeProjectFileMap), so a
  // clean run means a clean export. Every start re-inits (recompiles) — the loading is expected.
  // The run opens showing exactly the device/screen-type the editor is on (its own toolbar then lets
  // you switch); non-responsive projects run desktop-only. `standalone` drops the toolbar entirely and
  // renders just the page as a real, window-following web app.
  const runConfig = (opts) => {
    const standalone = !!(opts && opts.standalone);
    return {
      // Standalone follows the window from the first paint, so it starts device-less (auto by width);
      // the toolbar view opens on exactly the device/screen-type the editor is showing.
      device: standalone ? '' : activeDevice,
      preset: settings.desktopPreset || 'std',
      orientation: standalone ? '' : (orient[orientKeyFor(activeDevice, settings.desktopPreset)] || ''),
      responsive: settings.responsive !== false,
      chrome: !standalone,
      workflows, variables,
    };
  };
  const runFileMap = (opts) => (window.latticeProjectFileMap ? window.latticeProjectFileMap(pages, projectName || 'Lattice app', assets, runConfig(opts)) : {});
  const conLog = (entry) => { const cw = conWinRef.current; if (cw && !cw.closed && cw.__latticeLog) { try { cw.__latticeLog(entry); } catch (e) { /* window closed */ } } };
  const stopRun = () => {
    clearInterval(runPollRef.current); runPollRef.current = null;
    try { if (runWinRef.current && !runWinRef.current.closed) runWinRef.current.close(); } catch (e) { /* gone */ }
    try { if (conWinRef.current && !conWinRef.current.closed) conWinRef.current.close(); } catch (e) { /* gone */ }
    runWinRef.current = null; conWinRef.current = null;
    setRunState({ active: false, paused: false, debug: false, standalone: false });
  };
  const startRun = (debug, opts) => {
    if (!window.buildRunnableHtml) { fireToast({ tone: 'danger', title: 'Run engine unavailable' }); return; }
    const standalone = !!(opts && opts.standalone);
    const fileMap = runFileMap({ standalone });
    const html = window.buildRunnableHtml(fileMap, { title: projectName || 'Lattice app', debug: !!debug, channel: 'run' });
    let win = runWinRef.current;
    if (!win || win.closed) win = window.open('', 'lattice_run', 'width=1200,height=840');
    if (!win) { fireToast({ tone: 'danger', title: 'Popup blocked', message: 'Allow pop-ups for this site, then Run again.' }); return; }
    win.document.open(); win.document.write(html); win.document.close();
    try { win.focus(); } catch (e) { /* ignore */ }
    runWinRef.current = win;
    if (debug) {
      let cw = conWinRef.current;
      if (!cw || cw.closed) cw = window.open('', 'lattice_console', 'width=560,height=840');
      if (cw) { cw.document.open(); cw.document.write(window.buildConsoleHtml((projectName || 'App') + ' — Console')); cw.document.close(); conWinRef.current = cw; }
      conLog({ tag: 'build', cls: 'build', text: 'Run started — compiling ' + Object.keys(fileMap).length + ' files…' });
    } else if (conWinRef.current && !conWinRef.current.closed) { conWinRef.current.close(); conWinRef.current = null; }
    setRunState({ active: true, paused: false, debug: !!debug, standalone });
    clearInterval(runPollRef.current);
    runPollRef.current = setInterval(() => { const w = runWinRef.current; if (!w || w.closed) stopRun(); }, 800);
  };
  const restartRun = () => startRun(runState.debug, { standalone: runState.standalone });
  const pauseRun = () => {
    const w = runWinRef.current; if (!w || w.closed) return;
    const next = !runState.paused;
    try { w.postMessage({ __latticeCtl: true, cmd: next ? 'pause' : 'resume' }, '*'); } catch (e) { /* ignore */ }
    setRunState(r => ({ ...r, paused: next }));
    conLog({ tag: 'build', cls: 'build', text: next ? 'Paused.' : 'Resumed.' });
  };
  // The editor is the message hub: the run window posts console/network/status here (its opener), and we
  // mirror those into the debug console window.
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data; if (!d || !d.__lattice) return;
      const p = d.payload || {};
      if (d.kind === 'console') conLog({ tag: p.level, cls: p.level, text: p.text, t: d.t });
      else if (d.kind === 'net') conLog({ tag: 'net', cls: 'net', text: (p.method || 'GET') + ' ' + p.url + (p.status != null ? ('  ' + p.status + ' (' + p.ms + 'ms)') : (p.phase === 'error' ? ('  failed: ' + p.error) : '  …')), t: d.t });
      else if (d.kind === 'status') { if (p.state === 'running') conLog({ tag: 'build', cls: 'build', text: 'App running.' }); else if (p.state === 'error') conLog({ tag: 'error', cls: 'error', text: 'App failed to start (see errors above).' }); }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []); // eslint-disable-line
  // In a legacy ?run=1 tab, start in preview mode so inputs/workflows are live.
  React.useEffect(() => { if (runFlag) setPreviewMode(true); }, []); // eslint-disable-line

  const copyLink = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary })))).replace(/=/g, '');
      const url = window.location.href.split('#')[0] + '#project=' + encoded;
      navigator.clipboard.writeText(url).then(() => {
        fireToast({ tone: 'success', title: 'Link copied to clipboard' });
        setShareOpen(false);
      });
    } catch { fireToast({ tone: 'warning', title: 'Could not copy link' }); }
  };

  const sendInvite = () => {
    if (!inviteEmail.includes('@')) {
      fireToast({ tone: 'warning', title: 'Invalid email', message: 'Enter a valid email address.' });
      return;
    }
    fireToast({ tone: 'success', title: 'Invite sent', message: inviteEmail });
    setInviteEmail('');
    setShareOpen(false);
  };

  // Bundle of actions for context menus (Canvas + LayersTree)
  const actions = {
    duplicate: duplicateNodes, detach: detachNode, toggleLock, toggleVisibility, bringToFront,
    remove: deleteMany, deleteOne: deleteNode, copy: copySelection, paste, rename: renameNode,
    group: groupNodes, ungroup: ungroupNodes, clipMask: applyClipMask, releaseMask,
    order: orderSelection, flip: flipSelection,
    selectAll: () => setSelectedIds(nodesRef.current.map(n => n.id)), reset: resetActivePage,
  };

  // Persist project + settings (standalone editor only; project canvases live in the DB). Heavy `assets`
  // (base64 images/fonts + scaffold files) are stored separately in IndexedDB — bundling them into this
  // localStorage key blew its ~5MB quota, and the swallowed failure lost the whole project on reload.
  React.useEffect(() => {
    if (projectId) return;
    try { localStorage.setItem('lattice_project_v2', JSON.stringify({ project: { pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary }, settings })); } catch {}
  }, [pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary, settings, projectId]);
  // Boot: hydrate the heavy assets from IndexedDB (localStorage now carries only the light project). A
  // legacy save may have embedded assets in localStorage — those are already in state, so keep them and
  // let the persist effect below migrate them into IndexedDB. `assetsLoaded` gates persistence until this
  // read finishes, so the empty initial state can't overwrite what's saved before we've read it back.
  const [assetsLoaded, setAssetsLoaded] = React.useState(false);
  React.useEffect(() => {
    if (projectId) { setAssetsLoaded(true); return; }
    let cancelled = false;
    idbGet(IDB_ASSETS_KEY).then(saved => {
      if (cancelled) return;
      if (Array.isArray(saved) && saved.length) setAssets(cur => (cur && cur.length ? cur : saved));
      setAssetsLoaded(true);
    });
    return () => { cancelled = true; };
  }, [projectId]);
  React.useEffect(() => {
    if (projectId || !assetsLoaded) return;   // wait for the initial read before writing anything back
    idbSet(IDB_ASSETS_KEY, assets).then(ok => { if (ok === false) console.warn('[lattice] could not persist assets (IndexedDB unavailable)'); });
  }, [assets, assetsLoaded, projectId]);

  // Export / import the whole project as JSON (an editor tool)
  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary, assets, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (projectName || 'lattice-project').replace(/\s+/g, '-').toLowerCase() + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    fireToast({ tone: 'success', title: 'Project exported' });
  };
  const importProject = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (d.pages && d.pages.length) {
          const proj = withWorkflowDefaults(d);
          setPages(proj.pages); setActivePageId(proj.activePageId || proj.pages[0].id);
          setWorkflows(proj.workflows || []); setVariables(proj.variables || []);
          setCustomComponents(proj.customComponents || []);
          setCustomShaders(proj.customShaders || []);
          setEnabledLibrary(proj.enabledLibrary || []);
          setAssets(proj.assets || []);
          setActiveWorkflowId((proj.workflows || [])[0]?.id || null);
          if (d.settings) setSettings(s => ({ ...s, ...d.settings }));
          setSelectedIds([]); historyRef.current = {}; bumpHistory();
          fireToast({ tone: 'success', title: 'Project imported', message: d.pages.length + ' page(s)' });
        } else fireToast({ tone: 'warning', title: 'Invalid project file' });
      } catch { fireToast({ tone: 'warning', title: 'Invalid project file' }); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Global keyboard shortcuts
  React.useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && k === 's') { e.preventDefault(); fireToast({ tone: 'success', title: projectId ? 'Saved to cloud' : 'Saved locally' }); return; }
      // The remaining shortcuts edit the design page's nodes — the Workflow/Code/Relationships tabs
      // (and the Run tab) have their own selection/keys, so don't let these mutate design nodes there.
      // An open TimelineEditor renders inside the design view but binds ⌫ and ←/→ to keyframes/playhead.
      const inDesign = viewRef.current === 'design' && !timelineOpenRef.current;
      if (mod && k === 'd') { if (inDesign) { e.preventDefault(); duplicateNodes(selectedIdsRef.current); } return; }
      if (mod && k === 'c' && !typing) { if (inDesign) copySelection(); return; }
      if (mod && k === 'v' && !typing) { if (inDesign) { e.preventDefault(); paste(); } return; }
      if (mod && k === 'a' && !typing) { if (inDesign) { e.preventDefault(); setSelectedIds(nodesRef.current.map(n => n.id)); } return; }
      if (mod && k === 'g' && !e.shiftKey) { if (inDesign) { e.preventDefault(); groupNodes(selectedIdsRef.current); } return; }
      if (mod && k === 'g' && e.shiftKey) { if (inDesign) { e.preventDefault(); ungroupNodes(selectedIdsRef.current[0]); } return; }
      if (mod && e.altKey && k === 'm' && !typing) { if (inDesign) { e.preventDefault(); applyClipMask(); } return; }
      // Z-order: [ / ] shift one step, Ctrl/Cmd+[ / ] jump to back/front (Figma/Photoshop).
      if ((k === '[' || k === ']') && !typing && inDesign) {
        if (selectedIdsRef.current.length) { e.preventDefault(); const front = k === ']'; orderSelection(mod ? (front ? 'front' : 'back') : (front ? 'forward' : 'backward')); }
        return;
      }
      if (typing) return;
      if (e.key === '?') { setHelpOpen(true); return; }
      if (e.key === 'Escape') { setSelectedIds([]); setHelpOpen(false); return; }
      if (!inDesign) return; // below: delete / nudge design nodes
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedIdsRef.current.length) { e.preventDefault(); deleteMany(selectedIdsRef.current); } return; }
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); nudge(-step, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0); }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); nudge(0, -step); }
      else if (e.key === 'ArrowDown')  { e.preventDefault(); nudge(0, step); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [undo, redo, duplicateNodes, copySelection, paste, deleteMany, nudge, groupNodes, ungroupNodes, orderSelection]);

  // Lucide icons — debounced so drag frames don't re-scan icons on every mousemove.
  // iconSig changes on icon/lock/hidden/glyph edits (not on x/y drags) so canvas components re-render their glyphs.
  const iconSig = nodes.map(n => n.icon + (n.iconName || '') + (n.btnIcon || '') + (n.btnIconPos || '') + (n.prefixIcon || '') + (n.suffixIcon || '') + (n.clearable ? 'C' : '') + (n.passwordToggle ? 'P' : '') + (n.locked ? 'L' : '') + (n.hidden ? 'H' : '')).join('|');
  React.useEffect(() => {
    const t = setTimeout(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, 50);
    return () => clearTimeout(t);
  }, [nodes.length, iconSig, view, selectedIds, previewMode, activePageId, pages.length, settingsOpen, shareOpen, editingState, activeAnimId, openAnimTabs.length, collapsed.left, collapsed.right, animValid, showScene]);

  const sidebarStyle = {
    width: panelW.left, flex: 'none', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', minHeight: 0,
  };

  // Drag a panel edge to resize its width (clamped). 'left' grows with the cursor, 'right' shrinks.
  const startPanelResize = (side) => (e) => {
    e.preventDefault();
    const sx = e.clientX, cur = panelW[side];
    const move = (ev) => {
      const dx = ev.clientX - sx;
      const w = Math.max(200, Math.min(560, Math.round(side === 'left' ? cur + dx : cur - dx)));
      setPanelW(p => ({ ...p, [side]: w }));
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };
  // Drag the handle above the timeline dock to resize it. Height is stored as a fraction of the
  // center column so it adapts to window size; the page canvas above takes the remainder.
  const startTimelineResize = (e) => {
    e.preventDefault();
    const area = timelineAreaRef.current; if (!area) return;
    const move = (ev) => {
      const rect = area.getBoundingClientRect();
      setTimelineFrac(Math.max(0.2, Math.min(0.94, (rect.bottom - ev.clientY) / rect.height)));
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
  };
  const maximizeTimeline = () => setTimelineFrac(0.94); // timeline tall, page a thin strip
  const minimizeTimeline = () => setTimelineFrac(0.28); // page tall, timeline a compact dock

  // Drag a horizontal divider to resize a left-panel section's height (Pages / Library). The bottom
  // section (Layers) flexes to fill whatever height remains.
  const startSectionResize = (key) => (e) => {
    e.preventDefault();
    // Base off the section's actual rendered height so a drag works whether it was fitting content
    // (auto) or already at an explicit height.
    const ref = key === 'pages' ? pagesSecRef : librarySecRef;
    const base = ref.current ? ref.current.getBoundingClientRect().height : (panelH[key] || 120);
    const sy = e.clientY;
    const move = (ev) => {
      const h = Math.max(60, Math.min(640, Math.round(base + (ev.clientY - sy))));
      setPanelH(p => ({ ...p, [key]: h }));
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
  };
  const sectionDivider = (key) => (
    <div onMouseDown={startSectionResize(key)} title="Drag to resize"
      style={{ height: 7, flex: 'none', cursor: 'row-resize', background: 'transparent', borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} />
  );

  // Overlay the panel boundary (absolute, no layout width) so the center column sits flush against the
  // panels — otherwise a transparent gap strip shows beside the (lighter) page-tab bar.
  const resizer = (side) => (
    <div onMouseDown={startPanelResize(side)} title="Drag to resize"
      style={{ position: 'absolute', top: 0, bottom: 0, width: 8, cursor: 'col-resize', background: 'transparent', zIndex: 5,
        ...(side === 'left' ? { left: panelW.left - 4 } : { right: panelW.right - 4 }) }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} />
  );

  // Runtime bridge handed to Preview so bound inputs read/write the live variable store.
  const previewRuntime = React.useMemo(() => ({
    getVar: (id) => runtimeVars[id],
    setVar: (id, val) => setRuntimeVars(s => ({ ...s, [id]: val })),
  }), [runtimeVars]);

  // Hold everything behind a loading screen until the cloud project is in state, so a refresh or first
  // open never flashes the previously-cached project before it's replaced.
  if (loading) return <ProjectLoadingScreen name={projectName} />;

  // Chromeless run mode (?run=1) — just the live prototype, full-window, no editor UI.
  if (runFlag) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <PreviewCanvas nodes={viewNodes} connections={connections} artboard={artboard} device={activeDevice}
          onAction={onPreviewAction} runtime={previewRuntime} runtimeProps={runtimeProps} pageTimeline={page.timeline}
          animCtl={animCtlRef} sceneReplay={sceneReplay} />
        <WorkflowRunLog runs={runLog} onClear={() => setRunLog([])} />
        <Dialog open={!!previewDialog} onClose={() => setPreviewDialog(null)} title={previewDialog ? previewDialog.title : ''}
          footer={<Button variant="solid" size="sm" onClick={() => setPreviewDialog(null)}>Close</Button>}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{previewDialog && previewDialog.message ? previewDialog.message : 'Dialog opened from an interaction.'}</div>
        </Dialog>
        {toast && (
          <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 200 }}>
            <Toast {...toast} onClose={() => setToast(null)} />
          </div>
        )}
      </div>
    );
  }

  // The design canvas — rendered either on its own, or above the timeline dock when one is open (so the
  // whole page stays visible while animating). Defined once; only one instance mounts at a time.
  // When a timeline is docked at the bottom, the visible canvas is only the region above it. Center the
  // left/right panel-collapse tabs in *that* region (not the whole column) so a tall timeline never
  // overlaps them — they ride up as the dock grows. 33px = page-tab bar, 7px = timeline resize handle.
  const timelineDocked = view === 'design' && (animValid || showScene);
  const sideTabTop = timelineDocked
    ? `calc(33px + ((100% - 33px) * ${1 - timelineFrac} - 7px) / 2)`
    : '50%';

  const designCanvas = (
    <Canvas
      nodes={canvasNodes} connections={connections} settings={settings}
      artboard={artboard} device={activeDevice}
      selectedIds={selectedIds} onSelect={selectOne} onSelectMany={selectMany}
      onUpdateNode={updateNode} onCommitDrag={commitDrag} onInteractStart={onInteractStart}
      onDropComponent={dropComponent} onAddConnection={addConnection}
      editingState={editingState}
      editingStateLabel={editingState === 'default' ? '' : (((window.STATE_LABELS || {})[editingState]) || ((selected && (selected.customStates || []).find(c => c.id === editingState) || {}).name) || 'state')}
      onAlign={alignNodes} onDistribute={distributeNodes} viewRef={canvasViewRef} apiRef={canvasApiRef} actions={actions}
    />
  );

  // ⌘/Ctrl-K command menu: every top-level editor action, searchable Blender-style. `run` closures act
  // globally (no selection needed for view/panel/page ops); selection-scoped ones no-op with nothing selected.
  const cmdSel = () => selectedIdsRef.current || [];
  const editorCommands = [
    { id: 'go-design', group: 'Go to', label: 'Design view', run: () => setView('design') },
    { id: 'go-code', group: 'Go to', label: 'Code view', run: () => setView('code') },
    { id: 'go-rel', group: 'Go to', label: 'Relationships view', run: () => setView('rel') },
    { id: 'go-flow', group: 'Go to', label: 'Workflow view', run: () => setView('workflow') },
    { id: 'toggle-preview', group: 'View', label: 'Toggle preview', run: () => setPreviewMode(v => !v) },
    { id: 'run-app', group: 'View', label: 'Run app', run: () => startRun(false) },
    { id: 'debug-app', group: 'View', label: 'Debug app (with console)', run: () => startRun(true) },
    { id: 'scene-tl', group: 'Animate', label: 'Toggle scene timeline', run: () => openSceneTimeline() },
    { id: 'undo', group: 'Edit', label: 'Undo', shortcut: 'Ctrl+Z', run: () => undo() },
    { id: 'redo', group: 'Edit', label: 'Redo', shortcut: 'Ctrl+Y', run: () => redo() },
    { id: 'copy', group: 'Edit', label: 'Copy selection', shortcut: 'Ctrl+C', run: () => copySelection() },
    { id: 'paste', group: 'Edit', label: 'Paste', shortcut: 'Ctrl+V', run: () => paste() },
    { id: 'duplicate', group: 'Edit', label: 'Duplicate selection', shortcut: 'Ctrl+D', run: () => { const s = cmdSel(); if (s.length) duplicateNodes(s); } },
    { id: 'delete', group: 'Edit', label: 'Delete selection', shortcut: 'Del', run: () => { const s = cmdSel(); if (s.length) deleteMany(s); } },
    { id: 'select-all', group: 'Edit', label: 'Select all', shortcut: 'Ctrl+A', run: () => setSelectedIds(nodesRef.current.map(n => n.id)) },
    { id: 'deselect', group: 'Edit', label: 'Deselect all', shortcut: 'Esc', run: () => setSelectedIds([]) },
    { id: 'ins-frame', group: 'Insert', label: 'Insert frame', run: () => placeNode({ name: 'Frame', icon: 'frame', kind: 'frame' }) },
    { id: 'ins-rect', group: 'Insert', label: 'Insert rectangle', run: () => placeNode({ name: 'Rectangle', icon: 'square', kind: 'rect' }) },
    { id: 'ins-ellipse', group: 'Insert', label: 'Insert ellipse', run: () => placeNode({ name: 'Ellipse', icon: 'circle', kind: 'ellipse' }) },
    { id: 'ins-line', group: 'Insert', label: 'Insert line', run: () => placeNode({ name: 'Line', icon: 'minus', kind: 'line' }) },
    { id: 'ins-star', group: 'Insert', label: 'Insert star', run: () => placeNode({ name: 'Star', icon: 'star', kind: 'star' }) },
    { id: 'ins-text', group: 'Insert', label: 'Insert text', run: () => placeNode({ name: 'Text', icon: 'type', kind: 'text' }) },
    { id: 'ins-image', group: 'Insert', label: 'Insert image', run: () => placeNode({ name: 'Image', icon: 'image', kind: 'image' }) },
    { id: 'ins-button', group: 'Insert', label: 'Insert button', run: () => placeNode({ name: 'Button', icon: 'square', kind: 'button' }) },
    { id: 'group', group: 'Arrange', label: 'Group selection', shortcut: 'Ctrl+G', run: () => { const s = cmdSel(); if (s.length > 1) groupNodes(s); } },
    { id: 'clip-mask', group: 'Arrange', label: 'Clipping Mask (fit layer into shape)', shortcut: 'Ctrl+Alt+M', run: () => applyClipMask() },
    { id: 'release-mask', group: 'Arrange', label: 'Release clipping mask', run: () => { const s = cmdSel(); if (s.length) s.forEach(id => releaseMask(id)); } },
    { id: 'ungroup', group: 'Arrange', label: 'Ungroup selection', shortcut: 'Ctrl+Shift+G', run: () => { const s = cmdSel(); if (s.length) ungroupNodes(s[0]); } },
    { id: 'detach', group: 'Arrange', label: 'Detach from parent', run: () => { const s = cmdSel(); if (s.length) s.forEach(id => detachNode(id)); } },
    { id: 'order-front', group: 'Order', label: 'Bring to front', shortcut: 'Ctrl+]', run: () => orderSelection('front') },
    { id: 'order-forward', group: 'Order', label: 'Bring forward', shortcut: ']', run: () => orderSelection('forward') },
    { id: 'order-backward', group: 'Order', label: 'Send backward', shortcut: '[', run: () => orderSelection('backward') },
    { id: 'order-back', group: 'Order', label: 'Send to back', shortcut: 'Ctrl+[', run: () => orderSelection('back') },
    { id: 'flip-h', group: 'Transform', label: 'Flip horizontal', run: () => flipSelection('h') },
    { id: 'flip-v', group: 'Transform', label: 'Flip vertical', run: () => flipSelection('v') },
    { id: 'rot-cw', group: 'Transform', label: 'Rotate 90° clockwise', run: () => rotateSelection(90) },
    { id: 'rot-ccw', group: 'Transform', label: 'Rotate 90° counter-clockwise', run: () => rotateSelection(-90) },
    { id: 'rot-180', group: 'Transform', label: 'Rotate 180°', run: () => rotateSelection(180) },
    { id: 'reset-transform', group: 'Transform', label: 'Reset transform', run: () => resetTransformSelection() },
    { id: 'lock-sel', group: 'Layer', label: 'Lock selection', run: () => lockSelection(true) },
    { id: 'unlock-sel', group: 'Layer', label: 'Unlock selection', run: () => lockSelection(false) },
    { id: 'unlock-all', group: 'Layer', label: 'Unlock all layers', run: () => unlockAll() },
    { id: 'hide-sel', group: 'Layer', label: 'Hide selection', run: () => hideSelection() },
    { id: 'show-all', group: 'Layer', label: 'Show all layers', run: () => showAllNodes() },
    { id: 'isolate', group: 'Layer', label: 'Isolate selection (hide others)', run: () => isolateSelection() },
    { id: 'sel-inverse', group: 'Select', label: 'Select inverse', run: () => selectInverse() },
    { id: 'sel-same', group: 'Select', label: 'Select same type', run: () => selectSameKind() },
    { id: 'sel-frames', group: 'Select', label: 'Select all frames', run: () => selectAllFrames() },
    { id: 'sel-children', group: 'Select', label: 'Select children of selection', run: () => selectChildrenOfSelection() },
    { id: 'align-left', group: 'Align', label: 'Align left', run: () => { const s = cmdSel(); if (s.length) alignNodes(s, 'left'); } },
    { id: 'align-hcenter', group: 'Align', label: 'Align center (horizontal)', run: () => { const s = cmdSel(); if (s.length) alignNodes(s, 'hcenter'); } },
    { id: 'align-right', group: 'Align', label: 'Align right', run: () => { const s = cmdSel(); if (s.length) alignNodes(s, 'right'); } },
    { id: 'align-top', group: 'Align', label: 'Align top', run: () => { const s = cmdSel(); if (s.length) alignNodes(s, 'top'); } },
    { id: 'align-vmiddle', group: 'Align', label: 'Align middle (vertical)', run: () => { const s = cmdSel(); if (s.length) alignNodes(s, 'vmiddle'); } },
    { id: 'align-bottom', group: 'Align', label: 'Align bottom', run: () => { const s = cmdSel(); if (s.length) alignNodes(s, 'bottom'); } },
    { id: 'dist-h', group: 'Align', label: 'Distribute horizontally', run: () => { const s = cmdSel(); if (s.length > 2) distributeNodes(s, 'h'); } },
    { id: 'dist-v', group: 'Align', label: 'Distribute vertically', run: () => { const s = cmdSel(); if (s.length > 2) distributeNodes(s, 'v'); } },
    { id: 'gap-auto', group: 'Align', label: 'Gap: even out spacing (auto)', run: () => { const s = cmdSel(); if (s.length > 1) gapNodes(s, 'auto'); } },
    { id: 'gap-v', group: 'Align', label: 'Gap: even vertical spacing (column)', run: () => { const s = cmdSel(); if (s.length > 1) gapNodes(s, 'v'); } },
    { id: 'gap-h', group: 'Align', label: 'Gap: even horizontal spacing (row)', run: () => { const s = cmdSel(); if (s.length > 1) gapNodes(s, 'h'); } },
    { id: 'menu-sidebar', group: 'Menu', label: 'Menu: make sidebar menu (single-active pill)', run: () => { const s = cmdSel(); s.length > 1 ? setupMenu(s, 'sidebar') : fireToast({ tone: 'warning', title: 'Select the menu items first' }); } },
    { id: 'menu-pills', group: 'Menu', label: 'Menu: make pill menu (single-active)', run: () => { const s = cmdSel(); s.length > 1 ? setupMenu(s, 'pills') : fireToast({ tone: 'warning', title: 'Select the menu items first' }); } },
    { id: 'menu-tabs', group: 'Menu', label: 'Menu: make tab menu (single-active)', run: () => { const s = cmdSel(); s.length > 1 ? setupMenu(s, 'tabs') : fireToast({ tone: 'warning', title: 'Select the menu items first' }); } },
    { id: 'new-page', group: 'Pages', label: 'New page', run: () => addPage() },
    { id: 'toggle-left', group: 'Panels', label: 'Toggle left panel', run: () => setCollapsed(c => ({ ...c, left: !c.left })) },
    { id: 'toggle-right', group: 'Panels', label: 'Toggle right panel', run: () => setCollapsed(c => ({ ...c, right: !c.right })) },
    { id: 'zoom-fit', group: 'View', label: 'Zoom to fit', run: () => { setView('design'); canvasApiRef.current && canvasApiRef.current.fit(); } },
    { id: 'zoom-100', group: 'View', label: 'Zoom to 100%', run: () => { setView('design'); canvasApiRef.current && canvasApiRef.current.zoomTo(100); } },
    { id: 'zoom-sel', group: 'View', label: 'Zoom to selection', run: () => { const s = cmdSel(); setView('design'); canvasApiRef.current && canvasApiRef.current.zoomToSelection(s); } },
    { id: 'toggle-grid', group: 'View', label: 'Toggle grid', run: () => setSettings(s => ({ ...s, showGrid: s.showGrid === false })) },
    { id: 'toggle-snap', group: 'View', label: 'Toggle snap to grid', run: () => setSettings(s => ({ ...s, snap: !s.snap })) },
    { id: 'open-settings', group: 'App', label: 'Open settings', run: () => setSettingsOpen(true) },
    { id: 'share', group: 'App', label: 'Share project', run: () => setShareOpen(true) },
    { id: 'generate', group: 'App', label: 'Generate code', run: () => generate() },
    { id: 'shortcuts', group: 'App', label: 'Keyboard shortcuts', run: () => setHelpOpen(true) },
  ];
  const paletteCommands = [...editorCommands, ...commands];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <Topbar
        view={view} setView={setView}
        pageName={page.name}
        projectName={projectName} saving={saving}
        onBack={projectId ? () => { window.location.href = '/ui_kits/lattice-app/#/projects'; } : null}
        onHelp={() => setHelpOpen(true)}
        previewMode={previewMode} onTogglePreview={() => setPreviewMode(v => !v)}
        onRun={startRun} runState={runState} onStop={stopRun} onRestart={restartRun} onPause={pauseRun}
        device={activeDevice} onSetDevice={setActiveDevice}
        responsive={settings.responsive !== false}
        desktopPreset={settings.desktopPreset} onSetDesktopPreset={setDesktopPreset}
        artboard={artboard} orientation={orient[orientKeyFor(activeDevice, settings.desktopPreset)]}
        onToggleOrientation={toggleOrientation}
        customSize={settings.customSize} onSetCustomSize={setCustomSize}
        onOpenSettings={() => setSettingsOpen(true)}
        onShare={() => setShareOpen(true)} onGenerate={generate}
        dirty={!nodes.every(n => n.synced)}
        onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
        aiOpen={aiOpen} onToggleAI={() => setAiOpen(v => !v)}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {view === 'design' && !collapsed.left && (
          <aside style={sidebarStyle}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div ref={pagesSecRef} style={{ height: panelH.pages == null ? 'auto' : panelH.pages, maxHeight: panelH.pages == null ? 240 : undefined, flex: 'none', overflowY: 'auto' }}>
                <PagesPanel pages={pages} activePageId={activePageId} onSelect={selectPage} onAdd={addPage} onRename={renamePage} onDelete={deletePage} />
              </div>
              {sectionDivider('pages')}
              <div ref={librarySecRef} style={{ height: panelH.library == null ? 'auto' : panelH.library, flex: '0 1 auto', minHeight: 0, overflowY: 'auto' }}>
                <LibraryPanel onPlace={placeNode} customComponents={customComponents} onDeleteCustom={deleteCustomComponent} libraryComponents={libraryComponents} />
              </div>
              {sectionDivider('library')}
              <div style={{ flex: 1, minHeight: 60, overflowY: 'auto' }}>
                <LayersTree
                  nodes={viewNodes} connections={connections} selectedIds={selectedIds}
                  onSelect={selectOne} onSelectMany={selectMany} onRename={renameNode} onSetParent={setParent}
                  onToggleVisibility={toggleVisibility} onToggleLock={toggleLock}
                  onReorder={reorderLayer} onReorderMany={reorderLayers} actions={actions}
                />
              </div>
            </div>
            <AccountFooter />
          </aside>
        )}

        {/* Center column: VS Code-style page tabs sit above the view area only, between the panels.
            position:relative anchors the floating scene-timeline toggle (bottom-right, below). */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {view === 'design' && (
            <PageTabs pages={pages} activePageId={activePageId} onSelectPage={selectPage} onAddPage={addPage} onRenamePage={renamePage} onDeletePage={deletePage}
              animTabs={animTabList} activeAnimId={activeAnimId} onSelectAnim={selectAnimTab} onCloseAnim={closeAnimTab} />
          )}
          {/* A timeline is docked at the bottom (inside the Design tab only) with the page canvas above,
              so the whole page stays visible while animating. Drag the handle — or use the ⌃/⌄ buttons
              in the transport bar — to resize; the page takes the remaining height. */}
          {view === 'design' && (animValid || showScene) ? (
            <div ref={timelineAreaRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>{designCanvas}</div>
              <div onMouseDown={startTimelineResize} onDoubleClick={() => setTimelineFrac(0.58)} title="Drag to resize · double-click to reset"
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
                style={{ height: 7, flex: 'none', cursor: 'row-resize', background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }} />
              <div style={{ flexBasis: (timelineFrac * 100) + '%', flexGrow: 0, flexShrink: 0, minHeight: 0, display: 'flex' }}>
                {animValid ? (
                  <TimelineEditor node={animNode} state={window.ensureTracks ? window.ensureTracks(animState) : animState}
                    palette={settings.palette || []}
                    onAddTrack={animAddTrack} onDeleteTrack={animDeleteTrack}
                    onAddKey={animAddKey} onUpdateKey={animUpdateKey} onDeleteKey={animDeleteKey}
                    onAddKeys={animAddKeys} onDeleteKeys={animDeleteKeys}
                    onKeyCheckpoint={animKeyCheckpoint} onKeyCoalesce={animKeyCoalesce}
                    onSetDuration={animSetDuration} onSetLoop={animSetLoopState} onSetLoopWrap={animSetLoopWrap}
                    onApplyPresetToTrack={animApplyPresetToTrack}
                    onSetMode={setTimelineMode} canComponent playheadRef={timelinePlayheadRef}
                    onSetHeightMax={maximizeTimeline} onSetHeightMin={minimizeTimeline} />
                ) : (
                  <TimelineEditor pageMode pageNodes={viewNodes} palette={settings.palette || []}
                    state={{ name: 'Scene · ' + page.name, tracks: (page.timeline || {}).tracks || [], duration: (page.timeline || {}).duration || 2000, loop: (page.timeline || {}).loop !== false, loopWrap: (page.timeline || {}).loopWrap !== false }}
                    onAddTrack={sceneAddTrack} onDeleteTrack={sceneDeleteTrack}
                    onAddKey={sceneAddKey} onUpdateKey={sceneUpdateKey} onDeleteKey={sceneDeleteKey}
                    onAddKeys={sceneAddKeys} onDeleteKeys={sceneDeleteKeys}
                    onSetDuration={sceneSetDuration} onSetLoop={sceneSetLoop} onSetLoopWrap={sceneSetLoopWrap}
                    onSetMode={setTimelineMode} canComponent={canComponentTimeline} onClose={openSceneTimeline} playheadRef={timelinePlayheadRef}
                    onSetHeightMax={maximizeTimeline} onSetHeightMin={minimizeTimeline} />
                )}
              </div>
            </div>
          ) : (
            <>
              {view === 'design' && !previewMode && designCanvas}
              {view === 'design' && previewMode && <PreviewCanvas nodes={viewNodes} connections={connections} artboard={artboard} device={activeDevice} onAction={onPreviewAction} runtime={previewRuntime} runtimeProps={runtimeProps} pageTimeline={page.timeline} animCtl={animCtlRef} sceneReplay={sceneReplay} />}
              {view === 'code' && <CodePanel pages={pages} activePageId={activePageId} assets={assets} onChangeAssets={setAssets} projectName={projectName} settings={settings} workflows={workflows} variables={variables} />}
              {view === 'rel' && (
                <RelationshipsView nodes={nodes} connections={connections} onSelect={(id) => { selectOne(id); setView('design'); }} />
              )}
              {view === 'workflow' && (
                <WorkflowView
                  workflows={workflows} activeWorkflowId={activeWorkflowId} onSelectWorkflow={setActiveWorkflowId}
                  onAddWorkflow={addWorkflow} onRenameWorkflow={renameWorkflow} onDeleteWorkflow={deleteWorkflow} onChangeWorkflow={changeWorkflow}
                  variables={variables} onChangeVariables={setVariables}
                  pageName={page.name} pageVars={page.vars || []} onChangePageVars={changePageVars}
                  pages={pages}
                />
              )}
            </>
          )}
          {/* Scene-timeline toggle — floats at the bottom-right of the canvas (mirrors the zoom control
              at bottom-left). Hidden while a timeline editor is open, since those own that corner; the
              scene timeline is then closed from its own ✕. */}
          {view === 'design' && !previewMode && !animValid && !showScene && (
            <button type="button" title="Scene timeline — animate this page" onClick={openSceneTimeline}
              style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 6, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              <i data-lucide="clapperboard" style={{ width: 15, height: 15 }}></i>
            </button>
          )}
        </div>

        {view === 'design' && !collapsed.right && (
          <Inspector
            width={panelW.right}
            node={animValid ? mergeState(animNode, activeAnim.stateId) : inspectorNode}
            onChange={animValid ? inspAnimStateChange : inspChange}
            onBaseChange={inspBaseChange} onRename={inspRename}
            connections={connections} onDelete={deleteNode} onDetach={detachNode}
            onDuplicate={() => selected && duplicateNodes([selected.id])}
            allNodes={viewNodes} onSetParent={setParent}
            responsive={settings.responsive !== false}
            palette={settings.palette || []} pages={pages}
            assets={assets} onAddAsset={addImageAsset}
            workflows={workflows} variables={variables} pageVars={page.vars || []}
            editingState={editingState} onSetEditingState={setEditingStateReset}
            animActive={animActive} animTrackedProps={animTrackedProps} onKeyframeProp={keyframeProp}
            animEditing={animValid ? (animState.name || 'Animation') : ''}
            singleSelected={animValid ? true : selectedIds.length === 1}
            frameEditing={false} onOpenAnimEditor={openAnimEditor}
            onApplyPreset={applyPreset} onBindAnim={bindAnim}
            onSaveAsComponent={openSaveAsComponent} onEditShader={openShaderEditor}
            shaderPresets={shaderPresets}
            onResetState={resetState} onSetStateEnabled={setStateEnabled}
            editingFrame={editingFrame} onSetEditingFrame={setEditingFrame}
            onAddCustomState={addCustomState} onUpdateCustomState={updateCustomState} onDeleteCustomState={deleteCustomState}
            onAddFrame={addFrame} onUpdateFrame={updateFrame} onDeleteFrame={deleteFrame}
          />
        )}

        {view === 'design' && !collapsed.left && resizer('left')}
        {view === 'design' && !collapsed.right && resizer('right')}

        {/* Panel collapse tabs — fully hide a side panel for more canvas space. They ride the panel edge
            when open and sit flush at the screen edge when the panel is hidden. */}
        {view === 'design' && (
          <button type="button" title={collapsed.left ? 'Show left panel' : 'Hide left panel'}
            onClick={() => setCollapsed(c => ({ ...c, left: !c.left }))}
            style={{ position: 'absolute', top: sideTabTop, transform: 'translateY(-50%)', left: collapsed.left ? 0 : panelW.left - 1, zIndex: 7,
              width: 15, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              border: '1px solid var(--border-subtle)', borderRadius: '0 6px 6px 0',
              background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i data-lucide={collapsed.left ? 'chevron-right' : 'chevron-left'} style={{ width: 13, height: 13 }}></i>
          </button>
        )}
        {view === 'design' && (
          <button type="button" title={collapsed.right ? 'Show right panel' : 'Hide right panel'}
            onClick={() => setCollapsed(c => ({ ...c, right: !c.right }))}
            style={{ position: 'absolute', top: sideTabTop, transform: 'translateY(-50%)', right: collapsed.right ? 0 : panelW.right - 1, zIndex: 7,
              width: 15, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              border: '1px solid var(--border-subtle)', borderRadius: '6px 0 0 6px',
              background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i data-lucide={collapsed.right ? 'chevron-left' : 'chevron-right'} style={{ width: 13, height: 13 }}></i>
          </button>
        )}
      </div>

      <AIHelper open={aiOpen} onClose={() => setAiOpen(false)} agent={agentApi} />

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} title="Share project"
        description="Anyone with the link can view this canvas."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetActivePage}>Reset page</Button>
            <Button variant="ghost" size="sm" onClick={() => setShareOpen(false)}>Close</Button>
            <Button variant="solid" size="sm" onClick={copyLink} iconLeft={<i data-lucide="link"></i>}>Copy link</Button>
          </>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Invite by email" placeholder="name@studio.com"
            iconLeft={<i data-lucide="mail"></i>}
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Allow editing</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collaborators can change nodes</div>
            </div>
            <Switch checked={allowEditing} onChange={setAllowEditing} />
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={sendInvite} iconLeft={<i data-lucide="send"></i>}>Send invite</Button>
        </div>
      </Dialog>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Canvas settings"
        description="Grid and snapping preferences for this editor."
        footer={<Button variant="solid" size="sm" onClick={() => setSettingsOpen(false)}>Done</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Show grid</div>
            <Switch checked={settings.showGrid} onChange={v => setSettings(s => ({ ...s, showGrid: v }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Snap to grid</div>
            <Switch checked={settings.snap} onChange={v => setSettings(s => ({ ...s, snap: v }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Responsive (screen types)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Show the device switcher and per-screen layouts.</div>
            </div>
            <Switch checked={settings.responsive !== false} onChange={v => setSettings(s => ({ ...s, responsive: v }))} />
          </div>
          <Select
            label="Grid size" size="sm"
            options={['4', '8', '12', '16', '24']}
            value={String(settings.gridSize)}
            onChange={e => setSettings(s => ({ ...s, gridSize: +e.target.value }))}
          />
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Color palette</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(settings.palette || []).map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <input type="color" title={p.name || p.value} value={p.value}
                    onChange={e => setSettings(s => ({ ...s, palette: s.palette.map((x, j) => j === i ? { ...x, value: e.target.value } : x) }))}
                    style={{ width: 28, height: 28, padding: 0, border: '1px solid var(--border-default)', cursor: 'pointer', background: 'none' }} />
                  <button type="button" title="Remove" onClick={() => setSettings(s => ({ ...s, palette: s.palette.filter((_, j) => j !== i) }))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 14, height: 14, borderRadius: '50%', border: 0, background: 'var(--surface-raised)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, lineHeight: '12px', padding: 0 }}>×</button>
                </div>
              ))}
              <button type="button" title="Add color" onClick={() => setSettings(s => ({ ...s, palette: [...(s.palette || []), { name: 'Color', value: '#7c9fff' }] }))}
                style={{ width: 28, height: 28, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i data-lucide="plus" style={{ width: 13, height: 13 }}></i>
              </button>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Assets &amp; Plugins</div>
            {libraryItems.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Nothing installed yet. Add styles, shaders, animations or plugins from the
                <a href="/ui_kits/lattice-app/#/market" target="_blank" rel="noreferrer" style={{ color: 'var(--blue-base)' }}> Market</a>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {libraryItems.map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', width: 62, flex: 'none' }}>{it.type}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                    <Switch checked={enabledLibrary.includes(it.id)} onChange={() => toggleLibraryItem(it.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Project file</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" fullWidth onClick={exportProject} iconLeft={<i data-lucide="download"></i>}>Export .json</Button>
              <Button variant="outline" size="sm" fullWidth onClick={() => document.getElementById('lt-import').click()} iconLeft={<i data-lucide="upload"></i>}>Import</Button>
              <input id="lt-import" type="file" accept="application/json,.json" title="Import project JSON" onChange={importProject} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!saveCompFor} onClose={() => setSaveCompFor(null)} title="Save as component"
        description="Save this component's current variant as a reusable Library item."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setSaveCompFor(null)}>Cancel</Button>
            <Button variant="solid" size="sm" onClick={confirmSaveAsComponent} disabled={!saveCompName.trim()} iconLeft={<i data-lucide="save"></i>}>Save</Button>
          </>
        }>
        <Input label="Component name" size="sm" value={saveCompName} placeholder="e.g. Primary CTA"
          onChange={e => setSaveCompName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && saveCompName.trim()) confirmSaveAsComponent(); }} />
      </Dialog>

      <Dialog open={!!shaderEditFor} onClose={() => setShaderEditFor(null)} title="Shader code" width={640}
        description="GLSL fragment shader. Provided uniforms: u_time (seconds) and u_resolution (pixels)."
        footer={<Button variant="solid" size="sm" onClick={() => setShaderEditFor(null)}>Done</Button>}>
        {(() => {
          const sn = nodes.find(n => n.id === shaderEditFor);
          if (!sn) return null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative', height: 150, border: '1px solid var(--border-subtle)', overflow: 'hidden', background: 'var(--surface-inset)' }}>
                {window.ShaderFill && <window.ShaderFill code={sn.shader && sn.shader.code} speed={sn.shader && sn.shader.speed} onError={setShaderError} />}
              </div>
              {shaderError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--status-danger-fg)', whiteSpace: 'pre-wrap', maxHeight: 72, overflow: 'auto' }}>{shaderError}</div>}
              <textarea value={(sn.shader && sn.shader.code) || ''} onChange={e => setShaderCode(e.target.value)} spellCheck={false}
                style={{ width: '100%', height: 210, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5, padding: 10, border: '1px solid var(--border-default)', background: 'var(--surface-inset)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Load preset:</span>
                {Object.keys(shaderPresets).map(k => {
                  const isCustom = (customShaders || []).some(s => s.name === k);
                  const isActive = (sn.shader && sn.shader.preset) === k;
                  return (
                    <span key={k} style={{ display: 'inline-flex', alignItems: 'center', ...(isCustom ? { border: '1px solid var(--border-subtle)', borderRadius: 4 } : {}) }}>
                      <Button variant={isActive ? 'solid' : 'ghost'} size="sm" onClick={() => loadShaderPreset(k)}
                        iconLeft={isActive ? <i data-lucide="check"></i> : undefined}>{k}</Button>
                      {isCustom && (
                        <button type="button" title={'Delete "' + k + '"'} onClick={() => deleteCustomShader(k)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 22, border: 0, borderLeft: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>×</button>
                      )}
                    </span>
                  );
                })}
              </div>
              {/* Save the current code as a reusable custom shader (persists with the project). */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <Input size="sm" placeholder="Name this shader to save it…" value={customShaderName}
                    onChange={e => setCustomShaderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveCustomShader(customShaderName, sn.shader && sn.shader.code); }} />
                </div>
                <Button variant="outline" size="sm" iconLeft={<i data-lucide="save"></i>}
                  onClick={() => saveCustomShader(customShaderName, sn.shader && sn.shader.code)}>Save as custom</Button>
              </div>
            </div>
          );
        })()}
      </Dialog>

      <Dialog open={!!previewDialog} onClose={() => setPreviewDialog(null)} title={previewDialog ? previewDialog.title : ''}
        footer={<Button variant="solid" size="sm" onClick={() => setPreviewDialog(null)}>Close</Button>}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{previewDialog && previewDialog.message ? previewDialog.message : 'Dialog opened from an interaction.'}</div>
      </Dialog>

      <Dialog open={cmdOpen} onClose={() => setCmdOpen(false)} title="Command menu" width={460}
        description="Search every editor action — views, edits, alignment, panels, plus plugins & animations.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input autoFocus iconLeft={<i data-lucide="search"></i>} placeholder="Search commands…" size="sm"
            value={cmdQuery} onChange={e => setCmdQuery(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
            {paletteCommands.filter(c => (c.label + ' ' + c.group).toLowerCase().includes(cmdQuery.trim().toLowerCase())).map(c => (
              <button key={c.id} type="button" onClick={() => runCommand(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                <span style={{ flex: 1, minWidth: 0 }}>{c.label}<span style={{ color: 'var(--text-disabled)', fontSize: 11, marginLeft: 8 }}>{c.group}</span></span>
                {c.shortcut && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', padding: '1px 6px' }}>{c.shortcut.toUpperCase()}</kbd>}
              </button>
            ))}
            {paletteCommands.filter(c => (c.label + ' ' + c.group).toLowerCase().includes(cmdQuery.trim().toLowerCase())).length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '10px 2px', lineHeight: 1.5 }}>
                No command matches “{cmdQuery}”.
              </div>
            )}
          </div>
        </div>
      </Dialog>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts"
        description="Work the canvas without leaving the keyboard." width={460}
        footer={<Button variant="solid" size="sm" onClick={() => setHelpOpen(false)}>Got it</Button>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {[
            ['Undo / Redo', 'Ctrl+Z / Ctrl+Y'], ['Duplicate', 'Ctrl+D'], ['Copy / Paste', 'Ctrl+C / Ctrl+V'],
            ['Select all', 'Ctrl+A'], ['Delete', 'Del'], ['Deselect', 'Esc'],
            ['Nudge', 'Arrow keys'], ['Nudge ×10', 'Shift + Arrow'], ['Pan canvas', 'Space + drag'],
            ['Zoom', 'Scroll'], ['Save', 'Ctrl+S'], ['This help', '?'],
          ].map(([label, keys]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
              <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', padding: '2px 6px' }}>{keys}</kbd>
            </div>
          ))}
        </div>
      </Dialog>

      {(previewMode || view === 'workflow') && <WorkflowRunLog runs={runLog} onClear={() => setRunLog([])} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 200 }}>
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
// Account footer — the signed-in user's name, email and current plan, pinned to the bottom of the left
// panel. Reads the app backend (present when the editor is opened from the product with a session);
// falls back to a neutral "Guest / Free" state when the editor runs standalone with no backend/auth.
function AccountFooter() {
  const [user, setUser] = React.useState(null);
  const [plan, setPlan] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null)).then(d => { if (alive && d && d.user) setUser(d.user); }).catch(() => {});
    fetch('/api/subscription', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null)).then(d => { if (alive && d && d.subscription) setPlan(d.subscription.name); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const name = (user && user.name) || 'Guest';
  const email = (user && user.email) || 'Not signed in';
  const planName = plan || 'Free';
  const initials = (name.match(/\b\w/g) || ['G']).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ flex: 'none', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface)',
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div title={name} style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600,
        color: 'var(--action-solid-text)', background: 'var(--action-solid)', userSelect: 'none' }}>
        {user && user.avatar_url
          ? <img src={user.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div title={email} style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
      </div>
      <span title={planName + ' plan'} style={{ flex: 'none', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--action-solid)', background: 'color-mix(in srgb, var(--action-solid) 16%, transparent)',
        border: '1px solid color-mix(in srgb, var(--action-solid) 40%, transparent)', borderRadius: 999, padding: '2px 8px' }}>{planName}</span>
    </div>
  );
}

window.LatticeApp = LatticeApp;
