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

function geomAt(n, dev) {
  if (dev && dev !== 'desktop' && n.bp && n.bp[dev]) {
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
function withWorkflowDefaults(project) {
  return {
    ...project,
    workflows: project.workflows || [],
    variables: project.variables || [],
    pages: (project.pages || []).map(p => ({ ...p, vars: p.vars || [] })),
  };
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
  const [panelW, setPanelW] = React.useState(() => {                 // resizable side-panel widths (per-user)
    try { return { left: 280, right: 280, ...JSON.parse(localStorage.getItem('lattice_panels') || '{}') }; } catch { return { left: 280, right: 280 }; }
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_panels', JSON.stringify(panelW)); } catch {} }, [panelW]);
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
  // Nodes resolved to the active device's geometry — what the canvas/preview/inspector render.
  const viewNodes = React.useMemo(() => nodes.map(n => ({ ...n, ...geomAt(n, activeDevice) })), [nodes, activeDevice]);
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
    const b = DEVICE[activeDevice] || DEVICE.desktop;
    const lo = Math.max(b.w, b.h), sh = Math.min(b.w, b.h);
    return (orient[activeDevice] || 'landscape') === 'portrait' ? { w: sh, h: lo } : { w: lo, h: sh };
  }, [activeDevice, orient, settings.customSize]);

  const setCustomSize = (w, h) => setSettings(s => ({ ...s, customSize: { w: Math.max(200, Math.round(+w) || 1200), h: Math.max(200, Math.round(+h) || 800) } }));
  const toggleOrientation = () => {
    if (activeDeviceRef.current === 'custom') {
      setSettings(s => { const c = s.customSize || { w: 1200, h: 800 }; return { ...s, customSize: { w: c.h, h: c.w } }; });
    } else {
      setOrient(o => { const d = activeDeviceRef.current; return { ...o, [d]: (o[d] || 'landscape') === 'landscape' ? 'portrait' : 'landscape' }; });
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
        setActiveWorkflowId((c.workflows || [])[0]?.id || null);
        setSelectedIds([]);
        setProjectName(d.project.name || '');
        document.title = (d.project.name || 'Project') + ' — Lattice';
      })
      .catch(() => {})
      .finally(() => { projectLoadedRef.current = true; });
  }, [projectId]);

  // Debounced save of the canvas to the API
  React.useEffect(() => {
    if (!projectId || !projectLoadedRef.current) return;
    setSaving(true);
    const t = setTimeout(() => {
      fetch('/api/projects/' + projectId, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas: { pages, activePageId, workflows, variables } }),
      }).catch(() => {}).finally(() => setSaving(false));
    }, 800);
    return () => clearTimeout(t);
  }, [projectId, pages, activePageId, workflows, variables]);

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

  // Device-aware geometry write: desktop → base props; tablet/mobile → node.bp[device] override.
  const writeGeom = React.useCallback((id, patch) => {
    const dev = activeDeviceRef.current;
    setNodes(ns => ns.map(n => {
      if (n.id !== id) return n;
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
    // Seed a first keyframe (captured from the current look) so the board always opens with Keyframe 1.
    const n = nodesRef.current.find(x => x.id === nodeId);
    const cs = n && (n.customStates || []).find(c => c.id === stateId);
    if (cs && (!cs.frames || cs.frames.length === 0)) {
      const ov = (window.capturePose && window.mergeState) ? window.capturePose(window.mergeState(n, stateId)) : {};
      framesOf(nodeId, stateId, () => [{ id: uid('fr'), dur: 400, ov }]);
    }
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
    const dev = activeDeviceRef.current;
    ids.forEach(id => {
      const n = nodesRef.current.find(x => x.id === id);
      if (n && !n.locked) { const g = geomAt(n, dev); writeGeom(id, { x: g.x + dx, y: g.y + dy }); }
    });
  }, [pushHistory, writeGeom]);

  const toggleVisibility = React.useCallback((id) => {
    const n = nodesRef.current.find(x => x.id === id);
    if (!n) return;
    pushHistory();
    writeGeom(id, { hidden: !geomAt(n, activeDeviceRef.current).hidden });
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
    const dev = activeDeviceRef.current;

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
    const dev = activeDeviceRef.current;
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
    const dev = activeDeviceRef.current;
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
    const n = {
      id, name: c.name, icon: c.icon, kind, x: s.x, y: s.y,
      w, h, layout: 'Flex column', gap: 12,
      synced: false, responsive: true, clipContent: false, locked: false, hidden: false, fillColor: '',
      ...d,
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
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ pages, activePageId, workflows, variables })))).replace(/=/g, '');
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
    try { localStorage.setItem('lattice_project_v2', JSON.stringify({ project: { pages, activePageId, workflows, variables }, settings })); } catch {}
  }, [pages, activePageId, workflows, variables, settings, projectId]);

  // Export / import the whole project as JSON (an editor tool)
  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ pages, activePageId, workflows, variables, settings }, null, 2)], { type: 'application/json' });
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
          onAction={onPreviewAction} runtime={previewRuntime} runtimeProps={runtimeProps} />
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
        artboard={artboard} orientation={orient[activeDevice]}
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
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <PagesPanel pages={pages} activePageId={activePageId} onSelect={selectPage} onAdd={addPage} onRename={renamePage} onDelete={deletePage} />
              <LibraryPanel onPlace={placeNode} />
              <LayersTree
                nodes={viewNodes} connections={connections} selectedIds={selectedIds}
                onSelect={selectOne} onSelectMany={selectMany} onRename={renameNode} onSetParent={setParent}
                onToggleVisibility={toggleVisibility} onToggleLock={toggleLock}
                onReorder={reorderLayer} actions={actions}
              />
            </div>
          </aside>
        )}

        {/* Center column: VS Code-style page tabs sit above the view area only, between the panels. */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PageTabs pages={pages} activePageId={activePageId} onSelectPage={selectPage} onAddPage={addPage} onRenamePage={renamePage} onDeletePage={deletePage}
            animTabs={animTabList} activeAnimId={activeAnimId} onSelectAnim={selectAnimTab} onCloseAnim={closeAnimTab} />
          {animValid ? (
            <AnimCanvas node={animNode} state={animState} activeFrame={animFrameIdx}
              onSelectFrame={setAnimFrameIdx} onAddFrame={animAddFrame} onDeleteFrame={animDeleteFrame}
              onUpdateFrame={animUpdateFrame} onUpdateState={animUpdateState}
              onReorderFrame={animReorderFrame} onTidyUp={animTidyUp} />
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
              {view === 'design' && previewMode && <PreviewCanvas nodes={viewNodes} connections={connections} artboard={artboard} device={activeDevice} onAction={onPreviewAction} runtime={previewRuntime} runtimeProps={runtimeProps} />}
              {view === 'code' && <CodePanel pages={pages} activePageId={activePageId} />}
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
        </div>

        {view === 'design' && (
          <Inspector
            width={panelW.right}
            node={animValid ? animInspectorNode : inspectorNode}
            onChange={animValid ? ((id, patch) => editFrameOv(patch)) : editNode}
            onBaseChange={updateNode} onRename={renameNode}
            connections={connections} onDelete={deleteNode} onDetach={detachNode}
            onDuplicate={() => selected && duplicateNodes([selected.id])}
            allNodes={viewNodes} onSetParent={setParent}
            palette={settings.palette || []} pages={pages}
            workflows={workflows} variables={variables} pageVars={page.vars || []}
            editingState={editingState} onSetEditingState={setEditingStateReset}
            singleSelected={animValid ? true : selectedIds.length === 1}
            frameEditing={animValid} onOpenAnimEditor={openAnimEditor}
            onResetState={resetState}
            editingFrame={editingFrame} onSetEditingFrame={setEditingFrame}
            onAddCustomState={addCustomState} onUpdateCustomState={updateCustomState} onDeleteCustomState={deleteCustomState}
            onAddFrame={addFrame} onUpdateFrame={updateFrame} onDeleteFrame={deleteFrame}
          />
        )}

        {view === 'design' && resizer('left')}
        {view === 'design' && resizer('right')}
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
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Project file</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" fullWidth onClick={exportProject} iconLeft={<i data-lucide="download"></i>}>Export .json</Button>
              <Button variant="outline" size="sm" fullWidth onClick={() => document.getElementById('lt-import').click()} iconLeft={<i data-lucide="upload"></i>}>Import</Button>
              <input id="lt-import" type="file" accept="application/json,.json" title="Import project JSON" onChange={importProject} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!previewDialog} onClose={() => setPreviewDialog(null)} title={previewDialog ? previewDialog.title : ''}
        footer={<Button variant="solid" size="sm" onClick={() => setPreviewDialog(null)}>Close</Button>}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{previewDialog && previewDialog.message ? previewDialog.message : 'Dialog opened from an interaction.'}</div>
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
