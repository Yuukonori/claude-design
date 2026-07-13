/* global React, Topbar, PageTabs, LibraryPanel, PagesPanel, LayersTree, Canvas, PreviewCanvas, Inspector, CodePanel, RelationshipsView, WorkflowView, WorkflowRunLog, AnimCanvas */

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
  const artboardRef = React.useRef(null);     // current device artboard box, for single-node align
  const editingStateRef = React.useRef('default');
  const openAnimTabsRef = React.useRef([]);
  const activeAnimRef = React.useRef(null);
  const animFrameIdxRef = React.useRef(0);
  const workflowsRef = React.useRef(workflows);
  const variablesRef = React.useRef(variables);
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
  React.useEffect(() => { workflowsRef.current = workflows; }, [workflows]);
  React.useEffect(() => { variablesRef.current = variables; }, [variables]);
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
  const SCENE_DEFAULT = { on: true, loop: true, autoplay: true, duration: 2000, tracks: [] };
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
    setNodes(ns => ns.filter(n => n.id !== id));
    setConnections(cs => cs.filter(c => c.from !== id && c.to !== id));
    setSelectedIds(ids => ids.filter(i => i !== id));
    pruneAnimTabs(t => t.nodeId !== id);
  }, [pushHistory, setNodes, setConnections, pruneAnimTabs]);

  const deleteMany = React.useCallback((ids) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    pushHistory();
    setNodes(ns => ns.filter(n => !idSet.has(n.id)));
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
    pushHistory();
    setNodes(ns => ns.map(n => {
      if (!idSet.has(n.id)) return n;
      return {
        ...n, navGroup: gid, navActive: n.id === firstId, clickMode: 'toggle',
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
    group: groupNodes, ungroup: ungroupNodes,
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
  }, [undo, redo, duplicateNodes, copySelection, paste, deleteMany, nudge, groupNodes, ungroupNodes]);

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
      onAlign={alignNodes} onDistribute={distributeNodes} viewRef={canvasViewRef} actions={actions}
    />
  );

  // ⌘/Ctrl-K command menu: every top-level editor action, searchable Blender-style. `run` closures act
  // globally (no selection needed for view/panel/page ops); selection-scoped ones no-op with nothing selected.
  const cmdSel = () => selectedIdsRef.current || [];
  const editorCommands = [
    { id: 'go-design', group: 'Go to', label: 'Design view', run: () => setView('design') },
    { id: 'go-code', group: 'Go to', label: 'Code view', run: () => setView('code') },
    { id: 'go-rel', group: 'Go to', label: 'Relationships view', run: () => setView('relationships') },
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
    { id: 'group', group: 'Arrange', label: 'Group selection', shortcut: 'Ctrl+G', run: () => { const s = cmdSel(); if (s.length > 1) groupNodes(s); } },
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
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {view === 'design' && !collapsed.left && (
          <aside style={sidebarStyle}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div ref={pagesSecRef} style={{ height: panelH.pages == null ? 'auto' : panelH.pages, maxHeight: panelH.pages == null ? 240 : undefined, flex: 'none', overflowY: 'auto' }}>
                <PagesPanel pages={pages} activePageId={activePageId} onSelect={selectPage} onAdd={addPage} onRename={renamePage} onDelete={deletePage} />
              </div>
              {sectionDivider('pages')}
              <div ref={librarySecRef} style={{ height: panelH.library == null ? 'auto' : panelH.library, flex: 'none', overflowY: 'auto' }}>
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
      <div title={name} style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600,
        color: 'var(--action-solid-text)', background: 'var(--action-solid)', userSelect: 'none' }}>{initials}</div>
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
