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
  const [dock, setDock] = React.useState(null);                      // torn-off tab preview dock: {type,pageId,nodeId?,stateId?}
  const [dockH, setDockH] = React.useState(220);                     // dock height (drag to resize)
  const [tearing, setTearing] = React.useState(false);               // dragging a tab toward the bottom drop zone
  const tearRef = React.useRef(null);
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
  // Resolve the bottom dock's descriptor to the live node/state (anim) or page it should preview.
  const dockTarget = React.useMemo(() => {
    if (!dock) return null;
    const pg = pages.find(p => p.id === dock.pageId);
    if (!pg) return null;
    if (dock.type === 'anim') {
      const n = (pg.nodes || []).find(x => x.id === dock.nodeId) || null;
      const st = (n && (n.customStates || []).find(c => c.id === dock.stateId)) || null;
      return { type: 'anim', node: n, state: st };
    }
    return { type: 'page', page: pg };
  }, [dock, pages]);
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
        setActiveWorkflowId((c.workflows || [])[0]?.id || null);
        setSelectedIds([]);
        setProjectName(d.project.name || '');
        document.title = (d.project.name || 'Project') + ' — Lattice';
      })
      .catch(() => {})
      .finally(() => { projectLoadedRef.current = true; });
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

  const resetState = React.useCallback((id, st) =>
    setNodes(ns => ns.map(n => {
      if (n.id !== id || !n.states) return n;
      const rest = { ...n.states }; delete rest[st];
      return { ...n, states: rest };
    })), [setNodes]);

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
    setAnimFrameIdx(0); setView('design');
  }, []);
  const closeAnimTab = React.useCallback((id) => {
    setOpenAnimTabs(ts => ts.filter(t => t.id !== id));
    setActiveAnimId(cur => (cur === id ? null : cur));
  }, []);
  const selectAnimTab = React.useCallback((id) => {
    const t = openAnimTabsRef.current.find(x => x.id === id);
    if (!t) return;
    setActiveAnimId(id); setAnimFrameIdx(0); setView('design');
    if (t.pageId !== activePageIdRef.current) setActivePageId(t.pageId);
    setSelectedIds([t.nodeId]);
  }, []);

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

  // --- Bottom preview dock: drag a page/anim tab down past the drop zone to open a live preview ---
  const openDockFor = React.useCallback((d) => {
    if (!d) return;
    if (d.type === 'anim') {
      const t = openAnimTabsRef.current.find(x => x.id === d.animTabId);
      if (t) setDock({ type: 'anim', pageId: t.pageId, nodeId: t.nodeId, stateId: t.stateId });
    } else if (d.type === 'page') {
      setDock({ type: 'page', pageId: d.pageId });
    }
  }, []);
  // Started on a tab's mousedown; arms once the pointer is dragged down, docks if released in the zone.
  const startTabTear = React.useCallback((descriptor, e) => {
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('button, input')) return; // leave close/rename alone
    const sy = e.clientY, data = { armed: false };
    tearRef.current = data;
    const move = (ev) => {
      if (!tearRef.current) return;
      if (!data.armed && ev.clientY - sy > 22) { data.armed = true; setTearing(true); document.body.style.userSelect = 'none'; }
    };
    const up = (ev) => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.body.style.userSelect = ''; tearRef.current = null;
      if (data.armed) { setTearing(false); if (ev.clientY > window.innerHeight - 150) openDockFor(descriptor); }
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  }, [openDockFor]);
  const startDockResize = (e) => {
    e.preventDefault();
    const sy = e.clientY, h0 = dockH;
    const move = (ev) => setDockH(Math.max(120, Math.min(520, Math.round(h0 - (ev.clientY - sy)))));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
  };
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
  const animSetDuration = React.useCallback((ms) => { const t = activeAnimRef.current; if (!t) return; setNodes(ns => ns.map(n => n.id === t.nodeId ? { ...n, customStates: (n.customStates || []).map(c => c.id === t.stateId ? { ...c, duration: ms } : c) } : n)); }, [setNodes]);
  const animSetLoopState = React.useCallback((on) => { const t = activeAnimRef.current; if (!t) return; setNodes(ns => ns.map(n => n.id === t.nodeId ? { ...n, customStates: (n.customStates || []).map(c => c.id === t.stateId ? { ...c, loop: on } : c) } : n)); }, [setNodes]);

  // --- Page scene timeline: a whole-screen animation whose tracks each target one node's property. --
  const SCENE_DEFAULT = { on: true, loop: true, autoplay: true, duration: 2000, tracks: [] };
  const mutTimeline = (fn) => setPages(ps => ps.map(p => p.id === activePageIdRef.current
    ? { ...p, timeline: fn({ ...SCENE_DEFAULT, ...(p.timeline || {}) }) } : p));
  const sceneAddTrack = (prop, nodeId, value) => mutTimeline(tl => (tl.tracks.some(tr => tr.nodeId === nodeId && tr.prop === prop) ? tl : { ...tl, tracks: [...tl.tracks, { nodeId, prop, keys: [{ t: 0, value, ease: 'ease-out' }] }] }));
  const sceneDeleteTrack = (ti) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.filter((_, i) => i !== ti) }));
  const sceneAddKey = (ti, t, value) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: [...tr.keys.filter(k => k.t !== t), { t, value, ease: 'ease-out' }] } : tr) }));
  const sceneUpdateKey = (ti, ki, patch) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: tr.keys.map((k, j) => j === ki ? { ...k, ...patch } : k) } : tr) }));
  const sceneDeleteKey = (ti, ki) => mutTimeline(tl => ({ ...tl, tracks: tl.tracks.map((tr, i) => i === ti ? { ...tr, keys: tr.keys.filter((_, j) => j !== ki) } : tr).filter(tr => (tr.keys || []).length) }));
  const sceneSetDuration = (ms) => mutTimeline(tl => ({ ...tl, duration: ms }));
  const sceneSetLoop = (on) => mutTimeline(tl => ({ ...tl, loop: on }));
  const openSceneTimeline = () => { setSceneOpen(s => !s); setActiveAnimId(null); setView('design'); };

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

  const selectOne = React.useCallback((id) => { setSelectedIds(id ? [id] : []); setEditingState('default'); setEditingFrame(null); setActiveAnimId(null); }, []);
  const selectMany = React.useCallback((ids) => { setSelectedIds(ids); setEditingState('default'); setEditingFrame(null); setActiveAnimId(null); }, []);
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

  // Launch a live, chromeless run of the prototype in a new tab (interactions + workflows execute).
  const runApp = () => {
    const u = new URL(window.location.href);
    u.searchParams.set('run', '1');
    window.open(u.toString(), '_blank', 'noopener');
  };
  // In a run tab, start in preview mode so inputs/workflows are live (also seeds the runtime vars).
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

  // Persist project + settings (standalone editor only; project canvases live in the DB)
  React.useEffect(() => {
    if (projectId) return;
    try { localStorage.setItem('lattice_project_v2', JSON.stringify({ project: { pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary, assets }, settings })); } catch {}
  }, [pages, activePageId, workflows, variables, customComponents, customShaders, enabledLibrary, assets, settings, projectId]);

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
      const inDesign = viewRef.current === 'design';
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
  }, [nodes.length, iconSig, view, selectedIds, previewMode, activePageId, pages.length, settingsOpen, shareOpen, editingState, activeAnimId, openAnimTabs.length]);

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

  // Chromeless run mode (?run=1) — just the live prototype, full-window, no editor UI.
  if (runFlag) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
        <PreviewCanvas nodes={viewNodes} connections={connections} artboard={artboard} device={activeDevice}
          onAction={onPreviewAction} runtime={previewRuntime} runtimeProps={runtimeProps} pageTimeline={page.timeline} />
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

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <Topbar
        view={view} setView={setView}
        pageName={page.name}
        projectName={projectName} saving={saving}
        onBack={projectId ? () => { window.location.href = '/ui_kits/lattice-app/#/projects'; } : null}
        onHelp={() => setHelpOpen(true)}
        previewMode={previewMode} onTogglePreview={() => setPreviewMode(v => !v)} onRun={runApp}
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
        {view === 'design' && (
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
                  onReorder={reorderLayer} actions={actions}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Center column: VS Code-style page tabs sit above the view area only, between the panels. */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {view === 'design' && (
            <PageTabs pages={pages} activePageId={activePageId} onSelectPage={selectPage} onAddPage={addPage} onRenamePage={renamePage} onDeletePage={deletePage}
              animTabs={animTabList} activeAnimId={activeAnimId} onSelectAnim={selectAnimTab} onCloseAnim={closeAnimTab} onTearTab={startTabTear}
              onOpenSceneTimeline={openSceneTimeline} sceneActive={showScene} />
          )}
          {animValid ? (
            <TimelineEditor node={animNode} state={window.ensureTracks ? window.ensureTracks(animState) : animState}
              palette={settings.palette || []}
              onAddTrack={animAddTrack} onDeleteTrack={animDeleteTrack}
              onAddKey={animAddKey} onUpdateKey={animUpdateKey} onDeleteKey={animDeleteKey}
              onSetDuration={animSetDuration} onSetLoop={animSetLoopState} />
          ) : showScene ? (
            <TimelineEditor pageMode pageNodes={viewNodes} palette={settings.palette || []}
              state={{ name: 'Scene · ' + page.name, tracks: (page.timeline || {}).tracks || [], duration: (page.timeline || {}).duration || 2000, loop: (page.timeline || {}).loop !== false }}
              onAddTrack={sceneAddTrack} onDeleteTrack={sceneDeleteTrack}
              onAddKey={sceneAddKey} onUpdateKey={sceneUpdateKey} onDeleteKey={sceneDeleteKey}
              onSetDuration={sceneSetDuration} onSetLoop={sceneSetLoop} />
          ) : (
            <>
              {view === 'design' && !previewMode && (
                <Canvas
                  nodes={canvasNodes} connections={connections} settings={settings}
                  artboard={artboard} device={activeDevice}
                  selectedIds={selectedIds} onSelect={selectOne} onSelectMany={selectMany}
                  onUpdateNode={updateNode} onCommitDrag={commitDrag} onInteractStart={onInteractStart}
                  onDropComponent={dropComponent} onAddConnection={addConnection}
                  onAlign={alignNodes} onDistribute={distributeNodes} viewRef={canvasViewRef} actions={actions}
                />
              )}
              {view === 'design' && previewMode && <PreviewCanvas nodes={viewNodes} connections={connections} artboard={artboard} device={activeDevice} onAction={onPreviewAction} runtime={previewRuntime} runtimeProps={runtimeProps} pageTimeline={page.timeline} />}
              {view === 'code' && <CodePanel pages={pages} activePageId={activePageId} assets={assets} onChangeAssets={setAssets} projectName={projectName} settings={settings} />}
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
          {view === 'design' && dockTarget && window.PreviewDock && (
            <window.PreviewDock target={dockTarget} height={dockH} onClose={() => setDock(null)} onResizeStart={startDockResize} />
          )}
        </div>

        {view === 'design' && (
          <Inspector
            width={panelW.right}
            node={animValid ? animNode : inspectorNode}
            onChange={animValid ? updateNode : editNode}
            onBaseChange={updateNode} onRename={renameNode}
            connections={connections} onDelete={deleteNode} onDetach={detachNode}
            onDuplicate={() => selected && duplicateNodes([selected.id])}
            allNodes={viewNodes} onSetParent={setParent}
            responsive={settings.responsive !== false}
            palette={settings.palette || []} pages={pages}
            assets={assets} onAddAsset={addImageAsset}
            workflows={workflows} variables={variables} pageVars={page.vars || []}
            editingState={editingState} onSetEditingState={setEditingStateReset}
            singleSelected={animValid ? true : selectedIds.length === 1}
            frameEditing={false} onOpenAnimEditor={openAnimEditor}
            onApplyPreset={applyPreset} onBindAnim={bindAnim}
            onSaveAsComponent={openSaveAsComponent} onEditShader={openShaderEditor}
            shaderPresets={shaderPresets}
            onResetState={resetState}
            editingFrame={editingFrame} onSetEditingFrame={setEditingFrame}
            onAddCustomState={addCustomState} onUpdateCustomState={updateCustomState} onDeleteCustomState={deleteCustomState}
            onAddFrame={addFrame} onUpdateFrame={updateFrame} onDeleteFrame={deleteFrame}
          />
        )}

        {view === 'design' && resizer('left')}
        {view === 'design' && resizer('right')}
      </div>

      {/* Drop zone shown while dragging a tab down — release here to open the bottom preview dock. */}
      {tearing && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 150, zIndex: 9998, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(to top, color-mix(in srgb, var(--blue-base) 22%, transparent), transparent)',
          borderTop: '2px dashed var(--blue-base)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--surface-raised)',
            border: '1px solid var(--blue-base)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-overlay)' }}>
            <span style={{ color: 'var(--blue-base)', fontSize: 16, lineHeight: 1 }}>↧</span> Drop here to open a preview dock
          </div>
        </div>
      )}

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
        description="Run plugin & animation actions on the current selection.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input autoFocus iconLeft={<i data-lucide="search"></i>} placeholder="Search commands…" size="sm"
            value={cmdQuery} onChange={e => setCmdQuery(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
            {commands.filter(c => (c.label + ' ' + c.group).toLowerCase().includes(cmdQuery.trim().toLowerCase())).map(c => (
              <button key={c.id} type="button" onClick={() => runCommand(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                <span style={{ flex: 1, minWidth: 0 }}>{c.label}<span style={{ color: 'var(--text-disabled)', fontSize: 11, marginLeft: 8 }}>{c.group}</span></span>
                {c.shortcut && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', padding: '1px 6px' }}>{c.shortcut.toUpperCase()}</kbd>}
              </button>
            ))}
            {commands.length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '10px 2px', lineHeight: 1.5 }}>
                No plugins or animations enabled. Enable them in <strong style={{ color: 'var(--text-secondary)' }}>Settings → Assets &amp; Plugins</strong>.
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
window.LatticeApp = LatticeApp;
