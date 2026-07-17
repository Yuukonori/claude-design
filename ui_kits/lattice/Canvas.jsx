/* global React, ContextMenu */
// Center canvas — draggable/resizable node frames with pan, zoom, marquee, drop, connect & align.

const ICON_COLORS = {
  'frame':             '#9B8AFB',
  'rows-3':            '#60A5FA',
  'layout-grid':       '#34D399',
  'type':              '#FB923C',
  'heading':           '#F59E0B',
  'square':            '#F472B6',
  'text-cursor-input': '#2DD4BF',
  'image':             '#A78BFA',
  'minus':             '#94A3B8',
  'sparkles':          '#FBBF24',
  'circle-user':       '#38BDF8',
  'badge':             '#A78BFA',
  'link':              '#60A5FA',
  'chevrons-up-down':  '#2DD4BF',
  'toggle-right':      '#34D399',
  'square-check':      '#4ADE80',
  'list':              '#818CF8',
  'loader':            '#F472B6',
  'chart-column':      '#22D3EE',
};
const nodeColor = (n) => ICON_COLORS[n.icon] || '#9B8AFB';

// Container kinds render as light outlines on the canvas; everything else renders its real UI.
const CONTAINER_KINDS = new Set(['frame', 'stack', 'grid', 'card', 'section']);

// A clipping-mask shape renders as a dashed silhouette on the design canvas (it's invisible in
// Preview/export) so it stays visible & grabbable without painting its own fill over the clip.
function MaskOutline({ node }) {
  const kind = window.kindOf ? window.kindOf(node) : node.kind;
  const stroke = 'rgba(125,178,255,0.95)';
  const base = { position: 'absolute', inset: 0, pointerEvents: 'none' };
  if (window.POLY_KINDS && window.POLY_KINDS.has(kind) && window.shapePoints) {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ ...base, width: '100%', height: '100%', overflow: 'visible' }}>
        <polygon points={window.shapePoints(kind, node)} fill="rgba(125,178,255,0.06)" stroke={stroke}
          strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    );
  }
  const br = kind === 'ellipse' ? '50%' : (window.radiusCss ? window.radiusCss(node) : (node.radius ? node.radius + 'px' : 0));
  return <div style={{ ...base, border: `1.5px dashed ${stroke}`, borderRadius: br, background: 'rgba(125,178,255,0.06)' }} />;
}

// True when node `n` sits fully inside the strictly-larger node `o` — i.e. `o` visually contains it.
const geomContains = (o, n) => n.id !== o.id &&
  n.x >= o.x && n.y >= o.y &&
  n.x + n.w <= o.x + o.w && n.y + n.h <= o.y + o.h &&
  (o.w * o.h) > (n.w * n.h);

