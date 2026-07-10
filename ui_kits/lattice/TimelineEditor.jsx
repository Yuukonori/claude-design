/* global React, PreviewNode, ColorField */
// Dope-sheet timeline editor — a per-property keyframe editor (Blender/Godot flavour). Each animatable
// property is a horizontal TRACK; keyframes are diamonds placed on a shared time ruler. A draggable
// playhead scrubs; transport controls play/pause/loop; a stage on the left shows the component sampled
// at the playhead (with optional onion-skin ghosts). Works for a component animation state (default)
// or a page scene (pageMode: tracks carry a nodeId, the stage renders the whole page).
//
// Data it edits lives in `state.tracks = [{ prop, nodeId?, keys:[{ t, value, ease }] }]` with
// `state.duration` / `state.loop`. All mutations flow through the callbacks so App owns the state.

const TL_PROP_LABELS = {
  scale: 'Scale', rotation: 'Rotation', opacity: 'Opacity', x: 'X', y: 'Y', w: 'Width', h: 'Height',
  skewX: 'Skew X', skewY: 'Skew Y', radius: 'Radius', borderWidth: 'Border width',
  fillColor: 'Fill', textColor: 'Text color', borderColor: 'Border color',
};
const TL_COLOR = new Set(['fillColor', 'textColor', 'borderColor']);
const TL_EASES = ['linear', 'ease-out', 'ease-in-out', 'ease-in'];
// Sensible base value for a fresh key when the node/track has nothing to sample.
const TL_DEFAULT = { scale: 100, rotation: 0, opacity: 100, x: 0, y: 0, skewX: 0, skewY: 0, radius: 0, borderWidth: 1, fillColor: '#4f46e5', textColor: '#e5e7eb', borderColor: '#3a3a3a' };

function tlPropOptions(pageMode) {
  const nums = ['scale', 'rotation', 'opacity', 'skewX', 'skewY', 'w', 'h', 'radius', 'borderWidth'];
  const list = pageMode ? ['x', 'y'].concat(nums) : nums;
  return list.concat(['fillColor', 'textColor', 'borderColor']);
}

