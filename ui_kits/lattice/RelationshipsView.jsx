/* global React */
// Relationships view — an interactive explorer for how a page's nodes nest and bind.
//   left/center · a visual dependency board (Graph), an indented nesting Tree, or a Link List
//   right       · a detail panel for the selected node (parent, children, binds in/out, jump to Design)
// Connections are read-only here (editing lives in the Design tab); this surface is for understanding
// and navigation. A connection is { from, to, kind } where kind==='child' is nesting and anything
// else (e.g. 'binds') is a data/action link.
//
// NOTE: every <script type="text/babel"> in this app shares one global scope, so all top-level names
// here are prefixed (Rel* / rel* / REL_*) to avoid colliding with helpers of the same name in sibling
// files (Inspector's Section, WorkflowView's miniBtn, Canvas's zBtn, …).

const REL_NW = 196, REL_NH = 56, REL_COLW = 250, REL_ROWH = 74;

function RelationshipsView({ nodes, connections, onSelect }) {
  const { Button, Badge } = window.LatticeDesignSystem_e801cb;
  const [mode, setMode] = React.useState('graph');          // 'graph' | 'tree' | 'list'
  const [query, setQuery] = React.useState('');
  const [showChild, setShowChild] = React.useState(true);   // show nesting links
  const [showBinds, setShowBinds] = React.useState(true);   // show bind links
  const [selId, setSelId] = React.useState(null);
  const [hoverId, setHoverId] = React.useState(null);
  const [collapsed, setCollapsed] = React.useState({});     // tree: id -> true when collapsed

  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });

  // --- relationship maps -----------------------------------------------------
  const rel = React.useMemo(() => {
    const parentOf = {}, childrenOf = {}, bindsOut = {}, bindsIn = {};
    (connections || []).forEach(c => {
      if (c.kind === 'child') { parentOf[c.to] = c.from; (childrenOf[c.from] = childrenOf[c.from] || []).push(c.to); }
      else { (bindsOut[c.from] = bindsOut[c.from] || []).push(c); (bindsIn[c.to] = bindsIn[c.to] || []).push(c); }
    });
    return { parentOf, childrenOf, bindsOut, bindsIn };
  }, [connections]);
  const nodeById = React.useMemo(() => { const m = {}; (nodes || []).forEach(n => { m[n.id] = n; }); return m; }, [nodes]);
  const nameOf = (id) => (nodeById[id] || {}).name || id;

  // orphan = nothing links to or from it (no parent, no children, no binds either way)
  const isOrphan = (id) => !rel.parentOf[id] && !(rel.childrenOf[id] || []).length && !(rel.bindsOut[id] || []).length && !(rel.bindsIn[id] || []).length;

  // --- layered layout for the graph ------------------------------------------
  const layout = React.useMemo(() => {
    const cols = [], depthOf = {}, visited = new Set();
    const roots = (nodes || []).filter(n => !rel.parentOf[n.id]);
    const queue = roots.map(r => { depthOf[r.id] = 0; return r.id; });
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue; visited.add(id);
      const d = depthOf[id] || 0;
      (cols[d] = cols[d] || []).push(id);
      (rel.childrenOf[id] || []).forEach(cid => { if (depthOf[cid] == null) depthOf[cid] = d + 1; if (!visited.has(cid)) queue.push(cid); });
    }
    (nodes || []).forEach(n => { if (!visited.has(n.id)) { (cols[0] = cols[0] || []).push(n.id); depthOf[n.id] = 0; } });
    const pos = {};
    cols.forEach((ids, d) => ids.forEach((id, i) => { pos[id] = { x: 40 + d * REL_COLW, y: 40 + i * REL_ROWH }; }));
    return { pos, depthOf, cols, maxDepth: Math.max(0, cols.length - 1) };
  }, [nodes, rel]);

  const stats = React.useMemo(() => ({
    nodes: (nodes || []).length,
    nesting: (connections || []).filter(c => c.kind === 'child').length,
    binds: (connections || []).filter(c => c.kind !== 'child').length,
    orphans: (nodes || []).filter(n => isOrphan(n.id)).length,
    depth: layout.maxDepth,
  }), [nodes, connections, layout]);

  // --- search ----------------------------------------------------------------
  const ql = query.trim().toLowerCase();
  const matches = (n) => !ql || (n.name || '').toLowerCase().includes(ql) || (n.kind || '').toLowerCase().includes(ql) || (n.id || '').toLowerCase().includes(ql);
  const subtreeMatches = (id) => {
    if (matches(nodeById[id] || {})) return true;
    return (rel.childrenOf[id] || []).some(subtreeMatches);
  };

  // neighbours of the focused node (for highlight/dim)
  const focusId = hoverId || selId;
  const neighbours = React.useMemo(() => {
    if (!focusId) return null;
    const s = new Set([focusId]);
    if (rel.parentOf[focusId]) s.add(rel.parentOf[focusId]);
    (rel.childrenOf[focusId] || []).forEach(id => s.add(id));
    (rel.bindsOut[focusId] || []).forEach(c => s.add(c.to));
    (rel.bindsIn[focusId] || []).forEach(c => s.add(c.from));
    return s;
  }, [focusId, rel]);

  const sel = selId ? nodeById[selId] : null;

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', background: 'var(--bg-app)' }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* ---- toolbar + stats ---- */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i data-lucide="search" style={{ position: 'absolute', left: 8, width: 13, height: 13, color: 'var(--text-disabled)', pointerEvents: 'none' }}></i>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search nodes…" spellCheck={false}
              style={{ height: 28, width: 180, boxSizing: 'border-box', padding: '0 8px 0 26px', border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--surface-inset)', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <RelFilterChip active={showChild} onClick={() => setShowChild(v => !v)} color="var(--border-strong)" label="Nesting" />
            <RelFilterChip active={showBinds} onClick={() => setShowBinds(v => !v)} color="var(--blue-base)" label="Binds" />
          </div>
          <RelSegmented value={mode} onChange={setMode} options={[
            { value: 'graph', icon: 'network', label: 'Graph' },
            { value: 'tree', icon: 'list-tree', label: 'Tree' },
            { value: 'list', icon: 'list', label: 'List' },
          ]} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center', fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <RelStat n={stats.nodes} label="nodes" />
            <RelStat n={stats.nesting} label="nesting" />
            <RelStat n={stats.binds} label="binds" />
            <RelStat n={stats.orphans} label="orphans" tone={stats.orphans ? 'var(--amber-base)' : undefined} />
            <RelStat n={stats.depth} label="depth" />
          </div>
        </div>

        {/* ---- body ---- */}
        {(nodes || []).length === 0 ? (
          <RelEmptyBoard />
        ) : mode === 'graph' ? (
          <RelGraphBoard nodes={nodes} nodeById={nodeById} rel={rel} layout={layout} matches={matches}
            showChild={showChild} showBinds={showBinds} neighbours={neighbours} focusId={focusId}
            selId={selId} onSelect={setSelId} onHover={setHoverId} onJump={onSelect} />
        ) : mode === 'tree' ? (
          <RelTreeBoard nodes={nodes} nodeById={nodeById} rel={rel} matches={matches} subtreeMatches={subtreeMatches}
            showBinds={showBinds} collapsed={collapsed} setCollapsed={setCollapsed} selId={selId} onSelect={setSelId} nameOf={nameOf} />
        ) : (
          <RelListBoard nodes={nodes} nodeById={nodeById} rel={rel} matches={matches} showChild={showChild} showBinds={showBinds}
            selId={selId} onSelect={setSelId} nameOf={nameOf} />
        )}
      </div>

      {/* ---- detail panel ---- */}
      <RelDetailPanel sel={sel} rel={rel} nodeById={nodeById} nameOf={nameOf}
        onSelect={setSelId} onJump={onSelect} Button={Button} Badge={Badge} isOrphan={isOrphan} />
    </div>
  );
}

