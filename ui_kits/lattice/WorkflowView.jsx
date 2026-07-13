/* global React, WORKFLOW_NODE_TYPES, workflowOutPorts, newWorkflowNode, WORKFLOW_COND_OPS */
// Workflow editor — a full-page, n8n-style node board for one project. Three panes:
//   left   · workflow list + variables (global + active page's locals)
//   center · pannable/zoomable node canvas with drag-to-connect ports (mirrors AnimCanvas + Canvas)
//   right  · config form for the selected node
// It only authors data; execution happens in Preview via window.execWorkflow (see WorkflowEngine).

const CARD_W = 214;
const cardH = (n) => { const p = workflowOutPorts(n).length; return p <= 1 ? 60 : 34 + p * 24 + 8; };
const outPortPos = (n, i) => {
  const ports = workflowOutPorts(n), h = cardH(n);
  const y = ports.length <= 1 ? h / 2 : 34 + 14 + i * 24;
  return { x: n.x + CARD_W, y: n.y + y };
};
const inPortPos = (n) => ({ x: n.x, y: n.y + cardH(n) / 2 });

function WorkflowView({
  workflows, activeWorkflowId, onSelectWorkflow, onAddWorkflow, onRenameWorkflow, onDeleteWorkflow, onChangeWorkflow,
  variables, onChangeVariables, pageName, pageVars, onChangePageVars, pages,
}) {
  const { Select, Input, Button, IconButton } = window.LatticeDesignSystem_e801cb;
  const wf = workflows.find(w => w.id === activeWorkflowId) || workflows[0] || null;
  const [selIds, setSelIds] = React.useState([]);
  const selIdsRef = React.useRef(selIds); selIdsRef.current = selIds;
  const selectOnly = (id) => setSelIds(id ? [id] : []);

  // --- board pan / zoom (same model as AnimCanvas) ---
  const vpRef = React.useRef(null);
  const [view, setView] = React.useState({ x: 60, y: 60, z: 1 });
  const viewRef = React.useRef(view); const setV = (nv) => { viewRef.current = nv; setView(nv); };
  const panRef = React.useRef(null);
  const [panning, setPanning] = React.useState(false);
  const [spaceHeld, setSpaceHeld] = React.useState(false); const spaceRef = React.useRef(false);
  // live drags
  const dragRef = React.useRef(null); const movedRef = React.useRef(false);
  const [dragPos, setDragPos] = React.useState(null);          // { ids:[], dx, dy } — live move delta for the whole selection
  const connRef = React.useRef(null); const [conn, setConn] = React.useState(null); // { from, fromPort, x, y }
  const marqRef = React.useRef(null); const [marquee, setMarquee] = React.useState(null); // board-space rect { x, y, w, h }
  const cbRef = React.useRef({}); cbRef.current = { wf, onChangeWorkflow };

  const merged = [...(variables || []).map(v => ({ ...v, scopeLabel: 'Global' })),
                  ...(pageVars || []).map(v => ({ ...v, scopeLabel: pageName || 'Page' }))];
  const varOptions = [{ value: '', label: 'Select variable…' }, ...merged.map(v => ({ value: v.id, label: `${v.name} · ${v.scopeLabel}` }))];
  // `anims` lets the Play-component-animation node offer only the animation states a node actually owns.
  // Disabled states are hidden here — that's all the Enable/disable toggle does: gate workflow-node use.
  const allPageNodes = (pages || []).flatMap(p => (p.nodes || []).map(n => ({
    id: n.id, label: `${p.name} / ${n.name}`,
    anims: (n.customStates || []).filter(c => (c.type || 'static') === 'anim' && (!window.stateEnabled || window.stateEnabled(n, c.id))).map(c => ({ id: c.id, name: c.name })),
  })));

  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });

  const toBoard = (cx, cy) => {
    const r = vpRef.current.getBoundingClientRect(); const v = viewRef.current;
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z };
  };

  const patchWf = (patch) => { const c = cbRef.current; if (c.wf) c.onChangeWorkflow(c.wf.id, patch); };
  const updateNode = (id, patch) => { const c = cbRef.current; if (!c.wf) return; c.onChangeWorkflow(c.wf.id, { nodes: c.wf.nodes.map(n => n.id === id ? { ...n, ...patch } : n) }); };
  const addEdge = (from, fromPort, to) => {
    const c = cbRef.current; if (!c.wf || from === to) return;
    const edges = (c.wf.edges || []).filter(e => !(e.from === from && (e.fromPort || 'next') === fromPort));
    c.onChangeWorkflow(c.wf.id, { edges: [...edges, { id: 'we_' + Math.random().toString(36).slice(2, 7), from, fromPort, to }] });
  };
  const deleteEdge = (id) => patchWf({ edges: (wf.edges || []).filter(e => e.id !== id) });
  const deleteNode = (id) => { patchWf({ nodes: wf.nodes.filter(n => n.id !== id), edges: (wf.edges || []).filter(e => e.from !== id && e.to !== id) }); setSelIds(s => s.filter(x => x !== id)); };
  // Delete a set of nodes at once (the Trigger node is protected — it's the workflow's entry point).
  const deleteNodes = (ids) => {
    const c = cbRef.current; if (!c.wf) return;
    const set = new Set(ids);
    c.onChangeWorkflow(c.wf.id, {
      nodes: c.wf.nodes.filter(n => !set.has(n.id) || n.type === 'trigger'),
      edges: (c.wf.edges || []).filter(e => !set.has(e.from) && !set.has(e.to)),
    });
    setSelIds([]);
  };
  const addNode = (type) => {
    if (!wf) return;
    const r = vpRef.current.getBoundingClientRect(); const v = viewRef.current;
    const x = (r.width / 2 - v.x) / v.z - CARD_W / 2 + (Math.random() * 40 - 20);
    const y = (r.height / 2 - v.y) / v.z - 30 + (Math.random() * 40 - 20);
    const n = newWorkflowNode(type, x, y);
    patchWf({ nodes: [...wf.nodes, n] }); selectOnly(n.id);
  };

  // document-level move/connect/pan listeners (registered once)
  React.useEffect(() => {
    const mm = (e) => {
      const p = panRef.current;
      if (p) { setV({ ...viewRef.current, x: p.x + (e.clientX - p.mx), y: p.y + (e.clientY - p.my) }); return; }
      const d = dragRef.current;
      if (d) {
        const z = viewRef.current.z || 1;
        if (Math.abs(e.clientX - d.mx) + Math.abs(e.clientY - d.my) > 3) movedRef.current = true;
        d.dx = Math.round((e.clientX - d.mx) / z); d.dy = Math.round((e.clientY - d.my) / z);
        setDragPos({ ids: d.ids, dx: d.dx, dy: d.dy }); return;
      }
      const m = marqRef.current;
      if (m) {
        const b = toBoard(e.clientX, e.clientY);
        const rect = { x: Math.min(b.x, m.sx), y: Math.min(b.y, m.sy), w: Math.abs(b.x - m.sx), h: Math.abs(b.y - m.sy) };
        m.rect = rect; if (rect.w + rect.h > 4) m.moved = true;
        setMarquee(rect); return;
      }
      if (connRef.current) { const b = toBoard(e.clientX, e.clientY); connRef.current.x = b.x; connRef.current.y = b.y; setConn({ ...connRef.current }); }
    };
    const mu = (e) => {
      if (panRef.current) { panRef.current = null; setPanning(false); }
      const d = dragRef.current;
      if (d) {
        dragRef.current = null;
        if (movedRef.current && (d.dx || d.dy)) {
          const c = cbRef.current;
          if (c.wf) c.onChangeWorkflow(c.wf.id, { nodes: c.wf.nodes.map(n => d.ids.includes(n.id) ? { ...n, x: n.x + d.dx, y: n.y + d.dy } : n) });
        }
        setDragPos(null);
      }
      const m = marqRef.current;
      if (m) {
        marqRef.current = null; setMarquee(null);
        const c = cbRef.current;
        if (m.moved && m.rect && c.wf) {
          const r = m.rect;
          setSelIds(c.wf.nodes.filter(n => n.x < r.x + r.w && n.x + CARD_W > r.x && n.y < r.y + r.h && n.y + cardH(n) > r.y).map(n => n.id));
        } else {
          setSelIds([]); // click on empty space = deselect
        }
      }
      if (connRef.current) {
        const cn = connRef.current; connRef.current = null; setConn(null);
        const b = toBoard(e.clientX, e.clientY); const c = cbRef.current;
        const hit = c.wf && c.wf.nodes.find(n => n.id !== cn.from && b.x >= n.x && b.x <= n.x + CARD_W && b.y >= n.y && b.y <= n.y + cardH(n));
        if (hit) addEdge(cn.from, cn.fromPort, hit.id);
      }
    };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
  }, []);

  React.useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault(); const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top;
        const z = Math.min(2.5, Math.max(0.3, v.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); const k = z / v.z;
        setV({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, z });
      } else setV({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  React.useEffect(() => {
    const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    const kd = (e) => {
      if (e.code === 'Space' && !typing()) { e.preventDefault(); spaceRef.current = true; setSpaceHeld(true); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing() && selIdsRef.current.length) {
        e.preventDefault(); deleteNodes(selIdsRef.current); return;
      }
      if (e.key === 'Escape' && !typing()) { setSelIds([]); }
    };
    const ku = (e) => { if (e.code === 'Space') { spaceRef.current = false; setSpaceHeld(false); } };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    return () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }, []);

  const startPan = (e) => { panRef.current = { mx: e.clientX, my: e.clientY, x: viewRef.current.x, y: viewRef.current.y }; setPanning(true); e.preventDefault(); };
  // Empty-canvas left-drag = marquee select (like the design board). A press with no drag deselects.
  const startMarquee = (e) => { const b = toBoard(e.clientX, e.clientY); marqRef.current = { sx: b.x, sy: b.y, rect: null, moved: false }; e.preventDefault(); };
  const startCardDrag = (n) => (e) => {
    if (e.button !== 0 || spaceRef.current) return;
    if (e.target.closest && e.target.closest('button, input, select, [data-port]')) return;
    // Dragging a node that isn't selected selects just it; dragging one within a multi-selection moves them all.
    let ids = selIdsRef.current;
    if (!ids.includes(n.id)) { ids = [n.id]; setSelIds(ids); }
    dragRef.current = { ids, mx: e.clientX, my: e.clientY, dx: 0, dy: 0 };
    movedRef.current = false; e.stopPropagation();
  };
  const startConnect = (n, port) => (e) => {
    if (e.button !== 0) return; e.stopPropagation(); e.preventDefault();
    const b = toBoard(e.clientX, e.clientY); connRef.current = { from: n.id, fromPort: port, x: b.x, y: b.y }; setConn({ ...connRef.current });
  };

  const posOf = (n) => (dragPos && dragPos.ids.includes(n.id)) ? { ...n, x: n.x + dragPos.dx, y: n.y + dragPos.dy } : n;
  const bez = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };

  const nodeSummary = (n) => {
    switch (n.type) {
      case 'trigger':  return 'Start of workflow';
      case 'setVar':   { const v = merged.find(x => x.id === n.target); return v ? `${v.name} = ${n.value || '…'}` : 'set a variable'; }
      case 'api':      return `${n.method || 'GET'} ${n.url || '(no url)'}`;
      case 'condition':return `${(n.branches || []).length} branch${(n.branches || []).length === 1 ? '' : 'es'} + else`;
      case 'navigate': { const p = (pages || []).find(x => x.id === n.pageId); return p ? `→ ${p.name}` : 'pick a page'; }
      case 'setProp':  { const t = allPageNodes.find(x => x.id === n.targetNodeId); return t ? `${t.label}.${n.prop}` : 'set a property'; }
      case 'toast':    return n.message || 'show a message';
      case 'playAnim': {
        const t = allPageNodes.find(x => x.id === n.targetNodeId);
        const a = t && (t.anims || []).find(c => c.id === n.animId);
        return a ? `${t.label} · ${a.name}` : 'pick a component + animation';
      }
      case 'playPageAnim': { const p = (pages || []).find(x => x.id === n.pageId); return p ? `↻ ${p.name}` : '↻ current page'; }
      default: return '';
    }
  };

  const sel = (selIds.length === 1 && wf) ? wf.nodes.find(n => n.id === selIds[0]) : null;

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', background: 'var(--bg-app)' }}>
      {/* ---- LEFT: workflows + variables ---- */}
      <aside style={{ width: 250, flex: 'none', borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Group title="Workflows" action={<PlusBtn title="New workflow" onClick={onAddWorkflow} />}>
            {workflows.length === 0 && <Empty>No workflows yet.</Empty>}
            {workflows.map(w => (
              <div key={w.id} onClick={() => onSelectWorkflow(w.id)} style={rowStyle(w.id === activeWorkflowId)}>
                <i data-lucide="workflow" style={{ width: 14, height: 14, flex: 'none', color: 'var(--text-secondary)' }}></i>
                <span style={{ flex: 1, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                <button type="button" title="Rename" onClick={e => { e.stopPropagation(); const nm = prompt('Workflow name', w.name); if (nm) onRenameWorkflow(w.id, nm.trim()); }} style={miniBtn}><i data-lucide="pencil" style={miniIco}></i></button>
                <button type="button" title="Delete" onClick={e => { e.stopPropagation(); if (confirm('Delete workflow “' + w.name + '”?')) onDeleteWorkflow(w.id); }} style={miniBtn}><i data-lucide="trash-2" style={miniIco}></i></button>
              </div>
            ))}
          </Group>

          <VarGroup title="Global variables" vars={variables} onChange={onChangeVariables} />
          <VarGroup title={`Page variables · ${pageName || ''}`} vars={pageVars} onChange={onChangePageVars} />
        </div>
      </aside>

      {/* ---- CENTER: node canvas ---- */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Add node</span>
          {Object.keys(WORKFLOW_NODE_TYPES).filter(t => t !== 'trigger').map(t => (
            <button key={t} type="button" disabled={!wf} onClick={() => addNode(t)} title={WORKFLOW_NODE_TYPES[t].label}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 9px', borderRadius: 5, border: '1px solid var(--border-default)', background: 'transparent', color: wf ? 'var(--text-secondary)' : 'var(--text-disabled)', cursor: wf ? 'pointer' : 'default', fontSize: 11.5 }}>
              <i data-lucide={WORKFLOW_NODE_TYPES[t].icon} style={{ width: 13, height: 13 }}></i>{WORKFLOW_NODE_TYPES[t].label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-disabled)' }}>drag empty area to select · drag a card to move · drag a ● to connect · Del removes · space/middle-drag pans · ⌘/Ctrl+scroll zooms · {Math.round(view.z * 100)}%</span>
        </div>

        <div ref={vpRef} className="lattice-grid"
          onMouseDown={e => { if (e.button === 1 || (e.button === 0 && spaceRef.current)) startPan(e); else if (e.button === 0) startMarquee(e); }}
          style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', cursor: panning ? 'grabbing' : spaceHeld ? 'grab' : marquee ? 'crosshair' : 'default' }}>
          {!wf ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-muted)' }}>
              <i data-lucide="workflow" style={{ width: 26, height: 26, color: 'var(--text-disabled)' }}></i>
              <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, color: 'var(--text-secondary)' }}>No workflow selected</div>
              <Button variant="solid" size="sm" onClick={onAddWorkflow} iconLeft={<i data-lucide="plus"></i>}>New workflow</Button>
            </div>
          ) : (
            <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${view.x}px,${view.y}px) scale(${view.z})`, transformOrigin: '0 0' }}>
              <svg style={{ position: 'absolute', left: -4000, top: -3000, width: 8000, height: 6000, pointerEvents: 'none', overflow: 'visible' }}>
                <defs><marker id="wf-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--border-strong)" /></marker></defs>
                <g transform="translate(4000,3000)">
                  {(wf.edges || []).map(e => {
                    const a = wf.nodes.find(n => n.id === e.from), b = wf.nodes.find(n => n.id === e.to);
                    if (!a || !b) return null;
                    const ports = workflowOutPorts(a); const pi = Math.max(0, ports.findIndex(p => p.port === (e.fromPort || 'next')));
                    const s = outPortPos(posOf(a), pi), t = inPortPos(posOf(b));
                    return <path key={e.id} d={bez(s.x, s.y, t.x, t.y)} fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#wf-arr)"
                      style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onClick={ev => { ev.stopPropagation(); if (confirm('Remove this connection?')) deleteEdge(e.id); }} />;
                  })}
                  {conn && (() => {
                    const a = wf.nodes.find(n => n.id === conn.from); if (!a) return null;
                    const ports = workflowOutPorts(a); const pi = Math.max(0, ports.findIndex(p => p.port === conn.fromPort));
                    const s = outPortPos(posOf(a), pi);
                    return <path d={bez(s.x, s.y, conn.x, conn.y)} fill="none" stroke="var(--blue-base)" strokeWidth="1.5" strokeDasharray="5 4" />;
                  })()}
                </g>
              </svg>

              {marquee && marquee.w > 1 && marquee.h > 1 && (
                <div style={{ position: 'absolute', left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, border: '1px solid var(--blue-base)', background: 'var(--blue-base)18', pointerEvents: 'none', zIndex: 4 }} />
              )}

              {wf.nodes.map(node => {
                const n = posOf(node); const meta = WORKFLOW_NODE_TYPES[n.type] || {}; const ports = workflowOutPorts(n);
                const active = selIds.includes(n.id); const h = cardH(n);
                return (
                  <div key={n.id} onMouseDown={startCardDrag(n)} onClick={e => { e.stopPropagation(); if (!movedRef.current) selectOnly(n.id); }}
                    style={{ position: 'absolute', left: n.x, top: n.y, width: CARD_W, height: h, boxSizing: 'border-box',
                      border: '1px solid ' + (active ? 'var(--blue-base)' : 'var(--border-default)'), borderRadius: 8, background: 'var(--surface)',
                      boxShadow: active ? '0 0 0 2px var(--blue-base)44' : 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.2))', cursor: dragRef.current && dragRef.current.ids.includes(n.id) ? 'grabbing' : 'grab', userSelect: 'none' }}>
                    <div style={{ position: 'absolute', left: -1, top: 8, bottom: 8, width: 3, borderRadius: 3, background: meta.accent || 'var(--border-strong)' }}></div>
                    <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px 0 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <i data-lucide={meta.icon || 'box'} style={{ width: 14, height: 14, color: meta.accent || 'var(--text-secondary)', flex: 'none' }}></i>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.label || n.type}</span>
                      {n.type !== 'trigger' && <button type="button" title="Delete node" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); deleteNode(n.id); }} style={miniBtn}><i data-lucide="x" style={miniIco}></i></button>}
                    </div>
                    <div style={{ padding: '7px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nodeSummary(n)}</div>
                    {/* input port */}
                    {(meta.inputs ?? 1) > 0 && <span data-port style={{ ...portDot, left: -6, top: h / 2 - 6, background: 'var(--surface)' }}></span>}
                    {/* output ports */}
                    {ports.map((p, i) => {
                      const y = ports.length <= 1 ? h / 2 : 34 + 14 + i * 24;
                      return (
                        <React.Fragment key={p.port}>
                          {p.label && <span style={{ position: 'absolute', right: 14, top: y - 8, fontSize: 9.5, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>{p.label}</span>}
                          <span data-port onMouseDown={startConnect(n, p.port)} title="Drag to connect"
                            style={{ ...portDot, left: CARD_W - 6, top: y - 6, background: meta.accent || 'var(--blue-base)', cursor: 'crosshair' }}></span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---- RIGHT: node config ---- */}
      <aside style={{ width: 300, flex: 'none', borderLeft: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {selIds.length > 1 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
            <i data-lucide="boxes" style={{ width: 20, height: 20, color: 'var(--text-secondary)' }}></i>
            <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 18, color: 'var(--text-secondary)' }}>{selIds.length} nodes selected</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>Drag to move them together, or delete them. The Trigger node can’t be deleted.</div>
            <Button variant="danger" size="sm" onClick={() => deleteNodes(selIds)} iconLeft={<i data-lucide="trash-2"></i>}>Delete selected</Button>
          </div>
        ) : !sel ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
            <i data-lucide="settings-2" style={{ width: 20, height: 20, color: 'var(--text-disabled)' }}></i>
            <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 18, color: 'var(--text-secondary)' }}>No node selected</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 190 }}>Select a node to edit it, drag on an empty area to select several, or add one from the toolbar.</div>
          </div>
        ) : (
          <NodeConfig node={sel} onChange={patch => updateNode(sel.id, patch)}
            varOptions={varOptions} merged={merged} pages={pages || []} allPageNodes={allPageNodes} />
        )}
      </aside>
    </div>
  );
}

// ---- node config form ----
function NodeConfig({ node, onChange, varOptions, merged, pages, allPageNodes }) {
  const { Select, Input } = window.LatticeDesignSystem_e801cb;
  const meta = WORKFLOW_NODE_TYPES[node.type] || {};
  const set = (k) => (v) => onChange({ [k]: v });
  const varHint = merged.length ? `Reference variables with {{name}} — e.g. {{${merged[0].name}}}` : 'Create a variable to reference it as {{name}}';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i data-lucide={meta.icon || 'box'} style={{ width: 15, height: 15, color: meta.accent || 'var(--text-secondary)' }}></i>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label || node.type}</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', flex: 1, minHeight: 0 }}>
        {node.type === 'trigger' && <Note>This node runs when a component action “Run workflow” points at this workflow (attach it on a button in the Design tab).</Note>}

        {node.type === 'setVar' && <>
          <Field label="Variable"><Select size="sm" options={varOptions} value={node.target || ''} onChange={e => set('target')(e.target.value)} /></Field>
          <Field label="Value"><Input size="sm" placeholder="{{username}} or literal" value={node.value || ''} onChange={e => set('value')(e.target.value)} /></Field>
          <Note>{varHint}</Note>
        </>}

        {node.type === 'api' && <>
          <Field label="Method"><Select size="sm" options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} value={node.method || 'POST'} onChange={e => set('method')(e.target.value)} /></Field>
          <Field label="URL"><Input size="sm" placeholder="https://api.example.com/login" value={node.url || ''} onChange={e => set('url')(e.target.value)} /></Field>
          <Field label="Headers (JSON)"><TextArea placeholder='{"Content-Type":"application/json"}' value={node.headers || ''} onChange={v => set('headers')(v)} /></Field>
          <Field label="Body (JSON)"><TextArea placeholder='{"username":"{{username}}","password":"{{password}}"}' value={node.body || ''} onChange={v => set('body')(v)} /></Field>
          <Field label="Store response in"><Select size="sm" options={varOptions} value={node.resultVar || ''} onChange={e => set('resultVar')(e.target.value)} /></Field>
          <Note>Then read fields like {'{{resp.status}}'} or {'{{resp.body.token}}'} in later nodes.</Note>
        </>}

        {node.type === 'condition' && <ConditionEditor node={node} onChange={onChange} />}

        {node.type === 'navigate' && (
          <Field label="Go to page"><Select size="sm" options={[{ value: '', label: 'Select page…' }, ...pages.map(p => ({ value: p.id, label: p.name }))]} value={node.pageId || ''} onChange={e => set('pageId')(e.target.value)} /></Field>
        )}

        {node.type === 'setProp' && <>
          <Field label="Component"><Select size="sm" options={[{ value: '', label: 'Select component…' }, ...allPageNodes.map(n => ({ value: n.id, label: n.label }))]} value={node.targetNodeId || ''} onChange={e => set('targetNodeId')(e.target.value)} /></Field>
          <Field label="Property"><Select size="sm" options={['label', 'placeholder', 'inputValue', 'fillColor', 'textColor', 'disabled', 'hidden', 'value']} value={node.prop || 'label'} onChange={e => set('prop')(e.target.value)} /></Field>
          <Field label="Value"><Input size="sm" placeholder="{{resp.body.name}} or literal" value={node.value || ''} onChange={e => set('value')(e.target.value)} /></Field>
        </>}

        {node.type === 'toast' && (
          <Field label="Message"><Input size="sm" placeholder="Welcome, {{username}}!" value={node.message || ''} onChange={e => set('message')(e.target.value)} /></Field>
        )}

        {node.type === 'playAnim' && (() => {
          const target = allPageNodes.find(n => n.id === node.targetNodeId);
          const anims = (target && target.anims) || [];
          return <>
            <Field label="Component">
              <Select size="sm" options={[{ value: '', label: 'Select component…' }, ...allPageNodes.map(n => ({ value: n.id, label: n.label }))]}
                value={node.targetNodeId || ''} onChange={e => onChange({ targetNodeId: e.target.value, animId: '' })} />
            </Field>
            <Field label="Animation">
              <Select size="sm" disabled={!anims.length}
                options={anims.length ? [{ value: '', label: 'Select animation…' }, ...anims.map(a => ({ value: a.id, label: a.name }))] : [{ value: '', label: 'No animations on this component' }]}
                value={node.animId || ''} onChange={e => set('animId')(e.target.value)} />
            </Field>
            <Note>{target && !anims.length
              ? <>“{target.label}” has no animation states. Add one in the Design tab: select it, open <b>Interaction state → ＋ New custom state</b>, set Type to <b>Animation</b>.</>
              : <>Plays the state once. If the animation has <b>Loop</b> on, it keeps looping until another animation plays on this component.</>}</Note>
          </>;
        })()}

        {node.type === 'playPageAnim' && <>
          <Field label="Page"><Select size="sm" options={[{ value: '', label: 'Current page' }, ...pages.map(p => ({ value: p.id, label: p.name }))]} value={node.pageId || ''} onChange={e => set('pageId')(e.target.value)} /></Field>
          <Note>Replays that page's scene timeline from 0 — the one you author with the <b>Page</b> scope in the timeline editor. Picking a different page navigates to it first.</Note>
        </>}
      </div>
    </div>
  );
}

function ConditionEditor({ node, onChange }) {
  const { Select, Input, Button } = window.LatticeDesignSystem_e801cb;
  const branches = node.branches || [];
  const setB = (i, patch) => onChange({ branches: branches.map((b, j) => j === i ? { ...b, ...patch } : b) });
  const add = () => onChange({ branches: [...branches, { left: '', op: '==', right: '' }] });
  const del = (i) => onChange({ branches: branches.filter((_, j) => j !== i) });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {branches.map((b, i) => (
        <div key={i} style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)' }}>{i === 0 ? 'if' : 'else if'} · port {i}</span>
            {branches.length > 1 && <button type="button" title="Remove" onClick={() => del(i)} style={miniBtn}><i data-lucide="x" style={miniIco}></i></button>}
          </div>
          <Input size="sm" placeholder="{{resp.status}}" value={b.left || ''} onChange={e => setB(i, { left: e.target.value })} />
          <Select size="sm" options={WORKFLOW_COND_OPS} value={b.op || '=='} onChange={e => setB(i, { op: e.target.value })} />
          {b.op !== 'truthy' && b.op !== 'empty' && <Input size="sm" placeholder="200" value={b.right || ''} onChange={e => setB(i, { right: e.target.value })} />}
        </div>
      ))}
      <Button variant="outline" size="sm" fullWidth onClick={add} iconLeft={<i data-lucide="plus"></i>}>Add branch</Button>
      <Note>Branches are checked top-to-bottom; the first match takes its port. If none match, the <b>else</b> port is used.</Note>
    </div>
  );
}

// ---- variables panel ----
function VarGroup({ title, vars, onChange }) {
  const { Select, Input } = window.LatticeDesignSystem_e801cb;
  const list = vars || [];
  const add = () => onChange([...list, { id: 'var_' + Math.random().toString(36).slice(2, 7), name: 'var' + (list.length + 1), type: 'string', initial: '' }]);
  const setV = (i, patch) => onChange(list.map((v, j) => j === i ? { ...v, ...patch } : v));
  const del = (i) => onChange(list.filter((_, j) => j !== i));
  return (
    <Group title={title} action={<PlusBtn title="Add variable" onClick={add} />}>
      {list.length === 0 && <Empty>No variables.</Empty>}
      {list.map((v, i) => (
        <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <input value={v.name} onChange={e => setV(i, { name: e.target.value.replace(/\s+/g, '') })} title="Name (referenced as {{name}})"
              style={{ flex: 1, minWidth: 0, height: 26, padding: '0 7px', border: '1px solid var(--border-subtle)', borderRadius: 3, background: 'var(--surface-inset)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }} />
            <button type="button" title="Delete" onClick={() => del(i)} style={miniBtn}><i data-lucide="trash-2" style={miniIco}></i></button>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 84, flex: 'none' }}><Select size="sm" options={['string', 'number', 'boolean']} value={v.type || 'string'} onChange={e => setV(i, { type: e.target.value })} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><Input size="sm" placeholder="initial" value={v.initial ?? ''} onChange={e => setV(i, { initial: e.target.value })} /></div>
          </div>
        </div>
      ))}
    </Group>
  );
}

// ---- little shared UI bits ----
function Group({ title, action, children }) {
  return (
    <div style={{ padding: '12px 12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }) { return <div><div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</div>{children}</div>; }
function Note({ children }) { return <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '7px 9px' }}>{children}</div>; }
function Empty({ children }) { return <div style={{ fontSize: 11.5, color: 'var(--text-disabled)', padding: '2px 0' }}>{children}</div>; }
function PlusBtn({ title, onClick }) { return <button type="button" title={title} onClick={onClick} style={{ ...miniBtn, width: 20, height: 20 }}><i data-lucide="plus" style={{ width: 14, height: 14 }}></i></button>; }
function TextArea({ value, onChange, placeholder }) {
  return <textarea value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} spellCheck={false}
    style={{ width: '100%', minHeight: 58, padding: '7px 8px', border: '1px solid var(--border-subtle)', borderRadius: 4, background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />;
}

const rowStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 5, cursor: 'pointer', background: active ? 'var(--surface-hover)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)' });
const miniBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: 0, borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flex: 'none' };
const miniIco = { width: 13, height: 13 };
const portDot = { position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border-strong)', zIndex: 3 };

window.WorkflowView = WorkflowView;