function TimelineEditor({ node, state, pageMode = false, pageNodes = [], palette = [],
  onAddTrack, onDeleteTrack, onAddKey, onUpdateKey, onDeleteKey, onSetDuration, onSetLoop }) {
  const { Select, Switch, Button, Input } = window.LatticeDesignSystem_e801cb;
  const tracks = (state && state.tracks) || [];
  const duration = Math.max(1, (state && state.duration) || (window.tracksDuration ? window.tracksDuration(tracks) : 0) || 1000);

  const [playhead, setPlayhead] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [sel, setSel] = React.useState(null);        // { ti, ki } selected keyframe
  const [zoom, setZoom] = React.useState(0.35);      // px per ms
  const [onion, setOnion] = React.useState(false);
  const [addProp, setAddProp] = React.useState('');
  const [addNode, setAddNode] = React.useState('');
  const rafRef = React.useRef(0);
  const dragRef = React.useRef(null);
  const laneRef = React.useRef(null);

  const px = (t) => t * zoom;
  const laneW = px(duration) + 40;
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });

  // Playback — advance the playhead in real time, loop if the state loops, else stop at the end.
  React.useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const step = (now) => {
      const dt = now - last; last = now;
      setPlayhead(p => {
        let n = p + dt;
        if (n >= duration) { if (state && state.loop) n = n % duration; else { n = duration; setPlaying(false); } }
        return n;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration, state && state.loop]);

  // Drag a keyframe in time, or scrub the playhead. Registered once; reads latest via refs.
  React.useEffect(() => {
    const mm = (e) => {
      const d = dragRef.current; if (!d) return;
      const rect = laneRef.current ? laneRef.current.getBoundingClientRect() : { left: 0 };
      const t = Math.max(0, Math.round((e.clientX - rect.left + (laneRef.current ? laneRef.current.scrollLeft : 0)) / zoom));
      if (d.type === 'play') { setPlayhead(Math.min(duration, t)); return; }
      if (d.type === 'key') { d.moved = true; onUpdateKey && onUpdateKey(d.ti, d.ki, { t: Math.min(duration, t) }); }
    };
    const mu = () => { dragRef.current = null; };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
  }, [zoom, duration, onUpdateKey]);

  // Node the stage/adds target (page mode: the picked node; component mode: the state's node).
  const targetNode = pageMode ? (pageNodes.find(n => n.id === addNode) || pageNodes[0] || node) : node;
  const sampleAt = (n, t) => {
    const ntracks = pageMode ? tracks.filter(tr => tr.nodeId === (n && n.id)) : tracks;
    return window.sampleTracks ? { ...n, ...window.sampleTracks(ntracks, t) } : n;
  };

  const addTrack = () => {
    if (!addProp || !onAddTrack) return;
    const nid = pageMode ? (addNode || (pageNodes[0] && pageNodes[0].id)) : null;
    const base = targetNode && targetNode[addProp];
    const value = base != null && base !== '' ? base : (TL_DEFAULT[addProp] != null ? TL_DEFAULT[addProp] : 0);
    onAddTrack(addProp, nid, value);
    setAddProp('');
  };
  // Add a key at the current playhead, sampling the track's value there (so it lands "on the line").
  const addKeyAt = (ti) => {
    const tr = tracks[ti]; if (!tr || !onAddKey) return;
    const v = window.sampleTrack ? window.sampleTrack(tr, playhead) : undefined;
    const value = v !== undefined ? v : (targetNode && targetNode[tr.prop]) ?? TL_DEFAULT[tr.prop] ?? 0;
    onAddKey(ti, Math.round(playhead), value);
  };

  const selTrack = sel ? tracks[sel.ti] : null;
  const selKey = selTrack ? (selTrack.keys || [])[sel.ki] : null;

  const fmt = (ms) => (ms / 1000).toFixed(2) + 's';
  const ticks = [];
  for (let t = 0; t <= duration; t += Math.max(50, Math.round(duration / 10 / 50) * 50)) ticks.push(t);

  const bw = Math.max(1, (targetNode && targetNode.w) || 160), bh = Math.max(1, (targetNode && targetNode.h) || 120);

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      {/* Transport bar */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
        <i data-lucide="film" style={{ width: 15, height: 15, color: 'var(--text-secondary)', flex: 'none' }}></i>
        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{(state && state.name) || 'Animation'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button type="button" title="Restart" onClick={() => { setPlayhead(0); setPlaying(true); }} style={tlBtn}><i data-lucide="skip-back" style={tlIco}></i></button>
          <button type="button" title={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(p => !p)} style={tlBtn}><i data-lucide={playing ? 'pause' : 'play'} style={tlIco}></i></button>
          <button type="button" title="Stop" onClick={() => { setPlaying(false); setPlayhead(0); }} style={tlBtn}><i data-lucide="square" style={tlIco}></i></button>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 96 }}>{fmt(playhead)} / {fmt(duration)}</span>
        <label style={tlField}>Duration
          <input type="number" min={50} step={50} value={Math.round(duration)} onChange={e => onSetDuration && onSetDuration(Math.max(50, +e.target.value || 0))} style={tlNum} />ms
        </label>
        <Switch label="Loop" checked={!!(state && state.loop)} onChange={on => onSetLoop && onSetLoop(on)} />
        <Switch label="Onion" checked={onion} onChange={setOnion} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" title="Zoom out" onClick={() => setZoom(z => Math.max(0.08, z / 1.3))} style={tlBtn}><i data-lucide="minus" style={tlIco}></i></button>
          <button type="button" title="Zoom in" onClick={() => setZoom(z => Math.min(3, z * 1.3))} style={tlBtn}><i data-lucide="plus" style={tlIco}></i></button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {pageMode && (
            <Select size="sm" value={addNode} onChange={e => setAddNode(e.target.value)} wrapStyle={{ width: 130 }}
              options={[{ value: '', label: 'Node…' }].concat(pageNodes.map(n => ({ value: n.id, label: n.name })))} />
          )}
          <Select size="sm" value={addProp} onChange={e => setAddProp(e.target.value)} wrapStyle={{ width: 130 }}
            options={[{ value: '', label: 'Add track…' }].concat(tlPropOptions(pageMode).map(p => ({ value: p, label: TL_PROP_LABELS[p] || p })))} />
          <Button size="sm" variant="outline" disabled={!addProp} onClick={addTrack} iconLeft={<i data-lucide="plus"></i>}>Track</Button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Stage preview */}
        <div style={{ flex: 'none', width: 260, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <TLStage bw={bw} bh={bh}>
              {onion && [0.25, 0.5, 0.75].map(f => (
                <div key={f} style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
                  {pageMode ? <TLScene nodes={pageNodes} sample={(n) => sampleAt(n, duration * f)} />
                    : <PreviewNode node={sampleAt(targetNode, duration * f)} />}
                </div>
              ))}
              {pageMode ? <TLScene nodes={pageNodes} sample={(n) => sampleAt(n, playhead)} />
                : <PreviewNode node={sampleAt(targetNode, playhead)} />}
            </TLStage>
          </div>
          {selKey && (
            <div style={{ flex: 'none', borderTop: '1px solid var(--border-subtle)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Keyframe · {TL_PROP_LABELS[selTrack.prop] || selTrack.prop}</div>
              {TL_COLOR.has(selTrack.prop) ? (
                <ColorField value={selKey.value} onChange={v => onUpdateKey(sel.ti, sel.ki, { value: v })} palette={palette} />
              ) : (
                <input type="number" value={selKey.value} onChange={e => onUpdateKey(sel.ti, sel.ki, { value: +e.target.value || 0 })} style={tlNum2} />
              )}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@{Math.round(selKey.t)}ms</span>
                <select value={selKey.ease || 'ease-out'} onChange={e => onUpdateKey(sel.ti, sel.ki, { ease: e.target.value })} style={tlSelect}>
                  {TL_EASES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <button type="button" title="Delete keyframe" onClick={() => { onDeleteKey(sel.ti, sel.ki); setSel(null); }} style={{ ...tlBtn, marginLeft: 'auto', color: 'var(--status-danger-fg)' }}><i data-lucide="trash-2" style={tlIco}></i></button>
              </div>
            </div>
          )}
        </div>

        {/* Dope sheet: one vertical scroll, a fixed label column + horizontally-scrolling lanes. */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', display: 'flex' }}>
          {/* Label column */}
          <div style={{ flex: 'none', width: 132, borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
            <div style={{ height: 24, boxSizing: 'border-box', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Tracks</div>
            {tracks.map((tr, ti) => {
              const nn = pageMode ? (pageNodes.find(n => n.id === tr.nodeId) || {}).name : null;
              return (
                <div key={ti} style={{ height: 30, boxSizing: 'border-box', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px', fontSize: 11 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{nn ? nn + ' · ' : ''}{TL_PROP_LABELS[tr.prop] || tr.prop}</span>
                  <button type="button" title="Add key at playhead" onClick={() => addKeyAt(ti)} style={tlBtn}><i data-lucide="plus" style={tlIco}></i></button>
                  <button type="button" title="Delete track" onClick={() => { onDeleteTrack && onDeleteTrack(ti); setSel(null); }} style={tlBtn}><i data-lucide="x" style={tlIco}></i></button>
                </div>
              );
            })}
          </div>
          {/* Lanes (horizontal scroll) */}
          <div ref={laneRef} style={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
            <div style={{ position: 'relative', width: laneW }}>
              {/* Ruler — click/drag to scrub the playhead */}
              <div onMouseDown={e => { dragRef.current = { type: 'play' }; const rect = laneRef.current.getBoundingClientRect(); setPlayhead(Math.max(0, Math.min(duration, Math.round((e.clientX - rect.left + laneRef.current.scrollLeft) / zoom)))); }}
                style={{ height: 24, boxSizing: 'border-box', background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)', cursor: 'ew-resize', position: 'relative' }}>
                {ticks.map(t => (
                  <div key={t} style={{ position: 'absolute', left: px(t), top: 0, height: '100%', borderLeft: '1px solid var(--border-subtle)', paddingLeft: 3, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>{Math.round(t)}</div>
                ))}
              </div>
              {/* Playhead line spanning all lanes */}
              <div style={{ position: 'absolute', left: px(playhead), top: 0, bottom: 0, width: 1, background: 'var(--blue-base)', zIndex: 3, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, left: -4, width: 9, height: 9, background: 'var(--blue-base)', clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
              </div>
              {tracks.length === 0 && (
                <div style={{ padding: 24, fontSize: 13, color: 'var(--text-disabled)' }}>No tracks yet — add one (Scale, Opacity, Fill…) to start keyframing.</div>
              )}
              {tracks.map((tr, ti) => (
                <div key={ti} style={{ position: 'relative', height: 30, boxSizing: 'border-box', borderBottom: '1px solid var(--border-subtle)' }}
                  onDoubleClick={e => { const rect = laneRef.current.getBoundingClientRect(); const t = Math.max(0, Math.round((e.clientX - rect.left + laneRef.current.scrollLeft) / zoom)); setPlayhead(t); addKeyAt(ti); }}>
                  {(tr.keys || []).length > 1 && (() => { const ks = tr.keys.slice().sort((a, b) => a.t - b.t); return (
                    <div style={{ position: 'absolute', left: px(ks[0].t), top: 14, height: 1, width: px(ks[ks.length - 1].t) - px(ks[0].t), background: 'var(--border-strong)', zIndex: 1 }} />
                  ); })()}
                  {(tr.keys || []).map((k, ki) => {
                    const active = sel && sel.ti === ti && sel.ki === ki;
                    return (
                      <div key={ki} title={`${TL_PROP_LABELS[tr.prop] || tr.prop} = ${k.value} @ ${Math.round(k.t)}ms`}
                        onMouseDown={e => { e.stopPropagation(); dragRef.current = { type: 'key', ti, ki, moved: false }; setSel({ ti, ki }); }}
                        style={{ position: 'absolute', left: px(k.t) - 6, top: 8, width: 12, height: 12, transform: 'rotate(45deg)', cursor: 'ew-resize', zIndex: 2,
                          background: active ? 'var(--blue-base)' : 'var(--text-secondary)', border: '1px solid ' + (active ? 'var(--blue-base)' : 'var(--border-strong)') }} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scale a bw×bh stage to fit (measured), so small components read clearly.
function TLStage({ bw, bh, children }) {
  const ref = React.useRef(null);
  const [fit, setFit] = React.useState(1);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); const f = Math.min((r.width - 24) / bw, (r.height - 24) / bh, 1.4); setFit(f > 0 && isFinite(f) ? f : 1); };
    measure();
    let ro; if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
    return () => ro && ro.disconnect();
  }, [bw, bh]);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: bw, height: bh, transform: `scale(${fit})`, flex: 'none', position: 'relative' }}>{children}</div>
    </div>
  );
}

// Page-scene stage: lay nodes out absolutely and render each sampled at the playhead.
function TLScene({ nodes, sample }) {
  let pw = 100, ph = 100;
  (nodes || []).forEach(n => { pw = Math.max(pw, (n.x || 0) + (n.w || 0)); ph = Math.max(ph, (n.y || 0) + (n.h || 0)); });
  return (
    <div style={{ position: 'relative', width: pw, height: ph }}>
      {(nodes || []).filter(n => !n.hidden).map(n => { const s = sample(n); return (
        <div key={n.id} style={{ position: 'absolute', left: s.x != null ? s.x : n.x, top: s.y != null ? s.y : n.y, width: n.w, height: n.h, overflow: n.clipContent ? 'hidden' : 'visible' }}>
          <PreviewNode node={s} />
        </div>
      ); })}
    </div>
  );
}

const tlBtn = { width: 24, height: 22, border: 0, borderRadius: 4, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' };
const tlIco = { width: 13, height: 13 };
const tlField = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' };
const tlNum = { width: 56, height: 22, padding: '0 5px', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', borderRadius: 3, MozAppearance: 'textfield' };
const tlNum2 = { width: '100%', boxSizing: 'border-box', height: 26, padding: '0 7px', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', borderRadius: 3, MozAppearance: 'textfield' };
const tlSelect = { height: 22, border: '1px solid var(--border-subtle)', borderRadius: 3, background: 'var(--surface-inset)', color: 'var(--text-secondary)', fontSize: 11, outline: 'none', cursor: 'pointer' };

window.TimelineEditor = TimelineEditor;