function Canvas({ nodes, connections, settings = {}, artboard, device, selectedIds = [], onSelect, onSelectMany, onUpdateNode, onCommitDrag, onInteractStart, onDropComponent, onAddConnection, onAlign, onDistribute, viewRef, apiRef, actions = {}, editingState = 'default', editingStateLabel = '' }) {
  const W = 1600, H = 1000;

  const viewportRef = React.useRef(null);
  // Seed pan/zoom from the App-held ref so the view survives leaving/returning to the canvas
  // (e.g. toggling Preview, which unmounts this component).
  const initView = (viewRef && viewRef.current) ? viewRef.current : { x: 0, y: 0, z: 1 };
  const [transform, setTransform] = React.useState(initView);
  const transformRef = React.useRef(initView);
  React.useEffect(() => { if (viewRef) viewRef.current = transform; }, [transform, viewRef]);

  // First open: centre the artboard in the viewport at 75%. Runs once; a restored (persisted) view
  // or any later pan/zoom is left untouched. `hadSavedView` is captured at mount, before the
  // persist effect above writes viewRef, so a genuine first open is distinguished from a remount.
  const hadSavedView = React.useRef(!!(viewRef && viewRef.current));
  const didInitView = React.useRef(false);
  React.useEffect(() => {
    if (didInitView.current) return;
    if (hadSavedView.current) { didInitView.current = true; return; } // came back with a saved view
    const vp = viewportRef.current;
    if (!vp || !artboard) return;
    const r = vp.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const z = 0.75;
    const t = { z, x: Math.round((r.width - artboard.w * z) / 2), y: Math.round((r.height - artboard.h * z) / 2) };
    transformRef.current = t; setTransform(t);
    didInitView.current = true;
  }, [artboard]);

  const nodesRef = React.useRef(nodes);
  const selectedIdsRef = React.useRef(selectedIds);
  React.useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  React.useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  const dragRef = React.useRef(null);
  const [draggingId, setDraggingId] = React.useState(null);
  const didDragRef = React.useRef(false);
  const spaceRef = React.useRef(false);
  const [spaceHeld, setSpaceHeld] = React.useState(false);
  const [panning, setPanning] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState(null);

  const marqueeRectRef = React.useRef(null);
  const [marqueeRect, setMarqueeRect] = React.useState(null);
  const guidesRef = React.useRef(null);
  const [guides, setGuides] = React.useState(null); // { xs:[canvasX], ys:[canvasY] } while dragging
  const [connectDraft, setConnectDraft] = React.useState(null); // { fromId, x, y }
  const connectDraftRef = React.useRef(null);
  const [menu, setMenu] = React.useState(null); // { x, y, node|null }

  const gridStep = settings.snap ? (settings.gridSize || 8) : 1;

  // Convert a client point to canvas-space coords
  const toCanvas = (clientX, clientY) => {
    const vpRect = viewportRef.current?.getBoundingClientRect();
    if (!vpRect) return { x: 0, y: 0 };
    const { x: tx, y: ty, z } = transformRef.current;
    return { x: (clientX - vpRect.left - tx) / z, y: (clientY - vpRect.top - ty) / z };
  };

  // --- Interaction starters ---
  const startPan = (e) => {
    didDragRef.current = false; // a stationary press stays a click (→ deselect); a drag becomes a pan
    dragRef.current = {
      type: 'pan', startMX: e.clientX, startMY: e.clientY,
      origPanX: transformRef.current.x, origPanY: transformRef.current.y,
    };
    setPanning(true);
    e.preventDefault();
  };

  const startMove = (e, node) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.shiftKey) {
      const set = new Set(selectedIdsRef.current);
      set.has(node.id) ? set.delete(node.id) : set.add(node.id);
      onSelectMany([...set]);
      return;
    }
    // If the press lands anywhere over the current selection — even when another node paints on top
    // — drag the selection rather than grabbing the top node. A plain click (no drag) still selects
    // the top node (handled on mouse-up via `clickSelect`), so you can still click-select what's above.
    const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
    const ptIn = (nn) => nn && !nn.hidden && cx >= nn.x && cx <= nn.x + nn.w && cy >= nn.y && cy <= nn.y + nn.h;
    const overSelection = selectedIdsRef.current.some(id => ptIn(nodesRef.current.find(x => x.id === id)));

    let ids, clickSelect = null;
    if (overSelection) {
      ids = selectedIdsRef.current;
      if (!selectedIdsRef.current.includes(node.id)) clickSelect = node.id; // click-without-drag → select top
    } else {
      if (!selectedIdsRef.current.includes(node.id)) onSelect(node.id);
      ids = selectedIdsRef.current.includes(node.id) && selectedIdsRef.current.length > 1 ? selectedIdsRef.current : [node.id];
    }
    const movable = ids.filter(id => { const nn = nodesRef.current.find(x => x.id === id); return nn && !nn.locked; });
    if (!movable.length) { onSelect(node.id); return; } // selection all locked → just select the top node

    // A parent drags its contents: follow = the moved nodes + every unlocked node that sits fully
    // inside one of them (visual containment) + their explicit child descendants. So moving a card
    // moves the children nested in it.
    const follow = new Set(movable);
    const childMap = {};
    connections.filter(c => c.kind === 'child').forEach(c => { (childMap[c.from] || (childMap[c.from] = [])).push(c.to); });
    const addExplicit = (rootId) => { const st = [rootId]; while (st.length) { const p = st.pop(); (childMap[p] || []).forEach(k => { if (!follow.has(k)) { follow.add(k); st.push(k); } }); } };
    movable.forEach(id => {
      const p = nodesRef.current.find(x => x.id === id);
      if (p) nodesRef.current.forEach(n => { if (!n.locked && geomContains(p, n)) follow.add(n.id); });
      addExplicit(id);
    });
    const allIds = [...follow].filter(id => { const nn = nodesRef.current.find(x => x.id === id); return nn && !nn.locked; });

    const orig = {};
    allIds.forEach(id => { const nn = nodesRef.current.find(x => x.id === id); orig[id] = { x: nn.x, y: nn.y }; });
    // Bounding box of the explicitly-moved nodes — what the smart guides align.
    const mv = movable.map(id => nodesRef.current.find(x => x.id === id)).filter(Boolean);
    const bx = Math.min(...mv.map(n => n.x)), by = Math.min(...mv.map(n => n.y));
    const origBox = { x: bx, y: by, w: Math.max(...mv.map(n => n.x + n.w)) - bx, h: Math.max(...mv.map(n => n.y + n.h)) - by };
    didDragRef.current = false;
    onInteractStart && onInteractStart();
    dragRef.current = {
      type: 'move', ids: allIds, orig, clickSelect, origBox,
      startMX: e.clientX, startMY: e.clientY,
      snapshot: JSON.parse(JSON.stringify(nodesRef.current)),
    };
    setDraggingId(movable[0]);
    e.preventDefault();
  };

  const startResize = (e, node, corner) => {
    if (e.button !== 0 || node.locked) return;
    e.stopPropagation();
    didDragRef.current = false;
    onInteractStart && onInteractStart();
    // Resize the whole selection together when the grabbed node is part of a multi-selection;
    // otherwise just this node. Locked members never resize. We snapshot each member's start
    // geometry + the selection's bounding box, then scale everything into the new box on move.
    const selIds = selectedIdsRef.current || [];
    const ids = (selIds.includes(node.id) && selIds.length > 1)
      ? selIds.filter(id => { const m = nodesRef.current.find(x => x.id === id); return m && !m.locked; })
      : [node.id];
    const geoms = {};
    ids.forEach(id => { const m = nodesRef.current.find(x => x.id === id); if (m) geoms[id] = { x: m.x, y: m.y, w: m.w, h: m.h }; });
    const gs = Object.values(geoms);
    const minX = Math.min(...gs.map(g => g.x)), minY = Math.min(...gs.map(g => g.y));
    const maxX = Math.max(...gs.map(g => g.x + g.w)), maxY = Math.max(...gs.map(g => g.y + g.h));
    dragRef.current = {
      type: 'resize', id: node.id, ids, geoms, corner, lockAspect: !!node.lockAspect,
      startMX: e.clientX, startMY: e.clientY,
      box: { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) },
      snapshot: JSON.parse(JSON.stringify(nodesRef.current)),
    };
    setDraggingId(node.id);
    e.preventDefault();
  };

  const startConnect = (e, node) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragRef.current = { type: 'connect', fromId: node.id };
    const draft = { fromId: node.id, x: node.x + node.w, y: node.y + node.h / 2 };
    connectDraftRef.current = draft;
    setConnectDraft(draft);
    e.preventDefault();
  };

  const startMarquee = (e) => {
    const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
    dragRef.current = { type: 'marquee', startMX: e.clientX, startMY: e.clientY, startCX: cx, startCY: cy };
    marqueeRectRef.current = null;
    didDragRef.current = false;
    e.preventDefault();
  };

  // --- Document-level move/up ---
  React.useEffect(() => {
    const snap = v => Math.round(v / gridStep) * gridStep;

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const rawDx = e.clientX - d.startMX;
      const rawDy = e.clientY - d.startMY;
      if (Math.abs(rawDx) > 3 || Math.abs(rawDy) > 3) didDragRef.current = true;

      if (d.type === 'move') {
        const z = transformRef.current.z;
        // Snap the delta once (not each node) so every follower keeps its exact offset from the parent.
        let sdx = snap(rawDx / z), sdy = snap(rawDy / z);

        // --- Smart guides: align the moved box's edges/centres to the artboard and other nodes.
        // Hold Alt to move freely. Guide snapping wins over the grid on whichever axis it matches.
        let gx = [], gy = [];
        if (!e.altKey && artboard && d.origBox) {
          const b = d.origBox, tol = 6 / z;
          const moving = new Set(d.ids);
          const tX = [0, artboard.w / 2, artboard.w];
          const tY = [0, artboard.h / 2, artboard.h];
          nodesRef.current.forEach(n => {
            if (n.hidden || moving.has(n.id)) return;
            tX.push(n.x, n.x + n.w / 2, n.x + n.w);
            tY.push(n.y, n.y + n.h / 2, n.y + n.h);
          });
          const anchors = (o, size) => [o, o + size / 2, o + size];
          const best = (axisAnchors, targets) => {
            let bd = null;
            for (const a of axisAnchors) for (const t of targets) {
              const delta = t - a;
              if (Math.abs(delta) <= tol && (bd === null || Math.abs(delta) < Math.abs(bd))) bd = delta;
            }
            return bd;
          };
          const dX = best(anchors(b.x + sdx, b.w), tX);
          const dY = best(anchors(b.y + sdy, b.h), tY);
          if (dX !== null) sdx += dX;
          if (dY !== null) sdy += dY;
          // Every target the snapped box now sits exactly on becomes a visible guide.
          const hit = (as, ts) => [...new Set(ts.filter(t => as.some(a => Math.abs(a - t) < 0.5)))];
          gx = hit(anchors(b.x + sdx, b.w), tX);
          gy = hit(anchors(b.y + sdy, b.h), tY);
        }
        const g = (gx.length || gy.length) ? { xs: gx, ys: gy } : null;
        if (JSON.stringify(g) !== JSON.stringify(guidesRef.current)) { guidesRef.current = g; setGuides(g); }

        d.ids.forEach(id => {
          const o = d.orig[id];
          onUpdateNode(id, { x: o.x + sdx, y: o.y + sdy });
        });
      } else if (d.type === 'resize') {
        const z = transformRef.current.z;
        const dx = rawDx / z, dy = rawDy / z;
        const { corner, box } = d;
        const MIN_W = 60, MIN_H = 36;
        // Resize the selection's bounding box off its fixed opposite edge (same math whether the
        // selection is one node or many), then scale every member proportionally into the new box.
        let nx = box.x, ny = box.y, nw = box.w, nh = box.h;
        if (corner.includes('e')) nw = Math.max(MIN_W, snap(box.w + dx));
        if (corner.includes('s')) nh = Math.max(MIN_H, snap(box.h + dy));
        if (corner.includes('w')) { nw = Math.max(MIN_W, snap(box.w - dx)); nx = box.x + box.w - nw; }
        if (corner.includes('n')) { nh = Math.max(MIN_H, snap(box.h - dy)); ny = box.y + box.h - nh; }
        // Lock aspect ratio: on corner handles, drive height from width and re-anchor if needed
        if (d.lockAspect && corner.length === 2 && box.h) {
          nh = Math.max(MIN_H, Math.round(nw * box.h / box.w));
          if (corner.includes('n')) ny = box.y + box.h - nh;
        }
        const sx = nw / box.w, sy = nh / box.h;
        d.ids.forEach(id => {
          const g = d.geoms[id];
          if (!g) return;
          onUpdateNode(id, {
            x: Math.round(nx + (g.x - box.x) * sx),
            y: Math.round(ny + (g.y - box.y) * sy),
            w: Math.max(1, Math.round(g.w * sx)),
            h: Math.max(1, Math.round(g.h * sy)),
          });
        });
      } else if (d.type === 'pan') {
        const nx = d.origPanX + rawDx, ny = d.origPanY + rawDy;
        transformRef.current = { ...transformRef.current, x: nx, y: ny };
        setTransform(t => ({ ...t, x: nx, y: ny }));
      } else if (d.type === 'connect') {
        const { x, y } = toCanvas(e.clientX, e.clientY);
        const draft = { ...connectDraftRef.current, x, y };
        connectDraftRef.current = draft;
        setConnectDraft(draft);
      } else if (d.type === 'marquee') {
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
        const mr = {
          x: Math.min(cx, d.startCX), y: Math.min(cy, d.startCY),
          w: Math.abs(cx - d.startCX), h: Math.abs(cy - d.startCY),
        };
        marqueeRectRef.current = mr;
        setMarqueeRect({ ...mr });
      }
    };

    const onUp = (e) => {
      const d = dragRef.current;
      if (d?.type === 'marquee') {
        const mr = marqueeRectRef.current;
        if (mr && didDragRef.current) {
          const hit = nodesRef.current.filter(n => !n.hidden &&
            n.x < mr.x + mr.w && n.x + n.w > mr.x && n.y < mr.y + mr.h && n.y + n.h > mr.y
          ).map(n => n.id);
          onSelectMany(hit);
        }
        marqueeRectRef.current = null;
        setMarqueeRect(null);
      } else if (d?.type === 'connect') {
        const { x, y } = toCanvas(e.clientX, e.clientY);
        const target = [...nodesRef.current].reverse().find(n => !n.hidden && n.id !== d.fromId &&
          x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h);
        if (target) onAddConnection(d.fromId, target.id, 'child');
        connectDraftRef.current = null;
        setConnectDraft(null);
      } else if (d?.snapshot && didDragRef.current) {
        onCommitDrag(d.snapshot);
      }
      // Pressed over the selection but released without dragging → it was a click: select the top node.
      if (d?.type === 'move' && !didDragRef.current && d.clickSelect) onSelect(d.clickSelect);
      if (guidesRef.current) { guidesRef.current = null; setGuides(null); }
      dragRef.current = null;
      setDraggingId(null);
      setPanning(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [onUpdateNode, onCommitDrag, onSelect, onSelectMany, onAddConnection, gridStep, artboard]);

  // Zoom to `nz`, holding the canvas point under (clientX, clientY) fixed on screen — so the wheel
  // zooms toward the cursor and the +/– buttons zoom toward the viewport centre.
  const zoomToPoint = (nz, clientX, clientY) => {
    const vpRect = viewportRef.current?.getBoundingClientRect();
    if (!vpRect) return;
    const { x, y, z } = transformRef.current;
    const z2 = Math.min(4, Math.max(0.15, nz));
    const mx = clientX - vpRect.left, my = clientY - vpRect.top;
    const t = { z: z2, x: mx - ((mx - x) / z) * z2, y: my - ((my - y) / z) * z2 };
    transformRef.current = t; setTransform(t);
  };

  // --- Scroll-wheel zoom (anchored on the cursor) ---
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomToPoint(transformRef.current.z * factor, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // --- Space key pan cursor ---
  React.useEffect(() => {
    const kd = (e) => {
      // Don't hijack Space while typing in a field (INPUT was excluded before, but TEXTAREA/SELECT/
      // contentEditable — e.g. the AI Helper composer — were not, which swallowed the space character).
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '') || e.target.isContentEditable;
      if (e.code === 'Space' && !e.repeat && !typing) {
        e.preventDefault(); spaceRef.current = true; setSpaceHeld(true);
      } else if (e.code === 'Space' && e.repeat && !typing) e.preventDefault();
    };
    const ku = (e) => { if (e.code === 'Space') { spaceRef.current = false; setSpaceHeld(false); } };
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);
    return () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }, []);

  const adjustZoom = (delta) => {
    const r = viewportRef.current?.getBoundingClientRect();
    zoomToPoint(transformRef.current.z + delta, r ? r.left + r.width / 2 : 0, r ? r.top + r.height / 2 : 0);
  };
  const resetZoom = () => { transformRef.current = { x: 0, y: 0, z: 1 }; setTransform({ x: 0, y: 0, z: 1 }); };
  // Zoom+pan so a bounding box {minX,minY,maxX,maxY} sits centred in the viewport (shared by
  // fit-to-screen and zoom-to-selection).
  const fitBounds = (box) => {
    const vp = viewportRef.current;
    if (!vp || !box) { resetZoom(); return; }
    const bw = Math.max(1, box.maxX - box.minX), bh = Math.max(1, box.maxY - box.minY), pad = 64;
    const vw = vp.clientWidth, vh = vp.clientHeight;
    const z = Math.min(2, Math.max(0.15, Math.min((vw - pad * 2) / bw, (vh - pad * 2) / bh)));
    const x = (vw - bw * z) / 2 - box.minX * z, y = (vh - bh * z) / 2 - box.minY * z;
    transformRef.current = { x, y, z };
    setTransform({ x, y, z });
  };
  const boundsOf = (list) => list.length ? {
    minX: Math.min(...list.map(n => n.x)), minY: Math.min(...list.map(n => n.y)),
    maxX: Math.max(...list.map(n => n.x + n.w)), maxY: Math.max(...list.map(n => n.y + n.h)),
  } : null;
  const fitToScreen = () => { const b = boundsOf(nodesRef.current.filter(n => !n.hidden)); b ? fitBounds(b) : resetZoom(); };
  const zoomToSelection = (ids) => {
    const set = new Set(ids || []);
    const b = boundsOf(nodesRef.current.filter(n => set.has(n.id) && !n.hidden));
    b ? fitBounds(b) : fitToScreen();
  };
  const zoomTo = (pct) => {
    const r = viewportRef.current?.getBoundingClientRect();
    zoomToPoint((pct || 100) / 100, r ? r.left + r.width / 2 : 0, r ? r.top + r.height / 2 : 0);
  };

  // Publish an imperative zoom API for the App's command palette (mirrors how PreviewCanvas
  // publishes its anim controller). Closures read live refs, so a once-per-mount bind stays correct.
  React.useEffect(() => {
    if (!apiRef) return;
    apiRef.current = { fit: fitToScreen, reset: resetZoom, zoomTo, zoomToSelection };
    return () => { apiRef.current = null; };
  }, [apiRef]);

  // --- Drop from library ---
  const onDrop = (e) => {
    e.preventDefault();
    let comp = null;
    try { comp = JSON.parse(e.dataTransfer.getData('application/lattice-component')); } catch {}
    if (!comp || !onDropComponent) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    onDropComponent(comp, x, y);
  };

  // --- Context menu ---
  const parentOf = {};
  connections.filter(c => c.kind === 'child').forEach(c => { parentOf[c.to] = c.from; });
  const openNodeMenu = (e, node) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedIdsRef.current.includes(node.id)) onSelect(node.id);
    setMenu({ x: e.clientX, y: e.clientY, node });
  };
  const openCanvasMenu = (e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, node: null }); };
  const menuItems = () => {
    if (!menu) return [];
    if (menu.node) {
      const n = menu.node;
      const isMaskShape = nodes.some(x => x.maskId === n.id);
      const canMask = selectedIds.length >= 2 && selectedIds.includes(n.id);
      return [
        { label: 'Duplicate', icon: 'copy', shortcut: 'Ctrl+D', onClick: () => actions.duplicate([n.id]) },
        { label: 'Copy', icon: 'clipboard-copy', shortcut: 'Ctrl+C', onClick: () => { onSelect(n.id); actions.copy(); } },
        { label: 'Bring to front', icon: 'bring-to-front', shortcut: 'Ctrl+]', onClick: () => (actions.order ? actions.order('front', [n.id]) : actions.bringToFront(n.id)) },
        { label: 'Bring forward', icon: 'chevron-up', shortcut: ']', onClick: () => actions.order && actions.order('forward', [n.id]) },
        { label: 'Send backward', icon: 'chevron-down', shortcut: '[', onClick: () => actions.order && actions.order('backward', [n.id]) },
        { label: 'Send to back', icon: 'send-to-back', shortcut: 'Ctrl+[', onClick: () => actions.order && actions.order('back', [n.id]) },
        { label: 'Flip horizontal', icon: 'flip-horizontal', onClick: () => actions.flip && actions.flip('h', [n.id]) },
        { label: 'Flip vertical', icon: 'flip-vertical', onClick: () => actions.flip && actions.flip('v', [n.id]) },
        { label: n.locked ? 'Unlock' : 'Lock', icon: n.locked ? 'lock-open' : 'lock', onClick: () => actions.toggleLock(n.id) },
        { label: n.hidden ? 'Show' : 'Hide', icon: n.hidden ? 'eye' : 'eye-off', onClick: () => actions.toggleVisibility(n.id) },
        { label: 'Detach from parent', icon: 'unlink', disabled: !parentOf[n.id], onClick: () => actions.detach(n.id) },
        { label: 'Clipping mask', icon: 'crop', shortcut: 'Ctrl+Alt+M', disabled: !canMask, onClick: () => actions.clipMask && actions.clipMask(selectedIds) },
        ...((isMaskShape || n.maskId) ? [{ label: 'Release mask', icon: 'square-dashed', onClick: () => actions.releaseMask && actions.releaseMask(n.id) }] : []),
        { separator: true },
        { label: 'Delete', icon: 'trash-2', danger: true, shortcut: 'Del', onClick: () => actions.deleteOne(n.id) },
      ];
    }
    return [
      { label: 'Paste', icon: 'clipboard-paste', shortcut: 'Ctrl+V', onClick: () => actions.paste() },
      { label: 'Select all', icon: 'box-select', shortcut: 'Ctrl+A', onClick: () => actions.selectAll() },
      { separator: true },
      { label: 'Reset page', icon: 'rotate-ccw', danger: true, onClick: () => actions.reset() },
    ];
  };

  const HANDLES = [
    { key: 'nw', cursor: 'nw-resize', style: { top: -5, left: -5 } },
    { key: 'n',  cursor: 'n-resize',  style: { top: -5, left: '50%', marginLeft: -4 } },
    { key: 'ne', cursor: 'ne-resize', style: { top: -5, right: -5 } },
    { key: 'e',  cursor: 'e-resize',  style: { top: '50%', right: -5, marginTop: -4 } },
    { key: 'se', cursor: 'se-resize', style: { bottom: -5, right: -5 } },
    { key: 's',  cursor: 's-resize',  style: { bottom: -5, left: '50%', marginLeft: -4 } },
    { key: 'sw', cursor: 'sw-resize', style: { bottom: -5, left: -5 } },
    { key: 'w',  cursor: 'w-resize',  style: { top: '50%', left: -5, marginTop: -4 } },
  ];

  const vpCursor = (draggingId || panning) ? 'grabbing' : spaceHeld ? 'grab' : marqueeRect ? 'crosshair' : 'default';
  const visibleNodes = nodes.filter(n => !n.hidden);
  // Nodes that are acting as clipping masks (referenced by some layer's maskId) render as outlines.
  const maskNodeIds = new Set(nodes.filter(n => n.maskId).map(n => n.maskId));
  const connFrom = connectDraft && nodes.find(n => n.id === connectDraft.fromId);

  return (
    <div
      ref={viewportRef}
      style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative', background: 'var(--bg-void)', cursor: vpCursor }}
      onMouseDown={e => {
        if (e.button === 1 || (e.button === 0 && spaceRef.current)) { startPan(e); return; }
        // Left-drag on the void beyond the canvas content (the viewport itself) pans the camera.
        if (e.button === 0 && e.target === e.currentTarget) startPan(e);
      }}
      onClick={e => { if (e.target === e.currentTarget && !didDragRef.current) onSelect(null); didDragRef.current = false; }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={onDrop}
    >
      <div
        style={{
          position: 'absolute', width: W, height: H,
          transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.z})`,
          transformOrigin: '0 0',
        }}
        onClick={() => { if (!didDragRef.current) onSelect(null); didDragRef.current = false; }}
        onMouseDown={e => {
          if (e.button !== 0 || spaceRef.current) return;
          const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
          // Empty space inside the artboard marquee-selects; the void around it pans the camera.
          if (artboard && cx >= 0 && cy >= 0 && cx <= artboard.w && cy <= artboard.h) startMarquee(e);
          else startPan(e);
        }}
        onContextMenu={openCanvasMenu}
      >
        {/* Device screen — the grid follows this artboard; the void is outside it */}
        {artboard && (
          <div className={settings.showGrid === false ? '' : 'lattice-grid'}
            style={{ position: 'absolute', left: 0, top: 0, width: artboard.w, height: artboard.h, background: settings.showGrid === false ? 'var(--bg-app)' : undefined, border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 0 0 1px rgba(0,0,0,0.4)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -21, left: 0, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', textTransform: 'capitalize', background: 'rgba(9,11,16,0.7)', padding: '1px 5px', borderRadius: 3 }}>
              {device || 'desktop'} · {artboard.w}×{artboard.h}
            </div>
          </div>
        )}

        {/* Connection SVG */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <defs>
            <marker id="arr-child"        markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.25)" />
            </marker>
            <marker id="arr-binds"        markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#60A5FA" />
            </marker>
            <marker id="arr-child-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="white" />
            </marker>
          </defs>
          {connections.map((c, i) => {
            const a = nodes.find(n => n.id === c.from), b = nodes.find(n => n.id === c.to);
            if (!a || !b || a.hidden || b.hidden) return null;
            const x1 = a.x + a.w, y1 = a.y + a.h / 2;
            const x2 = b.x,      y2 = b.y + b.h / 2;
            const mx = (x1 + x2) / 2;
            const active = selectedIds.includes(c.from) || selectedIds.includes(c.to);
            const isChild = c.kind === 'child';
            const stroke = active ? 'rgba(255,255,255,0.8)' : isChild ? 'rgba(255,255,255,0.2)' : '#60A5FA80';
            const markerId = active ? 'arr-child-active' : (isChild ? 'arr-child' : 'arr-binds');
            return (
              <g key={i}>
                <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none" stroke={stroke} strokeWidth={active ? 1.5 : 1}
                  strokeDasharray={isChild ? undefined : '5 3'} markerEnd={`url(#${markerId})`} />
                <circle cx={x2} cy={y2} r="3" fill={stroke} />
              </g>
            );
          })}
          {/* Temp connect line */}
          {connectDraft && connFrom && (
            <path d={`M${connFrom.x + connFrom.w},${connFrom.y + connFrom.h / 2} L${connectDraft.x},${connectDraft.y}`}
              fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 3" />
          )}
        </svg>

        {/* Node frames — WYSIWYG: real component look, chrome only on hover/select */}
        {visibleNodes.map(n => {
          const sel = selectedIds.includes(n.id);
          const color = nodeColor(n);
          const showPort = sel || hoveredId === n.id;
          const kind = window.kindOf ? window.kindOf(n) : 'frame';
          const isContainer = CONTAINER_KINDS.has(kind);
          const isMask = maskNodeIds.has(n.id);
          const maskNode = n.maskId ? nodes.find(m => m.id === n.maskId) : null;
          const clip = maskNode && window.clipPathForMask ? window.clipPathForMask(n, maskNode) : null;
          return (
            <div key={n.id}
              onMouseDown={e => startMove(e, n)}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(h => h === n.id ? null : h)}
              onClick={e => { didDragRef.current = false; e.stopPropagation(); }}
              onContextMenu={e => openNodeMenu(e, n)}
              style={{
                position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h,
                background: 'transparent', boxSizing: 'border-box',
                border: sel
                  ? `1.5px solid ${color}`
                  : hoveredId === n.id
                    ? '1px solid rgba(255,255,255,0.28)'
                    : (isContainer && !(window.hasAppearance && window.hasAppearance(n))) ? '1px solid rgba(255,255,255,0.10)' : 'none',
                boxShadow: sel ? `0 0 0 3px ${color}30` : 'none',
                cursor: n.locked ? 'default' : draggingId === n.id ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
            >
              {/* Real component render — non-interactive so drag stays on the wrapper */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: n.clipContent ? 'hidden' : 'visible', ...(clip ? { clipPath: clip, WebkitClipPath: clip } : null) }}>
                {isMask
                  ? <MaskOutline node={n} />
                  : isContainer && !(n.shader && n.shader.on)
                    ? ((window.fillBg(n) || window.nodeFx(n))
                        ? <div style={{ width: '100%', height: '100%', background: window.fillBg(n) || 'transparent', ...window.nodeFx(n) }} />
                        : null)
                    : (window.PreviewNode ? <window.PreviewNode node={n} /> : n.label)}
              </div>

              {/* Floating label — chrome on hover / selection only. Sits above the node, but flips
                  inside when the node hugs the artboard top so it never collides with the artboard
                  tag or another node's label. A solid pill keeps it legible over anything. */}
              {showPort && (
                <div style={{
                  position: 'absolute', top: n.y <= 20 ? 3 : -18, left: n.y <= 20 ? 4 : 0,
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 10.5, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                  color: sel ? '#fff' : 'rgba(255,255,255,0.75)', pointerEvents: 'none', zIndex: 12,
                  background: 'rgba(9,11,16,0.82)', padding: '1px 5px', borderRadius: 3,
                  boxShadow: sel ? `0 0 0 1px ${color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: color, flex: 'none' }} />
                  <span>{n.name}</span>
                  {n.locked && <span style={{ opacity: 0.55 }}>· locked</span>}
                  <span style={{ opacity: 0.5 }}>{n.w}×{n.h}</span>
                </div>
              )}

              {/* State-preview badge — makes it unmistakable that the selected node is showing a
                  non-default interaction state (not the Default look), so edits here reading as "the
                  default changed" is never a surprise. Sits at the node's top-right, clear of the name. */}
              {sel && editingState !== 'default' && (
                <div style={{
                  position: 'absolute', top: n.y <= 20 ? 22 : -18, right: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10.5, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                  color: '#0a0a0c', pointerEvents: 'none', zIndex: 13,
                  background: 'var(--amber-base, #FB923C)', padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                }}>
                  <i data-lucide="eye" style={{ width: 11, height: 11 }}></i>
                  <span>Previewing: {editingStateLabel || 'state'}</span>
                </div>
              )}

              {/* Output port — drag to connect */}
              {showPort && (
                <span title="Drag to connect" onMouseDown={e => startConnect(e, n)}
                  style={{
                    position: 'absolute', top: '50%', right: -16, marginTop: -5,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#60A5FA', border: '2px solid #0a0a0c',
                    cursor: 'crosshair', zIndex: 11,
                  }} />
              )}

              {/* Resize handles */}
              {sel && !n.locked && HANDLES.map(h => (
                <span key={h.key}
                  style={{
                    position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                    background: '#fff', border: `2px solid ${color}`,
                    boxShadow: `0 0 0 1px rgba(0,0,0,0.4)`,
                    cursor: h.cursor, zIndex: 10, ...h.style,
                  }}
                  onMouseDown={e => startResize(e, n, h.key)}
                />
              ))}
            </div>
          );
        })}

        {/* Smart guides — red alignment lines while dragging (hold Alt to move freely) */}
        {guides && artboard && (() => {
          const t = Math.max(0.5, 1 / transform.z); // keep the line ~1px on screen at any zoom
          const line = { position: 'absolute', background: '#ff3b30', pointerEvents: 'none', zIndex: 25 };
          return (
            <>
              {guides.xs.map((gv, i) => <div key={'gx' + i} style={{ ...line, left: gv - t / 2, top: 0, width: t, height: artboard.h }} />)}
              {guides.ys.map((gv, i) => <div key={'gy' + i} style={{ ...line, left: 0, top: gv - t / 2, width: artboard.w, height: t }} />)}
            </>
          );
        })()}

        {/* Marquee rectangle */}
        {marqueeRect && marqueeRect.w > 2 && marqueeRect.h > 2 && (
          <div style={{
            position: 'absolute',
            left: marqueeRect.x, top: marqueeRect.y, width: marqueeRect.w, height: marqueeRect.h,
            border: '1px solid #60A5FA', background: 'rgba(96, 165, 250, 0.06)',
            pointerEvents: 'none', zIndex: 20,
          }} />
        )}
      </div>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, display: 'flex',
        background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6, overflow: 'hidden', userSelect: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}>
        <button type="button" title="Zoom out" onClick={() => adjustZoom(-0.1)} style={zBtn}>
          <i data-lucide="minus" style={{ width: 13, height: 13 }}></i>
        </button>
        <button type="button" title="Reset zoom" onClick={resetZoom}
          style={{ ...zBtn, width: 54, fontSize: 11, fontFamily: 'var(--font-mono)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          {Math.round(transform.z * 100)}%
        </button>
        <button type="button" title="Zoom in" onClick={() => adjustZoom(0.1)} style={zBtn}>
          <i data-lucide="plus" style={{ width: 13, height: 13 }}></i>
        </button>
        <button type="button" title="Fit to screen" onClick={fitToScreen} style={{ ...zBtn, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <i data-lucide="maximize" style={{ width: 13, height: 13 }}></i>
        </button>
      </div>

      {/* Alignment toolbar — single node aligns within its parent/artboard; 2+ align to each other */}
      {selectedIds.length >= 1 && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 2,
          background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', padding: '0 8px' }}>{selectedIds.length === 1 ? 'align' : selectedIds.length}</span>
          {selectedIds.length === 1 && (
            <>
              <button type="button" title="Center in frame (equal margins)" onClick={() => onAlign(selectedIds, 'center')} style={alignBtn}>
                <i data-lucide="square-dot" style={{ width: 14, height: 14 }}></i>
              </button>
              <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '0 3px' }} />
            </>
          )}
          {[
            ['align-start-vertical', 'left', 'Align left'],
            ['align-center-vertical', 'hcenter', 'Align center'],
            ['align-end-vertical', 'right', 'Align right'],
            ['align-start-horizontal', 'top', 'Align top'],
            ['align-center-horizontal', 'vmiddle', 'Align middle'],
            ['align-end-horizontal', 'bottom', 'Align bottom'],
          ].map(([icon, edge, title]) => (
            <button key={edge} type="button" title={title} onClick={() => onAlign(selectedIds, edge)} style={alignBtn}>
              <i data-lucide={icon} style={{ width: 14, height: 14 }}></i>
            </button>
          ))}
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '0 3px' }} />
          <button type="button" title="Distribute horizontally" disabled={selectedIds.length < 3} onClick={() => onDistribute(selectedIds, 'h')} style={alignBtn}>
            <i data-lucide="align-horizontal-distribute-center" style={{ width: 14, height: 14 }}></i>
          </button>
          <button type="button" title="Distribute vertically" disabled={selectedIds.length < 3} onClick={() => onDistribute(selectedIds, 'v')} style={alignBtn}>
            <i data-lucide="align-vertical-distribute-center" style={{ width: 14, height: 14 }}></i>
          </button>
        </div>
      )}

      <ContextMenu open={!!menu} x={menu?.x || 0} y={menu?.y || 0} items={menuItems()} onClose={() => setMenu(null)} />
    </div>
  );
}

const zBtn = {
  width: 32, height: 30, border: 0, background: 'transparent',
  color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 120ms',
};

const alignBtn = {
  width: 28, height: 28, border: 0, background: 'transparent',
  color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

window.Canvas = Canvas;
