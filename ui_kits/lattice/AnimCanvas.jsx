/* global React, PreviewNode */
// Animation editor — a Figma-style board for one custom "Animation (frames)" state. Keyframes are
// rendered as duplicated copies of the component, joined by arrowed connectors that each carry an
// editable transition duration. Selecting a keyframe routes the right Inspector to edit that frame's
// captured pose (see App `editFrameOv`). Playback lives in Preview; this is authoring.
//
// Layout: cards are absolutely placed. A card with no saved `bx/by` falls back to the tidy auto-row
// (index × pitch), so a fresh board looks ordered; dragging a card stores `bx/by` on the frame and it
// stays where you put it. Position is *presentation only* — playback order is the frame index, changed
// with the ‹ › header buttons. "Tidy up" drops `bx/by` and re-flows the row.
// The board pans (middle-drag / space+drag) and zooms (ctrl/⌘ + wheel) like the design canvas.
const EASES = ['linear', 'ease-out', 'ease-in-out', 'ease-in'];
const CARD_W = 204, CARD_H = 234, HEAD_H = 30, GAP_X = 150;
const autoX = (i) => i * (CARD_W + GAP_X);

function AnimCanvas({ node, state, activeFrame = 0, onSelectFrame, onAddFrame, onDeleteFrame, onUpdateFrame, onUpdateState, onReorderFrame, onTidyUp }) {
  const { Switch } = window.LatticeDesignSystem_e801cb;
  const frames = (state && state.frames) || [];

  const vpRef = React.useRef(null);
  const [view, setView] = React.useState({ x: 40, y: 80, z: 1 });
  const viewRef = React.useRef(view);
  const setV = (nv) => { viewRef.current = nv; setView(nv); };
  const panRef = React.useRef(null);
  const [panning, setPanning] = React.useState(false);
  const [spaceHeld, setSpaceHeld] = React.useState(false);
  const spaceRef = React.useRef(false);
  const didInit = React.useRef(false);
  // Card dragging (free placement). Live position is local; the frame is written once on mouse-up.
  const dragRef = React.useRef(null);
  const movedRef = React.useRef(false);
  const [dragPos, setDragPos] = React.useState(null);
  // Latest callbacks for the document-level listeners (which are registered once).
  const cbRef = React.useRef({});
  cbRef.current = { onUpdateFrame, onSelectFrame };

  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, [frames.length, activeFrame, state && state.id]);

  React.useEffect(() => {
    if (didInit.current || !vpRef.current) return;
    const r = vpRef.current.getBoundingClientRect();
    setV({ x: 40, y: Math.max(24, Math.round((r.height - CARD_H) / 2)), z: 1 });
    didInit.current = true;
  }, []);

  const startPan = (e) => { panRef.current = { mx: e.clientX, my: e.clientY, x: viewRef.current.x, y: viewRef.current.y }; setPanning(true); e.preventDefault(); };

  React.useEffect(() => {
    const mm = (e) => {
      const p = panRef.current;
      if (p) { setV({ ...viewRef.current, x: p.x + (e.clientX - p.mx), y: p.y + (e.clientY - p.my) }); return; }
      const d = dragRef.current;
      if (!d) return;
      const z = viewRef.current.z || 1;
      if (Math.abs(e.clientX - d.mx) + Math.abs(e.clientY - d.my) > 3) movedRef.current = true;
      d.cx = Math.round(d.x0 + (e.clientX - d.mx) / z);
      d.cy = Math.round(d.y0 + (e.clientY - d.my) / z);
      setDragPos({ i: d.i, x: d.cx, y: d.cy });
    };
    const mu = () => {
      if (panRef.current) { panRef.current = null; setPanning(false); }
      const d = dragRef.current;
      if (d) {
        dragRef.current = null;
        if (movedRef.current && cbRef.current.onUpdateFrame) cbRef.current.onUpdateFrame(d.i, { bx: d.cx, by: d.cy });
        setDragPos(null);
      }
    };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
  }, []);

  React.useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
        const z = Math.min(2.5, Math.max(0.25, v.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
        const k = z / v.z;
        setV({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, z });
      } else {
        setV({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  React.useEffect(() => {
    const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    const kd = (e) => { if (e.code === 'Space' && !typing()) { e.preventDefault(); spaceRef.current = true; setSpaceHeld(true); } };
    const ku = (e) => { if (e.code === 'Space') { spaceRef.current = false; setSpaceHeld(false); } };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    return () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }, []);

  // Board-space position of each card: the live drag position, else its saved spot, else the auto-row.
  const posOf = (f, i) => (dragPos && dragPos.i === i)
    ? { x: dragPos.x, y: dragPos.y }
    : { x: f.bx != null ? f.bx : autoX(i), y: f.by != null ? f.by : 0 };
  const pts = frames.map(posOf);

  const startCardDrag = (i, f) => (e) => {
    if (e.button !== 0 || spaceRef.current) return;
    if (e.target.closest && e.target.closest('button, input, select')) return;
    const p = posOf(f, i);
    dragRef.current = { i, mx: e.clientX, my: e.clientY, x0: p.x, y0: p.y, cx: p.x, cy: p.y };
    movedRef.current = false;
    e.stopPropagation();
  };

  const bw = Math.max(1, node.w || 160), bh = Math.max(1, node.h || 120);
  const bodyW = CARD_W - 2, bodyH = CARD_H - 2 - HEAD_H;

  const card = (f, i) => {
    const pose = window.mergeFrame ? window.mergeFrame(node, f) : node;
    const pw = Math.max(1, pose.w || bw), ph = Math.max(1, pose.h || bh);
    const fit = Math.min((bodyW - 16) / pw, (bodyH - 16) / ph, 1);
    const active = i === activeFrame;
    const p = pts[i];
    const nav = (dir) => (e) => { e.stopPropagation(); onReorderFrame && onReorderFrame(i, dir); };
    return (
      <div key={f.id || i}
        onMouseDown={startCardDrag(i, f)}
        onClick={() => { if (!movedRef.current && onSelectFrame) onSelectFrame(i); }}
        style={{
          position: 'absolute', left: p.x, top: p.y, width: CARD_W, height: CARD_H, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', userSelect: 'none',
          cursor: dragRef.current && dragRef.current.i === i ? 'grabbing' : 'grab',
          border: '1px solid ' + (active ? 'var(--blue-base)' : 'var(--border-default)'),
          boxShadow: active ? '0 0 0 2px var(--blue-base)44' : 'none',
          borderRadius: 6, overflow: 'hidden', background: 'var(--surface)', zIndex: active ? 2 : 1,
        }}>
        <div style={{ height: HEAD_H, flex: 'none', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-inset)' }}>
          <i data-lucide="grip-vertical" style={{ width: 12, height: 12, color: 'var(--text-disabled)', flex: 'none' }}></i>
          <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Keyframe {i + 1}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <button type="button" title="Move earlier in the sequence" disabled={i === 0} onMouseDown={e => e.stopPropagation()} onClick={nav(-1)} style={navBtn(i === 0)}>
              <i data-lucide="chevron-left" style={{ width: 12, height: 12 }}></i>
            </button>
            <button type="button" title="Move later in the sequence" disabled={i === frames.length - 1} onMouseDown={e => e.stopPropagation()} onClick={nav(1)} style={navBtn(i === frames.length - 1)}>
              <i data-lucide="chevron-right" style={{ width: 12, height: 12 }}></i>
            </button>
            {frames.length > 1 && (
              <button type="button" title="Delete keyframe" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDeleteFrame && onDeleteFrame(i); }} style={navBtn(false)}>
                <i data-lucide="x" style={{ width: 12, height: 12 }}></i>
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', overflow: 'hidden' }}>
          <div style={{ width: pw, height: ph, transform: `scale(${fit})`, flex: 'none', pointerEvents: 'none' }}>
            <PreviewNode node={pose} />
          </div>
        </div>
      </div>
    );
  };

  // Connector i joins card i-1 → card i and owns the *incoming* frame's duration/easing.
  const connectorPath = (i) => {
    const a = pts[i - 1], b = pts[i];
    const x1 = a.x + CARD_W, y1 = a.y + CARD_H / 2;
    const x2 = b.x, y2 = b.y + CARD_H / 2;
    const mx = (x1 + x2) / 2;
    return { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, cx: mx, cy: (y1 + y2) / 2 };
  };

  const pill = (i) => {
    const f = frames[i] || {};
    const { cx, cy } = connectorPath(i);
    return (
      <div key={'p' + i} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%)', zIndex: 3, display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 999, padding: '2px 6px' }}>
        <input type="number" title="Transition duration (ms)" min={0} value={f.dur ?? 400}
          onChange={e => onUpdateFrame && onUpdateFrame(i, { dur: Math.max(0, +e.target.value || 0) })}
          style={{ width: 46, height: 18, border: 0, background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', outline: 'none', MozAppearance: 'textfield' }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ms</span>
        <select title="Easing" value={f.ease || 'linear'} onChange={e => onUpdateFrame && onUpdateFrame(i, { ease: e.target.value })}
          style={{ height: 18, border: 0, borderLeft: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', fontSize: 10, outline: 'none', cursor: 'pointer', paddingLeft: 4 }}>
          {EASES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
    );
  };

  const maxRight = pts.length ? Math.max(...pts.map(p => p.x + CARD_W)) : 0;
  const addPos = { x: pts.length ? maxRight + 44 : 0, y: pts.length ? pts[pts.length - 1].y : 0 };
  const freePlaced = frames.some(f => f.bx != null || f.by != null);

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <i data-lucide="film" style={{ width: 15, height: 15, color: 'var(--text-secondary)', flex: 'none' }}></i>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(state && state.name) || 'Animation'}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 'none' }}>· {frames.length} keyframe{frames.length === 1 ? '' : 's'}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 10, color: 'var(--text-disabled)', whiteSpace: 'nowrap' }}>Drag a card to move · ‹ › reorders · middle-drag/space pans · ⌘/Ctrl+scroll zooms · {Math.round(view.z * 100)}%</span>
          <button type="button" title="Re-flow the cards into a tidy row" disabled={!freePlaced} onClick={() => onTidyUp && onTidyUp()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 8px', borderRadius: 4, border: '1px solid var(--border-default)', background: 'transparent', color: freePlaced ? 'var(--text-secondary)' : 'var(--text-disabled)', cursor: freePlaced ? 'pointer' : 'default', fontSize: 11 }}>
            <i data-lucide="layout-grid" style={{ width: 12, height: 12 }}></i> Tidy up
          </button>
          <Switch label="Loop" checked={!!(state && state.loop)} onChange={on => onUpdateState && onUpdateState({ loop: on })} />
        </div>
      </div>

      <div ref={vpRef} className="lattice-grid"
        onMouseDown={e => { if (e.button === 1 || (e.button === 0 && spaceRef.current)) startPan(e); }}
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', cursor: panning ? 'grabbing' : spaceHeld ? 'grab' : 'default' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${view.x}px,${view.y}px) scale(${view.z})`, transformOrigin: '0 0' }}>
          {/* Connectors. Oversized + offset so paths at negative board coords still draw. */}
          <svg style={{ position: 'absolute', left: -4000, top: -3000, width: 8000, height: 6000, pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <marker id="anim-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--border-strong)" />
              </marker>
            </defs>
            <g transform="translate(4000,3000)">
              {frames.map((f, i) => i === 0 ? null : (
                <path key={'c' + i} d={connectorPath(i).d} fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#anim-arr)" />
              ))}
            </g>
          </svg>

          {frames.map(card)}
          {frames.map((f, i) => (i === 0 ? null : pill(i)))}

          {frames.length === 0 && (
            <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 13, color: 'var(--text-disabled)' }}>No keyframes yet — add one to begin.</div>
          )}

          <button type="button" title="Add keyframe (duplicate last)" onMouseDown={e => e.stopPropagation()} onClick={() => onAddFrame && onAddFrame()}
            style={{ position: 'absolute', left: addPos.x, top: addPos.y, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: 120, height: CARD_H, boxSizing: 'border-box', border: '1.5px dashed var(--border-strong)', borderRadius: 6, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <i data-lucide="plus" style={{ width: 22, height: 22 }}></i>
            <span style={{ fontSize: 12 }}>Add keyframe</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function navBtn(disabled) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18,
    border: 0, borderRadius: 3, background: 'transparent', flex: 'none',
    color: disabled ? 'var(--text-disabled)' : 'var(--text-muted)', cursor: disabled ? 'default' : 'pointer',
  };
}
window.AnimCanvas = AnimCanvas;