// ============================ GRAPH ========================================
function RelGraphBoard({ nodes, nodeById, rel, layout, matches, showChild, showBinds, neighbours, focusId, selId, onSelect, onHover, onJump }) {
  const vpRef = React.useRef(null);
  const [view, setView] = React.useState({ x: 0, y: 0, z: 1 });
  const viewRef = React.useRef(view); const setV = (nv) => { viewRef.current = nv; setView(nv); };
  const panRef = React.useRef(null);
  const [panning, setPanning] = React.useState(false);

  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });

  const fit = React.useCallback(() => {
    const el = vpRef.current; if (!el) return;
    const ids = Object.keys(layout.pos); if (!ids.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach(id => { const p = layout.pos[id]; minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x + REL_NW); maxY = Math.max(maxY, p.y + REL_NH); });
    const r = el.getBoundingClientRect(); const pad = 60;
    const w = maxX - minX + pad * 2, h = maxY - minY + pad * 2;
    const z = Math.min(1.3, Math.max(0.3, Math.min(r.width / w, r.height / h)));
    setV({ x: (r.width - (minX + maxX) * z) / 2, y: (r.height - (minY + maxY) * z) / 2, z });
  }, [layout]);
  React.useEffect(() => { fit(); }, [fit]);

  React.useEffect(() => {
    const mm = (e) => { const p = panRef.current; if (p) setV({ ...viewRef.current, x: p.x + (e.clientX - p.mx), y: p.y + (e.clientY - p.my) }); };
    const mu = () => { if (panRef.current) { panRef.current = null; setPanning(false); } };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
  }, []);
  React.useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault(); const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top;
        const z = Math.min(2.2, Math.max(0.3, v.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); const k = z / v.z;
        setV({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, z });
      } else setV({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  const zoomBy = (f) => { const el = vpRef.current; if (!el) return; const r = el.getBoundingClientRect(); const v = viewRef.current; const px = r.width / 2, py = r.height / 2; const z = Math.min(2.2, Math.max(0.3, v.z * f)); const k = z / v.z; setV({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, z }); };

  const bez = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };
  const edgeColor = (kind) => kind === 'child' ? 'var(--border-strong)' : 'var(--blue-base)';

  return (
    <div ref={vpRef} className="lattice-grid"
      onMouseDown={e => { if (e.button === 0 || e.button === 1) { panRef.current = { mx: e.clientX, my: e.clientY, x: viewRef.current.x, y: viewRef.current.y }; setPanning(true); onSelect(null); } }}
      style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', cursor: panning ? 'grabbing' : 'grab' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${view.x}px,${view.y}px) scale(${view.z})`, transformOrigin: '0 0' }}>
        <svg style={{ position: 'absolute', left: -4000, top: -3000, width: 8000, height: 6000, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <marker id="rel-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--border-strong)" /></marker>
            <marker id="rel-arr-b" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--blue-base)" /></marker>
          </defs>
          <g transform="translate(4000,3000)">
            {relFlattenEdges(rel).filter(c => (c.kind === 'child' ? showChild : showBinds)).map((c, i) => {
              const a = layout.pos[c.from], b = layout.pos[c.to]; if (!a || !b) return null;
              const s = { x: a.x + REL_NW, y: a.y + REL_NH / 2 }, t = { x: b.x, y: b.y + REL_NH / 2 };
              const active = focusId && (c.from === focusId || c.to === focusId);
              const faded = focusId && !active;
              return <path key={i} d={bez(s.x, s.y, t.x, t.y)} fill="none" stroke={edgeColor(c.kind)}
                strokeWidth={active ? 2.2 : 1.5} strokeDasharray={c.kind === 'child' ? 'none' : '5 4'}
                markerEnd={`url(#${c.kind === 'child' ? 'rel-arr' : 'rel-arr-b'})`} style={{ opacity: faded ? 0.15 : 1 }} />;
            })}
          </g>
        </svg>

        {(nodes || []).map(n => {
          const p = layout.pos[n.id]; if (!p) return null;
          const active = selId === n.id;
          const faded = (neighbours && !neighbours.has(n.id)) || !matches(n);
          return (
            <div key={n.id} onMouseEnter={() => onHover(n.id)} onMouseLeave={() => onHover(null)}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onSelect(n.id); }}
              onDoubleClick={e => { e.stopPropagation(); onJump && onJump(n.id); }}
              title="Click to inspect · double-click to open in Design"
              style={{ position: 'absolute', left: p.x, top: p.y, width: REL_NW, height: REL_NH, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
                border: '1px solid ' + (active ? 'var(--blue-base)' : 'var(--border-default)'), borderRadius: 9, background: 'var(--surface-card)',
                boxShadow: active ? '0 0 0 2px var(--blue-base)44' : 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.2))', cursor: 'pointer', opacity: faded ? 0.32 : 1, transition: 'opacity 120ms' }}>
              <i data-lucide={n.icon || 'box'} style={{ width: 16, height: 16, color: 'var(--text-secondary)', flex: 'none' }}></i>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.kind || 'node'}</div>
              </div>
              <span title={n.synced ? 'Synced' : 'Modified'} style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: n.synced ? 'var(--green-base)' : 'var(--amber-base)' }}></span>
            </div>
          );
        })}
      </div>

      {/* zoom controls */}
      <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'flex', gap: 2, background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 7, padding: 2, boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.2))' }}>
        <button type="button" title="Zoom out" onClick={() => zoomBy(1 / 1.15)} style={relZBtn}><i data-lucide="zoom-out" style={{ width: 14, height: 14 }}></i></button>
        <button type="button" title="Reset / fit" onClick={fit} style={{ ...relZBtn, width: 44, fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{Math.round(view.z * 100)}%</button>
        <button type="button" title="Zoom in" onClick={() => zoomBy(1.15)} style={relZBtn}><i data-lucide="zoom-in" style={{ width: 14, height: 14 }}></i></button>
        <button type="button" title="Fit all" onClick={fit} style={relZBtn}><i data-lucide="maximize" style={{ width: 14, height: 14 }}></i></button>
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 14, fontSize: 10, color: 'var(--text-disabled)' }}>drag to pan · ⌘/Ctrl+scroll to zoom · double-click a node to open it</div>
    </div>
  );
}
// flatten the rel maps back into a { from, to, kind } list, so the graph draws from one source of truth
function relFlattenEdges(rel) {
  const out = [];
  Object.keys(rel.childrenOf).forEach(from => rel.childrenOf[from].forEach(to => out.push({ from, to, kind: 'child' })));
  Object.keys(rel.bindsOut).forEach(from => rel.bindsOut[from].forEach(c => out.push({ from, to: c.to, kind: c.kind || 'binds' })));
  return out;
}

