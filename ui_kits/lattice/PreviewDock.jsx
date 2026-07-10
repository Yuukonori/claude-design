/* global React, PreviewNode */
// Bottom preview dock — a compact panel that plays a "torn-off" tab's content without leaving the
// editor. Drag a page/animation tab down to the drop zone (see App) and it docks here. An Animation
// state loops its keyframes live (same frame-cycling + CSS-transition model Preview uses); a page
// shows a scaled static snapshot. Presentational only: no editing, no interactions.

// Scale a fixed bw×bh stage to fit its container (measured), enlarging small components up to 1.5×.
function DockFitBox({ bw, bh, children }) {
  const ref = React.useRef(null);
  const [fit, setFit] = React.useState(1);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const f = Math.min((r.width - 24) / bw, (r.height - 24) / bh, 1.5);
      setFit(f > 0 && isFinite(f) ? f : 1);
    };
    measure();
    let ro; if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
    return () => ro && ro.disconnect();
  }, [bw, bh]);
  return (
    <div ref={ref} style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: bw, height: bh, transform: `scale(${fit})`, flex: 'none' }}>{children}</div>
    </div>
  );
}

// Live playback of a per-property track animation. Runs a real-time clock, always looping (a dock is
// a continuous preview), and samples the node's pose each frame (JS interpolation → no CSS transition).
function DockAnim({ node, state }) {
  const st = window.ensureTracks ? window.ensureTracks(state) : state;
  const dur = Math.max(1, window.stateDuration ? window.stateDuration(st) : 400);
  const [t, setT] = React.useState(0);
  const sig = (st && st.id) + ':' + dur + ':' + (node && node.id);
  React.useEffect(() => {
    let raf; const start = performance.now();
    const step = (now) => { let e = now - start; if (e >= dur) e = dur > 0 ? e % dur : 0; setT(e); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [sig, dur]);
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, [node && node.id]);
  const pose = window.poseAt ? window.poseAt(node, st, t) : node;
  const bw = Math.max(1, node.w || 160), bh = Math.max(1, node.h || 120);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', background: 'var(--bg-app)' }}>
      <style>{'[data-dock-nid],[data-dock-nid] *{transition:none}'}</style>
      <DockFitBox bw={bw} bh={bh}>
        <div data-dock-nid style={{ width: '100%', height: '100%' }}>
          <PreviewNode node={pose} />
        </div>
      </DockFitBox>
    </div>
  );
}

// Static scaled snapshot of a page's nodes (flat absolute layout — a quick glance, not interactive).
function DockPage({ page }) {
  const nodes = (page.nodes || []).filter(n => !n.hidden);
  let pw = 100, ph = 100;
  nodes.forEach(n => { pw = Math.max(pw, (n.x || 0) + (n.w || 0)); ph = Math.max(ph, (n.y || 0) + (n.h || 0)); });
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', background: 'var(--bg-app)' }}>
      <DockFitBox bw={pw} bh={ph}>
        <div style={{ position: 'relative', width: pw, height: ph, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
          {nodes.map(n => (
            <div key={n.id} style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, overflow: n.clipContent ? 'hidden' : 'visible' }}>
              <PreviewNode node={n} />
            </div>
          ))}
        </div>
      </DockFitBox>
    </div>
  );
}

function PreviewDock({ target, height = 220, onClose, onResizeStart }) {
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); },
    [target && target.type, target && target.node && target.node.id, target && target.page && target.page.id]);
  if (!target) return null;
  const isAnim = target.type === 'anim';
  const valid = isAnim ? !!(target.node && target.state) : !!target.page;
  const nFrames = isAnim && target.state ? ((target.state.tracks || []).reduce((m, tr) => Math.max(m, (tr.keys || []).length), 0) || (target.state.frames || []).length) : 0;
  const title = isAnim
    ? ((target.state && target.state.name) || 'Animation') + ' · preview'
    : ((target.page && target.page.name) || 'Page') + ' · preview';
  return (
    <div style={{ flex: 'none', height, borderTop: '1px solid var(--border-default)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {onResizeStart && (
        <div onMouseDown={onResizeStart} title="Drag to resize"
          style={{ height: 6, marginTop: -3, cursor: 'row-resize', flex: 'none', zIndex: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} />
      )}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <i data-lucide={isAnim ? 'film' : 'monitor-play'} style={{ width: 14, height: 14, flex: 'none', color: isAnim ? 'var(--blue-base)' : 'var(--text-secondary)' }}></i>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        {isAnim && valid && <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 'none' }}>· {nFrames} keyframe{nFrames === 1 ? '' : 's'} · loop</span>}
        <button type="button" title="Close preview" onClick={onClose}
          style={{ marginLeft: 'auto', width: 22, height: 22, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 4 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
        </button>
      </div>
      {valid
        ? (isAnim ? <DockAnim node={target.node} state={target.state} /> : <DockPage page={target.page} />)
        : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>This tab is no longer available.</div>}
    </div>
  );
}
window.PreviewDock = PreviewDock;