// ============================ TREE =========================================
function RelTreeBoard({ nodes, nodeById, rel, matches, subtreeMatches, showBinds, collapsed, setCollapsed, selId, onSelect, nameOf }) {
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  const roots = (nodes || []).filter(n => !rel.parentOf[n.id]);
  const toggle = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  const row = (id, depth) => {
    const n = nodeById[id]; if (!n) return null;
    if (!subtreeMatches(id)) return null;
    const kids = rel.childrenOf[id] || [];
    const binds = rel.bindsOut[id] || [];
    const isCol = collapsed[id];
    const active = selId === id;
    const on = matches(n);
    return (
      <React.Fragment key={id}>
        <div onClick={() => onSelect(id)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', paddingLeft: 10 + depth * 22, borderRadius: 6, cursor: 'pointer',
            background: active ? 'var(--surface-hover)' : 'transparent', opacity: on ? 1 : 0.5 }}>
          {kids.length ? (
            <button type="button" onClick={e => { e.stopPropagation(); toggle(id); }} style={{ ...relMiniBtn, width: 18, height: 18 }} title={isCol ? 'Expand' : 'Collapse'}>
              <i data-lucide={isCol ? 'chevron-right' : 'chevron-down'} style={{ width: 13, height: 13 }}></i>
            </button>
          ) : <span style={{ width: 18, flex: 'none' }} />}
          <i data-lucide={n.icon || 'box'} style={{ width: 15, height: 15, color: 'var(--text-secondary)', flex: 'none' }}></i>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', flex: 'none' }}>{n.name}</span>
          <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>{n.kind || 'node'}</span>
          {showBinds && binds.map((c, i) => (
            <span key={i} onClick={e => { e.stopPropagation(); onSelect(c.to); }} title={`${c.kind}: ${nameOf(c.to)}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, padding: '1px 7px', borderRadius: 10, border: '1px solid var(--blue-base)', color: 'var(--blue-base)', background: 'transparent' }}>
              <i data-lucide="link" style={{ width: 10, height: 10 }}></i>{c.kind}: {nameOf(c.to)}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', flex: 'none', background: n.synced ? 'var(--green-base)' : 'var(--amber-base)' }} title={n.synced ? 'Synced' : 'Modified'}></span>
        </div>
        {!isCol && kids.map(cid => row(cid, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="lattice-grid" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {roots.map(r => row(r.id, 0))}
      </div>
    </div>
  );
}

// ============================ LIST =========================================
function RelListBoard({ nodes, nodeById, rel, matches, showChild, showBinds, selId, onSelect, nameOf }) {
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  const list = (nodes || []).filter(matches);
  return (
    <div className="lattice-grid" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-disabled)', textAlign: 'center', padding: 40 }}>No nodes match your search.</div>}
        {list.map(n => {
          const parent = rel.parentOf[n.id];
          const kids = rel.childrenOf[n.id] || [];
          const bOut = rel.bindsOut[n.id] || [];
          const bIn = rel.bindsIn[n.id] || [];
          const active = selId === n.id;
          return (
            <div key={n.id} onClick={() => onSelect(n.id)}
              style={{ padding: '13px 15px', background: 'var(--surface-card)', border: '1px solid ' + (active ? 'var(--blue-base)' : 'var(--border-subtle)'), borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <i data-lucide={n.icon || 'box'} style={{ width: 16, height: 16, color: 'var(--text-secondary)', flex: 'none' }}></i>
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{n.kind || 'node'} · {n.id}</div>
                </div>
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: n.synced ? 'var(--green-base)' : 'var(--amber-base)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }}></span>{n.synced ? 'Synced' : 'Modified'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
                {showChild && <RelLinkGroup dir="in" label="Parent" items={parent ? [{ id: parent, text: nameOf(parent) }] : []} onSelect={onSelect} />}
                {showChild && <RelLinkGroup dir="out" label="Children" items={kids.map(id => ({ id, text: nameOf(id) }))} onSelect={onSelect} />}
                {showBinds && <RelLinkGroup dir="out" label="Binds out" tone="var(--blue-base)" items={bOut.map(c => ({ id: c.to, text: `${c.kind}: ${nameOf(c.to)}` }))} onSelect={onSelect} />}
                {showBinds && <RelLinkGroup dir="in" label="Binds in" tone="var(--blue-base)" items={bIn.map(c => ({ id: c.from, text: `${c.kind}: ${nameOf(c.from)}` }))} onSelect={onSelect} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function RelLinkGroup({ label, items, onSelect, tone, dir }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-disabled)', marginBottom: 5 }}>{label}</div>
      {items.length === 0 ? <span style={{ fontSize: 11.5, color: 'var(--text-disabled)' }}>—</span> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {items.map((it, i) => (
            <span key={i} onClick={e => { e.stopPropagation(); onSelect(it.id); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                border: '1px solid ' + (tone || 'var(--border-default)'), color: tone || 'var(--text-secondary)', background: 'var(--surface)' }}>
              <i data-lucide={dir === 'in' ? 'arrow-left' : 'arrow-right'} style={{ width: 10, height: 10 }}></i>{it.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================ DETAIL PANEL =================================
function RelDetailPanel({ sel, rel, nodeById, nameOf, onSelect, onJump, Button, Badge, isOrphan }) {
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  if (!sel) {
    return (
      <aside style={relPanelStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
          <i data-lucide="git-fork" style={{ width: 20, height: 20, color: 'var(--text-disabled)' }}></i>
          <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 18, color: 'var(--text-secondary)' }}>No node selected</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>Click a node to see how it nests and binds. Double-click one to open it in the Design tab.</div>
        </div>
      </aside>
    );
  }
  const parent = rel.parentOf[sel.id];
  const kids = rel.childrenOf[sel.id] || [];
  const bOut = rel.bindsOut[sel.id] || [];
  const bIn = rel.bindsIn[sel.id] || [];
  return (
    <aside style={relPanelStyle}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <i data-lucide={sel.icon || 'box'} style={{ width: 16, height: 16, color: 'var(--text-secondary)', flex: 'none' }}></i>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.name}</div>
          <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>{sel.kind || 'node'} · {sel.id}</div>
        </div>
        {Badge ? <Badge tone={sel.synced ? 'success' : 'warning'}>{sel.synced ? 'Synced' : 'Modified'}</Badge>
          : <span style={{ fontSize: 11, color: sel.synced ? 'var(--green-base)' : 'var(--amber-base)' }}>{sel.synced ? 'Synced' : 'Modified'}</span>}
      </div>
      <div style={{ padding: 14, overflow: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isOrphan(sel.id) && <div style={{ fontSize: 11.5, color: 'var(--amber-base)', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '7px 9px' }}>This node has no links — it's an orphan.</div>}
        <RelSection label="Parent" icon="corner-left-up" items={parent ? [{ id: parent, text: nameOf(parent) }] : []} onSelect={onSelect} />
        <RelSection label={`Children (${kids.length})`} icon="corner-down-right" items={kids.map(id => ({ id, text: nameOf(id) }))} onSelect={onSelect} />
        <RelSection label={`Binds out (${bOut.length})`} icon="arrow-right" tone="var(--blue-base)" items={bOut.map(c => ({ id: c.to, text: `${c.kind}: ${nameOf(c.to)}` }))} onSelect={onSelect} />
        <RelSection label={`Binds in (${bIn.length})`} icon="arrow-left" tone="var(--blue-base)" items={bIn.map(c => ({ id: c.from, text: `${c.kind}: ${nameOf(c.from)}` }))} onSelect={onSelect} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
        {Button
          ? <Button variant="solid" size="sm" fullWidth onClick={() => onJump && onJump(sel.id)} iconLeft={<i data-lucide="pencil"></i>}>Open in Design</Button>
          : <button type="button" onClick={() => onJump && onJump(sel.id)} style={{ width: '100%', height: 32, borderRadius: 6, border: 0, background: 'var(--blue-base)', color: '#fff', cursor: 'pointer', fontSize: 12.5 }}>Open in Design</button>}
      </div>
    </aside>
  );
}
function RelSection({ label, icon, items, onSelect, tone }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {items.length === 0 ? <div style={{ fontSize: 11.5, color: 'var(--text-disabled)' }}>None</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((it, i) => (
            <button key={i} type="button" onClick={() => onSelect(it.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', border: '1px solid var(--border-subtle)', borderRadius: 5, background: 'var(--surface-inset)', color: tone || 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, textAlign: 'left' }}>
              <i data-lucide={icon} style={{ width: 13, height: 13, flex: 'none', opacity: 0.8 }}></i>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================ SHARED BITS ==================================
function RelStat({ n, label, tone }) {
  return <span><b style={{ color: tone || 'var(--text-secondary)', fontWeight: 700 }}>{n}</b> <span style={{ color: 'var(--text-disabled)' }}>{label}</span></span>;
}
function RelFilterChip({ active, onClick, color, label }) {
  return (
    <button type="button" onClick={onClick} title={`Toggle ${label} links`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
        border: '1px solid ' + (active ? color : 'var(--border-default)'), background: active ? color + '1f' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: active ? color : 'var(--border-strong)' }}></span>{label}
    </button>
  );
}
function RelSegmented({ value, onChange, options }) {
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 6, overflow: 'hidden' }}>
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} title={o.label}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 11px', border: 0, borderLeft: '1px solid var(--border-default)', cursor: 'pointer', fontSize: 12,
            background: value === o.value ? 'var(--surface-hover)' : 'transparent', color: value === o.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          <i data-lucide={o.icon} style={{ width: 13, height: 13 }}></i>{o.label}
        </button>
      ))}
    </div>
  );
}
function RelEmptyBoard() {
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  return (
    <div className="lattice-grid" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
      <i data-lucide="git-fork" style={{ width: 26, height: 26, color: 'var(--text-disabled)' }}></i>
      <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, color: 'var(--text-secondary)' }}>Nothing to relate yet</div>
      <div style={{ fontSize: 13, maxWidth: 320, textAlign: 'center' }}>Add components on the Design tab — their nesting and binds will show up here.</div>
    </div>
  );
}

const relPanelStyle = { width: 300, flex: 'none', borderLeft: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 };
const relMiniBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: 0, borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flex: 'none' };
const relZBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 24, border: 0, borderRadius: 4, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' };

window.RelationshipsView = RelationshipsView;
