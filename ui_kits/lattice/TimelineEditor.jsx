/* global React, PreviewNode, ColorField, IconPicker */
// Dope-sheet timeline editor — redesigned for discoverability. Instead of a hidden "Add track…"
// dropdown, an "Animate a property" picker shows every animatable property grouped with icons and
// plain-language hints (Opacity → fade, Scale → grow, Icon → swap the glyph…). The preview sidebar
// minimises/maximises, the ruler zooms on scroll, numbers scrub by dragging, and an always-visible
// hint strip + teaching empty state explain the gestures.
//
// Data it edits lives in `state.tracks = [{ prop, nodeId?, keys:[{ t, value, ease }] }]` with
// `state.duration` / `state.loop`. All mutations flow through the callbacks so App owns the state.

// ── Property registry ──────────────────────────────────────────────────────────────────────────
// Every animatable property Lattice knows, with the metadata the picker + keyframe editor need.
// `type` drives the value editor: number (scrub), color (ColorField), icon (IconPicker), text
// (input), select (dropdown), bool (switch). `group` buckets it in the picker; `page` = scene-only.
const TL_PROP = {
  // Transform
  scale:        { label: 'Scale',         icon: 'maximize',             hint: 'Grow or shrink',              group: 'Transform',  type: 'number' },
  rotation:     { label: 'Rotate',        icon: 'rotate-cw',            hint: 'Spin in degrees',             group: 'Transform',  type: 'number' },
  x:            { label: 'Move X',        icon: 'arrow-left-right',     hint: 'Slide left / right',          group: 'Transform',  type: 'number', page: true },
  y:            { label: 'Move Y',        icon: 'arrow-up-down',        hint: 'Slide up / down',             group: 'Transform',  type: 'number', page: true },
  skewX:        { label: 'Skew X',        icon: 'italic',               hint: 'Slant sideways',              group: 'Transform',  type: 'number' },
  skewY:        { label: 'Skew Y',        icon: 'italic',               hint: 'Slant vertically',            group: 'Transform',  type: 'number' },
  // Size
  w:            { label: 'Width',         icon: 'move-horizontal',      hint: 'Animate the width',           group: 'Size',       type: 'number' },
  h:            { label: 'Height',        icon: 'move-vertical',        hint: 'Animate the height',          group: 'Size',       type: 'number' },
  // Appearance
  opacity:      { label: 'Opacity',       icon: 'contrast',             hint: 'Fade in and out',             group: 'Appearance', type: 'number' },
  fillColor:    { label: 'Fill',          icon: 'paint-bucket',         hint: 'Animate the background',      group: 'Appearance', type: 'color' },
  borderColor:  { label: 'Border color',  icon: 'square-dashed',        hint: 'Animate the outline colour',  group: 'Appearance', type: 'color' },
  radius:       { label: 'Corner radius', icon: 'square',               hint: 'Round the corners',           group: 'Appearance', type: 'number' },
  borderWidth:  { label: 'Border width',  icon: 'frame',                hint: 'Thicken the outline',         group: 'Appearance', type: 'number' },
  // Text content
  label:        { label: 'Text',          icon: 'text-cursor-input',    hint: 'Change the text mid-way',     group: 'Content',    type: 'text' },
  textColor:    { label: 'Text color',    icon: 'type',                 hint: 'Animate the text colour',     group: 'Content',    type: 'color' },
  fontSize:     { label: 'Font size',     icon: 'a-large-small',        hint: 'Grow or shrink the text',     group: 'Content',    type: 'number' },
  // Button glyph
  btnIcon:       { label: 'Icon',          icon: 'shapes',              hint: 'Swap the glyph',              group: 'Content', type: 'icon' },
  btnIconColor:  { label: 'Icon color',    icon: 'palette',             hint: 'Animate the icon colour',     group: 'Content', type: 'color' },
  btnIconSize:   { label: 'Icon size',     icon: 'scaling',             hint: 'Grow or shrink the icon',     group: 'Content', type: 'number' },
  btnIconRotate: { label: 'Icon rotation', icon: 'rotate-cw',           hint: 'Spin the icon',               group: 'Content', type: 'number' },
  btnIconOpacity:{ label: 'Icon opacity',  icon: 'contrast',            hint: 'Fade the icon',               group: 'Content', type: 'number' },
  btnIconGap:    { label: 'Icon gap',      icon: 'space',               hint: 'Space between icon and text', group: 'Content', type: 'number' },
  // Icon-node glyph
  iconName:     { label: 'Icon',          icon: 'shapes',               hint: 'Swap the glyph',              group: 'Content',    type: 'icon' },
  iconSize:     { label: 'Icon size',     icon: 'scaling',              hint: 'Grow or shrink the icon',     group: 'Content',    type: 'number' },
  iconRotate:   { label: 'Icon rotation', icon: 'rotate-cw',            hint: 'Spin the icon',               group: 'Content',    type: 'number' },
  iconOpacity:  { label: 'Icon opacity',  icon: 'contrast',             hint: 'Fade the icon',               group: 'Content',    type: 'number' },
  iconStroke:   { label: 'Icon stroke',   icon: 'pen-line',             hint: 'Line thickness',              group: 'Content',    type: 'number' },
  // Field
  placeholderColor: { label: 'Placeholder color', icon: 'type',         hint: 'Animate the placeholder',     group: 'Content',    type: 'color' },
  // Style
  variant:      { label: 'Variant',       icon: 'palette',              hint: 'Switch the button style',     group: 'Style',      type: 'select', options: ['solid', 'outline', 'ghost', 'danger'] },
  btnSize:      { label: 'Button size',   icon: 'ruler-dimension-line', hint: 'Switch sm / md / lg',         group: 'Style',      type: 'select', options: ['sm', 'md', 'lg'] },
  btnIconPos:   { label: 'Icon position', icon: 'panel-left',           hint: 'Left · right · icon-only',    group: 'Style',      type: 'select', options: ['left', 'right', 'only'] },
  fullWidth:    { label: 'Full width',    icon: 'move-horizontal',      hint: 'Stretch to fill',             group: 'Style',      type: 'bool' },
  disabled:     { label: 'Disabled',      icon: 'ban',                  hint: 'Toggle disabled state',       group: 'Style',      type: 'bool' },
};

// Props on every node, then the extras each kind adds. Text-bearing kinds get Text + Text color.
const TL_UNIVERSAL = ['scale', 'rotation', 'x', 'y', 'skewX', 'skewY', 'w', 'h', 'opacity', 'fillColor', 'borderColor', 'radius', 'borderWidth'];
const TL_KIND_PROPS = {
  button:  ['label', 'textColor', 'variant', 'btnSize', 'fullWidth', 'disabled', 'btnIcon', 'btnIconColor', 'btnIconSize', 'btnIconRotate', 'btnIconOpacity', 'btnIconGap', 'btnIconPos'],
  icon:    ['iconName', 'iconSize', 'iconRotate', 'iconOpacity', 'iconStroke'],
  text:    ['label', 'textColor', 'fontSize'],
  heading: ['label', 'textColor', 'fontSize'],
  link:    ['label', 'textColor', 'fontSize'],
  badge:   ['label', 'textColor'],
  list:    ['textColor', 'fontSize'],
  input:   ['textColor', 'placeholderColor'],
  avatar:  ['label'],
};
const TL_TEXT_KINDS = new Set(['text', 'heading', 'link', 'button', 'badge', 'checkbox', 'switch', 'list', 'input', 'avatar']);
// Structural keys never offered as animatable in the catch-all "Other" scan.
const TL_SKIP_KEYS = new Set(['id', 'name', 'kind', 'icon', 'parentId', 'children', 'actions', 'states', 'customStates', 'anim', 'frames', 'timeline', 'hidden', 'locked', 'synced', 'responsive', 'clipContent', 'layout', 'align', 'justify', 'svg', 'src', 'z', 'preset', 'w', 'h', 'x', 'y']);

const TL_EASES = [
  { v: 'linear', label: 'Linear' }, { v: 'ease-out', label: 'Ease out' },
  { v: 'ease-in-out', label: 'Ease in-out' }, { v: 'ease-in', label: 'Ease in' },
];
const TL_GROUP_ORDER = ['Transform', 'Size', 'Appearance', 'Content', 'Style', 'Other'];
const TL_GROUP_ICON = { Transform: 'move', Size: 'ruler-dimension-line', Appearance: 'palette', Content: 'shapes', Style: 'sliders-horizontal', Other: 'ellipsis' };

function tlHasText(n) { return !!(n && TL_TEXT_KINDS.has(n.kind)); }
function tlHasIcon(n) { return !!(n && (n.kind === 'icon' || n.kind === 'button')); }
function tlPretty(prop) { return prop.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim(); }
function tlMeta(prop) { const m = TL_PROP[prop]; return { label: m ? m.label : tlPretty(prop), icon: m ? m.icon : 'circle' }; }
function tlType(prop) {
  if (TL_PROP[prop]) return TL_PROP[prop].type;
  if (/colou?r$/i.test(prop)) return 'color';
  if (prop === 'iconName' || prop === 'btnIcon') return 'icon';
  return 'number';
}
const TL_NUM_DEFAULT = { scale: 100, opacity: 100, btnIconOpacity: 100, iconOpacity: 100, rotation: 0, x: 0, y: 0, skewX: 0, skewY: 0, radius: 0, borderWidth: 1, gap: 0, btnIconGap: 7, btnIconSize: 15, iconSize: 24, fontSize: 14, btnIconRotate: 0, iconRotate: 0, iconStroke: 2 };
const TL_COLOR_DEFAULT = { fillColor: '#5fb88a', textColor: '#e7e7ea', borderColor: '#46464f', btnIconColor: '#ffffff', iconColor: '#e7e7ea', placeholderColor: '#8a8a92' };
// The starting value for a new track/key of `prop`, preferring the node's current value.
function tlSeed(node, prop) {
  const t = tlType(prop), cur = node ? node[prop] : undefined;
  if (t === 'bool') return !!cur;
  if (t === 'text') return cur != null ? cur : '';
  if (t === 'select') return (cur != null && cur !== '') ? cur : (TL_PROP[prop].options[0]);
  if (t === 'icon') return (cur != null && cur !== '') ? cur : (prop === 'btnIcon' ? 'arrow-right' : 'star');
  if (t === 'color') return (cur != null && cur !== '') ? cur : (TL_COLOR_DEFAULT[prop] || '#888888');
  if (cur != null && cur !== '' && !isNaN(+cur)) return +cur;
  return TL_NUM_DEFAULT[prop] != null ? TL_NUM_DEFAULT[prop] : (prop === 'w' ? (node && node.w) || 160 : prop === 'h' ? (node && node.h) || 60 : 0);
}
// The full ordered list of animatable props for a node: universal + kind-specific (+ scene-only gate).
function tlPropList(node, pageMode) {
  const kind = node && node.kind, out = [];
  const push = (p) => { if (!out.includes(p) && TL_PROP[p] && !(TL_PROP[p].page && !pageMode)) out.push(p); };
  TL_UNIVERSAL.forEach(push);
  (TL_KIND_PROPS[kind] || (TL_TEXT_KINDS.has(kind) ? ['label', 'textColor'] : [])).forEach(push);
  return out;
}
// Any *stored* numeric/colour prop on the node not already covered — so nothing is truly hidden.
function tlExtraProps(node, listed) {
  if (!node) return [];
  return Object.keys(node).filter(k => !listed.includes(k) && !TL_SKIP_KEYS.has(k)).filter(k => {
    const v = node[k]; return (typeof v === 'number' && isFinite(v)) || (typeof v === 'string' && /^(#|rgb)/i.test(v));
  });
}

function TimelineEditor(props) {
  const node = props.node, state = props.state, pageMode = !!props.pageMode;
  const pageNodes = props.pageNodes || [], palette = props.palette || [];
  const onAddTrack = props.onAddTrack, onDeleteTrack = props.onDeleteTrack;
  const onAddKey = props.onAddKey, onUpdateKey = props.onUpdateKey, onDeleteKey = props.onDeleteKey;
  const onSetDuration = props.onSetDuration, onSetLoop = props.onSetLoop;

  const { Switch } = window.LatticeDesignSystem_e801cb;
  const tracks = (state && state.tracks) || [];
  const duration = Math.max(1, (state && state.duration) || (window.tracksDuration ? window.tracksDuration(tracks) : 0) || 1000);

  const [playhead, setPlayhead] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [sel, setSel] = React.useState(null);          // { ti, ki }
  const [zoom, setZoom] = React.useState(0.5);         // px per ms
  const [onion, setOnion] = React.useState(false);
  const [stageMode, setStageMode] = React.useState('normal'); // 'min' | 'normal' | 'max'
  const [addNode, setAddNode] = React.useState('');
  const [picker, setPicker] = React.useState(false);
  const [pq, setPq] = React.useState('');

  const rafRef = React.useRef(0);
  const dragRef = React.useRef(null);
  const laneRef = React.useRef(null);
  const zoomRef = React.useRef(zoom); zoomRef.current = zoom;
  const durRef = React.useRef(duration); durRef.current = duration;

  const px = (t) => t * zoom;
  const laneW = px(duration) + 48;
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });

  // Playback loop.
  React.useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const step = (now) => {
      const dt = now - last; last = now;
      setPlayhead(p => { let n = p + dt; if (n >= duration) { if (state && state.loop) n = n % duration; else { n = duration; setPlaying(false); } } return n; });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration, state && state.loop]);

  // Keyframe drag / playhead scrub (document-level so the pointer can leave the lane).
  React.useEffect(() => {
    const mm = (e) => {
      const d = dragRef.current; if (!d) return;
      const rect = laneRef.current ? laneRef.current.getBoundingClientRect() : { left: 0 };
      const t = Math.max(0, Math.round((e.clientX - rect.left + (laneRef.current ? laneRef.current.scrollLeft : 0)) / zoomRef.current));
      if (d.type === 'play') { setPlayhead(Math.min(durRef.current, t)); return; }
      if (d.type === 'key') { d.moved = true; onUpdateKey && onUpdateKey(d.ti, d.ki, { t: Math.min(durRef.current, t) }); }
    };
    const mu = () => { dragRef.current = null; };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    return () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
  }, [onUpdateKey]);

  // Scroll to zoom (keep the time under the cursor fixed); shift-scroll to pan. Native + non-passive.
  React.useEffect(() => {
    const el = laneRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.shiftKey) { el.scrollLeft += (e.deltaY || e.deltaX); return; }
      const rect = el.getBoundingClientRect();
      const cursor = e.clientX - rect.left;
      const tAt = (cursor + el.scrollLeft) / zoomRef.current;
      const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14;
      const nz = Math.max(0.05, Math.min(5, zoomRef.current * factor));
      setZoom(nz);
      requestAnimationFrame(() => { if (laneRef.current) laneRef.current.scrollLeft = tAt * nz - cursor; });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keyboard: space play/pause, ⌫ delete key, ←/→ nudge playhead. Ignored while typing.
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); onDeleteKey && onDeleteKey(sel.ti, sel.ki); setSel(null); }
      else if (e.key === 'ArrowLeft') { setPlayhead(p => Math.max(0, p - (e.shiftKey ? 50 : 10))); }
      else if (e.key === 'ArrowRight') { setPlayhead(p => Math.min(duration, p + (e.shiftKey ? 50 : 10))); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sel, duration, onDeleteKey]);

  const targetNode = pageMode ? (pageNodes.find(n => n.id === addNode) || pageNodes[0] || node) : node;
  const sampleAt = (n, t) => { const nt = pageMode ? tracks.filter(tr => tr.nodeId === (n && n.id)) : tracks; return window.sampleTracks ? { ...n, ...window.sampleTracks(nt, t) } : n; };

  const isTracked = (prop) => tracks.some(tr => tr.prop === prop && (!pageMode || tr.nodeId === (addNode || (pageNodes[0] && pageNodes[0].id))));

  const addProp = (prop) => {
    if (!onAddTrack || isTracked(prop)) return;
    const nid = pageMode ? (addNode || (pageNodes[0] && pageNodes[0].id)) : null;
    onAddTrack(prop, nid, tlSeed(targetNode, prop));
    setPicker(false); setPq('');
  };

  // Drop a key on track `ti`. `atTime` is explicit because callers (double-click) set the playhead in
  // the same tick — reading the `playhead` closure here would still see the stale value.
  const addKeyAt = (ti, atTime) => {
    const tr = tracks[ti]; if (!tr || !onAddKey) return;
    const t = Math.round(atTime != null ? atTime : playhead);
    const v = window.sampleTrack ? window.sampleTrack(tr, t) : undefined;
    const value = v !== undefined ? v : tlSeed(targetNode, tr.prop);
    onAddKey(ti, t, value);
  };

  const selTrack = sel ? tracks[sel.ti] : null;
  const selKey = selTrack ? (selTrack.keys || [])[sel.ki] : null;

  const fmt = (ms) => (ms / 1000).toFixed(2) + 's';
  const ticks = [];
  for (let t = 0; t <= duration; t += Math.max(50, Math.round(duration / 10 / 50) * 50)) ticks.push(t);
  const bw = Math.max(1, (targetNode && targetNode.w) || 160), bh = Math.max(1, (targetNode && targetNode.h) || 120);
  const stageW = stageMode === 'min' ? 0 : stageMode === 'max' ? 440 : 280;

  // What the preview should frame. In scene mode that's the bounding box of ALL visible nodes (so the
  // whole page is centred), not the selected node — otherwise the page overflows a tiny stage box.
  const scene = pageMode ? (() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    (pageNodes || []).filter(n => !n.hidden).forEach(n => {
      const x = n.x || 0, y = n.y || 0; minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + (n.w || 0)); maxY = Math.max(maxY, y + (n.h || 0));
    });
    if (!isFinite(minX)) return { x: 0, y: 0, w: 100, h: 100 };
    return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  })() : null;
  const stageBW = pageMode ? scene.w : bw, stageBH = pageMode ? scene.h : bh;
  // One node/scene pose at time `t`, offset so the framed content starts at the stage origin. When
  // `focus` is set, the node picked in the dropdown is outlined and the rest of the page is dimmed —
  // so a scene preview still makes clear *which* node you're editing. Onion ghosts pass focus=false.
  const renderPose = (t, focus) => pageMode
    ? <div style={{ position: 'absolute', left: -scene.x, top: -scene.y }}><TLScene nodes={pageNodes} sample={(n) => sampleAt(n, t)} selId={focus ? addNode : ''} /></div>
    : <PreviewNode node={sampleAt(targetNode, t)} />;

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      <TLStyles />

      {/* Transport bar — wraps to a second row on narrow panels so nothing clips or squishes. */}
      <div style={{ flex: 'none', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, rowGap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
        <i data-lucide="film" style={{ width: 15, height: 15, color: 'var(--text-secondary)', flex: 'none' }}></i>
        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{(state && state.name) || 'Animation'}</span>
        <span style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button type="button" title="Restart" onClick={() => { setPlayhead(0); setPlaying(true); }} style={tlBtn}><i data-lucide="skip-back" style={tlIco}></i></button>
          <button type="button" title={playing ? 'Pause (space)' : 'Play (space)'} onClick={() => setPlaying(p => !p)} style={{ ...tlBtn, background: 'var(--surface-hover)', width: 30 }}><i data-lucide={playing ? 'pause' : 'play'} style={tlIco}></i></button>
          <button type="button" title="Stop" onClick={() => { setPlaying(false); setPlayhead(0); }} style={tlBtn}><i data-lucide="square" style={tlIco}></i></button>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 92 }}>{fmt(playhead)} / {fmt(duration)}</span>
        <label style={tlField}>Duration
          <TLScrub value={Math.round(duration)} min={50} step={50} onChange={v => onSetDuration && onSetDuration(Math.max(50, v))} width={54} suffix="ms" />
        </label>
        <Switch label="Loop" checked={!!(state && state.loop)} onChange={on => onSetLoop && onSetLoop(on)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 2 }}>
          <button type="button" title="Zoom out" onClick={() => setZoom(z => Math.max(0.05, z / 1.3))} style={tlBtn}><i data-lucide="zoom-out" style={tlIco}></i></button>
          <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 34, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button type="button" title="Zoom in" onClick={() => setZoom(z => Math.min(5, z * 1.3))} style={tlBtn}><i data-lucide="zoom-in" style={tlIco}></i></button>
        </div>
        <div style={{ marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          {pageMode && (
            <select value={addNode} onChange={e => setAddNode(e.target.value)} style={{ ...tlSelect, height: 28, width: 130, flex: 'none' }}>
              <option value="">Node…</option>
              {pageNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          )}
          <button type="button" onClick={() => setPicker(p => !p)}
            style={{ flex: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7, height: 28, padding: '0 12px', border: '1px solid var(--action-solid)', background: 'var(--action-solid)', color: 'var(--action-solid-text)', fontSize: 12.5, fontWeight: 600, borderRadius: 4, cursor: 'pointer' }}>
            <i data-lucide="plus" style={{ width: 14, height: 14, flex: 'none' }}></i>Animate a property
          </button>
        </div>
      </div>

      {/* Hint strip — always-on discoverability for the mouse gestures */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '5px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-app)', fontSize: 11, color: 'var(--text-muted)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <span style={tlHint}><b style={tlHintKey}>Double-click</b> a track to drop a keyframe</span>
        <span style={tlHint}><b style={tlHintKey}>Drag</b> a ◇ to retime it</span>
        <span style={tlHint}><b style={tlHintKey}>Scroll</b> to zoom · <b style={tlHintKey}>Shift-scroll</b> to pan</span>
        <span style={tlHint}><b style={tlHintKey}>Space</b> play/pause · <b style={tlHintKey}>⌫</b> delete key</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Preview sidebar — min / normal / max */}
        {stageMode === 'min' ? (
          <button type="button" title="Show preview" onClick={() => setStageMode('normal')}
            style={{ flex: 'none', width: 30, border: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 10 }}>
            <i data-lucide="panel-left-open" style={{ width: 15, height: 15 }}></i>
            <span style={{ writingMode: 'vertical-rl', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Preview</span>
          </button>
        ) : (
          <div style={{ flex: 'none', width: stageW, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', minHeight: 0, transition: 'width var(--dur-base) var(--ease-out)' }}>
            <div style={{ flex: 'none', height: 30, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px 0 10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Preview</span>
              <button type="button" title="Onion skin" onClick={() => setOnion(o => !o)} style={{ ...tlBtn, color: onion ? 'var(--text-primary)' : 'var(--text-muted)', background: onion ? 'var(--surface-hover)' : 'transparent' }}><i data-lucide="layers" style={tlIco}></i></button>
              <button type="button" title={stageMode === 'max' ? 'Default size' : 'Maximise'} onClick={() => setStageMode(stageMode === 'max' ? 'normal' : 'max')} style={tlBtn}><i data-lucide={stageMode === 'max' ? 'minimize-2' : 'maximize-2'} style={tlIco}></i></button>
              <button type="button" title="Minimise" onClick={() => setStageMode('min')} style={tlBtn}><i data-lucide="panel-left-close" style={tlIco}></i></button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              <TLStage bw={stageBW} bh={stageBH}>
                {onion && [0.25, 0.5, 0.75].map(f => (
                  <div key={f} style={{ position: 'absolute', inset: 0, opacity: 0.16, pointerEvents: 'none' }}>
                    {renderPose(duration * f, false)}
                  </div>
                ))}
                {renderPose(playhead, true)}
              </TLStage>
            </div>
          </div>
        )}

        {/* Dope sheet */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex' }}>
            {/* Label column */}
            <div style={{ flex: 'none', width: 176, borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
              <div style={{ height: 26, boxSizing: 'border-box', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Tracks · {tracks.length}</div>
              {tracks.map((tr, ti) => {
                const m = tlMeta(tr.prop);
                const nn = pageMode ? (pageNodes.find(n => n.id === tr.nodeId) || {}).name : null;
                const active = sel && sel.ti === ti;
                return (
                  <div key={ti} className="tl-track" style={{ height: 34, boxSizing: 'border-box', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 7, padding: '0 6px 0 10px', fontSize: 12, background: active ? 'var(--surface-hover)' : 'transparent' }}>
                    <i data-lucide={m.icon} style={{ width: 13, height: 13, color: 'var(--text-secondary)', flex: 'none' }}></i>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{nn ? nn + ' · ' : ''}{m.label}</span>
                    <button type="button" className="tl-showhover" title="Add keyframe here" onClick={() => addKeyAt(ti)} style={tlBtn}><i data-lucide="diamond-plus" style={tlIco}></i></button>
                    <button type="button" className="tl-showhover" title="Delete track" onClick={() => { onDeleteTrack && onDeleteTrack(ti); setSel(null); }} style={tlBtn}><i data-lucide="trash-2" style={tlIco}></i></button>
                  </div>
                );
              })}
              {tracks.length === 0 && (
                <button type="button" onClick={() => setPicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 10px', border: 0, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12.5, textAlign: 'left' }}>
                  <i data-lucide="plus" style={{ width: 14, height: 14 }}></i>Animate a property
                </button>
              )}
            </div>

            {/* Lanes */}
            <div ref={laneRef} style={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
              <div style={{ position: 'relative', width: laneW, minHeight: '100%' }}>
                {/* Ruler */}
                <div onMouseDown={e => { dragRef.current = { type: 'play' }; const rect = laneRef.current.getBoundingClientRect(); setPlayhead(Math.max(0, Math.min(duration, Math.round((e.clientX - rect.left + laneRef.current.scrollLeft) / zoom)))); }}
                  style={{ height: 26, boxSizing: 'border-box', background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)', cursor: 'ew-resize', position: 'relative', zIndex: 4 }}>
                  {ticks.map(t => (
                    <div key={t} style={{ position: 'absolute', left: px(t), top: 0, height: '100%', borderLeft: '1px solid var(--border-subtle)', paddingLeft: 4, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', display: 'flex', alignItems: 'center' }}>{Math.round(t)}</div>
                  ))}
                </div>
                {/* Playhead */}
                <div style={{ position: 'absolute', left: px(playhead), top: 0, bottom: 0, width: 1, background: 'var(--blue-base)', zIndex: 3, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: 0, left: -5, width: 11, height: 8, background: 'var(--blue-base)', clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                </div>

                {tracks.length === 0 && <TLEmpty onPick={() => setPicker(true)} />}

                {tracks.map((tr, ti) => (
                  <div key={ti} className="tl-lane" style={{ position: 'relative', height: 34, boxSizing: 'border-box', borderBottom: '1px solid var(--border-subtle)', cursor: 'copy' }}
                    onDoubleClick={e => { const rect = laneRef.current.getBoundingClientRect(); const t = Math.max(0, Math.round((e.clientX - rect.left + laneRef.current.scrollLeft) / zoom)); setPlayhead(t); addKeyAt(ti, t); }}>
                    {(tr.keys || []).length > 1 && (() => { const ks = tr.keys.slice().sort((a, b) => a.t - b.t); return (
                      <div style={{ position: 'absolute', left: px(ks[0].t), top: 16, height: 2, width: px(ks[ks.length - 1].t) - px(ks[0].t), background: 'var(--border-strong)', zIndex: 1 }} />
                    ); })()}
                    {(tr.keys || []).map((k, ki) => {
                      const active = sel && sel.ti === ti && sel.ki === ki;
                      const col = tlType(tr.prop) === 'color' && typeof k.value === 'string' ? k.value : null;
                      return (
                        <div key={ki} className="tl-key" title={`${tlMeta(tr.prop).label} = ${k.value} @ ${Math.round(k.t)}ms — drag to retime, click to edit`}
                          onMouseDown={e => { e.stopPropagation(); dragRef.current = { type: 'key', ti, ki, moved: false }; setSel({ ti, ki }); }}
                          style={{ position: 'absolute', left: px(k.t) - 7, top: 9, width: 14, height: 14, transform: 'rotate(45deg)', cursor: 'ew-resize', zIndex: 2, borderRadius: 2,
                            background: col || (active ? 'var(--blue-base)' : 'var(--text-secondary)'), border: '2px solid ' + (active ? 'var(--blue-base)' : col ? 'var(--border-strong)' : 'var(--border-strong)'),
                            boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--blue-base) 30%, transparent)' : 'none' }} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected-keyframe bar — full width, visible even when the sidebar is minimised */}
          {selKey && (
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderTop: '1px solid var(--border-default)', background: 'var(--surface-raised)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                <i data-lucide={tlMeta(selTrack.prop).icon} style={{ width: 13, height: 13 }}></i>{tlMeta(selTrack.prop).label}
              </span>
              <span style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
              <label style={tlField}>Value
                {(() => {
                  const type = tlType(selTrack.prop);
                  const setV = (v) => onUpdateKey(sel.ti, sel.ki, { value: v });
                  if (type === 'icon') return <div style={{ width: 200 }}><IconPicker value={selKey.value} onChange={setV} placeholder="Pick an icon" /></div>;
                  if (type === 'color') return <div style={{ width: 200 }}><ColorField value={selKey.value} onChange={setV} palette={palette} /></div>;
                  if (type === 'text') return <input value={selKey.value == null ? '' : selKey.value} onChange={e => setV(e.target.value)} placeholder="Text…"
                    style={{ width: 200, height: 26, padding: '0 8px', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-sans)', borderRadius: 3, outline: 'none', boxSizing: 'border-box' }} />;
                  if (type === 'select') return <select value={selKey.value} onChange={e => setV(e.target.value)} style={{ ...tlSelect, height: 26, minWidth: 110 }}>
                    {(TL_PROP[selTrack.prop].options || []).map(o => <option key={o} value={o}>{o}</option>)}</select>;
                  if (type === 'bool') return <Switch checked={!!selKey.value} onChange={on => setV(on)} />;
                  return <TLScrub value={+selKey.value || 0} onChange={setV} width={70} />;
                })()}
              </label>
              <label style={tlField}>Time
                <TLScrub value={Math.round(selKey.t)} min={0} max={Math.round(duration)} step={10} onChange={v => onUpdateKey(sel.ti, sel.ki, { t: v })} width={56} suffix="ms" />
              </label>
              <label style={tlField}>Easing
                <select value={selKey.ease || 'ease-out'} onChange={e => onUpdateKey(sel.ti, sel.ki, { ease: e.target.value })} style={{ ...tlSelect, height: 26 }}>
                  {TL_EASES.map(e => <option key={e.v} value={e.v}>{e.label}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => { onDeleteKey(sel.ti, sel.ki); setSel(null); }} title="Delete keyframe (⌫)" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px', border: '1px solid var(--status-danger-fg)', background: 'transparent', color: 'var(--status-danger-fg)', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                <i data-lucide="trash-2" style={{ width: 13, height: 13 }}></i>Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property picker popover — every property this node's kind supports, grouped. */}
      {picker && (() => {
        const listed = tlPropList(targetNode, pageMode);
        const groupsMap = {};
        const addItem = (prop, group) => {
          const m = tlMeta(prop), meta = TL_PROP[prop];
          (groupsMap[group] = groupsMap[group] || []).push({ key: prop, label: m.label, icon: m.icon, hint: (meta && meta.hint) || 'Animate this property', tracked: isTracked(prop), onAdd: () => addProp(prop) });
        };
        listed.forEach(p => addItem(p, (TL_PROP[p] && TL_PROP[p].group) || 'Other'));
        tlExtraProps(targetNode, listed).forEach(p => addItem(p, 'Other'));
        const groups = TL_GROUP_ORDER.map(g => ({ name: g, icon: TL_GROUP_ICON[g], items: groupsMap[g] || [] })).filter(g => g.items.length);
        return <TLPicker q={pq} setQ={setPq} onClose={() => { setPicker(false); setPq(''); }} groups={groups} />;
      })()}
    </div>
  );
}

// The teaching empty state shown across the lanes when nothing is animated yet.
function TLEmpty({ onPick }) {
  return (
    <div style={{ position: 'absolute', inset: '26px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', pointerEvents: 'auto', maxWidth: 380, padding: 24 }}>
        <div style={{ display: 'inline-flex', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', background: 'var(--surface)', marginBottom: 14 }}>
          <i data-lucide="sparkles" style={{ width: 20, height: 20, color: 'var(--text-secondary)' }}></i>
        </div>
        <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 6 }}>Nothing animated yet</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
          Pick a property to animate — opacity to fade, scale to grow, or swap an icon. Then drop keyframes along the timeline and Lattice eases between them.
        </div>
        <button type="button" onClick={onPick} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 34, padding: '0 16px', border: '1px solid var(--action-solid)', background: 'var(--action-solid)', color: 'var(--action-solid-text)', fontSize: 13, fontWeight: 600, borderRadius: 4, cursor: 'pointer' }}>
          <i data-lucide="plus" style={{ width: 15, height: 15 }}></i>Animate a property
        </button>
      </div>
    </div>
  );
}

// Grouped, searchable property picker popover.
function TLPicker(props) {
  const groups = props.groups, q = props.q, setQ = props.setQ, onClose = props.onClose;
  const ref = React.useRef(null);
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });
  React.useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', on), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', on); };
  }, [onClose]);
  const needle = (q || '').trim().toLowerCase();
  const shown = groups.map(g => ({ ...g, items: g.items.filter(it => !needle || it.label.toLowerCase().includes(needle) || it.hint.toLowerCase().includes(needle)) })).filter(g => g.items.length);

  return (
    <div ref={ref} className="tl-pop" style={{ position: 'absolute', top: 46, right: 14, width: 320, maxHeight: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column', background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', zIndex: 50 }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <i data-lucide="search" style={{ width: 14, height: 14, color: 'var(--text-muted)' }}></i>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search properties…"
          style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)' }} />
        <button type="button" onClick={onClose} title="Close" style={tlBtn}><i data-lucide="x" style={tlIco}></i></button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 6 }}>
        {shown.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>No properties match “{q}”.</div>}
        {shown.map(g => (
          <div key={g.name} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-disabled)' }}>
              <i data-lucide={g.icon} style={{ width: 11, height: 11 }}></i>{g.name}
            </div>
            {g.items.map(it => (
              <button key={it.key} type="button" disabled={it.tracked} onClick={it.onAdd} className="tl-pickrow"
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 8px', border: 0, background: 'transparent', cursor: it.tracked ? 'default' : 'pointer', textAlign: 'left', opacity: it.tracked ? 0.45 : 1 }}>
                <span style={{ display: 'inline-flex', width: 28, height: 28, flex: 'none', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-secondary)' }}><i data-lucide={it.icon} style={{ width: 14, height: 14 }}></i></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{it.label}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)' }}>{it.hint}</span>
                </span>
                {it.tracked ? <span style={{ fontSize: 10.5, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>added</span>
                  : <i data-lucide="plus" style={{ width: 15, height: 15, color: 'var(--text-muted)', flex: 'none' }}></i>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Scrubbable number — drag left/right to change, click to type. The gesture users asked for.
function TLScrub(props) {
  const value = props.value, onChange = props.onChange, step = props.step || 1;
  const min = props.min != null ? props.min : -Infinity, max = props.max != null ? props.max : Infinity;
  const width = props.width || 58, suffix = props.suffix || '';
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const start = (e) => {
    e.preventDefault();
    const sx = e.clientX, sv = +value || 0; let moved = false;
    const mm = (ev) => { const dx = ev.clientX - sx; if (Math.abs(dx) > 2) moved = true; if (moved) { let nv = sv + Math.round(dx / 2) * step; nv = Math.min(max, Math.max(min, nv)); onChange(nv); } };
    const mu = () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); if (!moved) { setDraft(String(value)); setEditing(true); } };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
  };
  const commit = () => { let nv = parseFloat(draft); if (isNaN(nv)) nv = +value || 0; nv = Math.min(max, Math.max(min, nv)); onChange(nv); setEditing(false); };
  if (editing) return (
    <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      style={{ width, height: 24, padding: '0 6px', border: '1px solid var(--border-focus)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11.5, outline: 'none', borderRadius: 3, boxSizing: 'border-box', MozAppearance: 'textfield' }} />
  );
  return (
    <span onMouseDown={start} title="Drag to change · click to type" className="tl-scrub"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2, width, height: 24, padding: '0 6px', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11.5, borderRadius: 3, cursor: 'ew-resize', userSelect: 'none' }}>
      {value}{suffix && <span style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
    </span>
  );
}

// Scale a bw×bh stage to fit (measured), plus a movable CAMERA so the user can inspect the preview:
// drag to pan, scroll to zoom (anchored at the cursor), double-click or the Fit button to recentre.
// The camera resets whenever the framed content changes size (switching node / scene).
function TLStage({ bw, bh, children }) {
  const ref = React.useRef(null);
  const [fit, setFit] = React.useState(1);
  const [cam, setCam] = React.useState({ z: 1, x: 0, y: 0 }); // z multiplies fit; x/y pan in screen px
  const [grabbing, setGrabbing] = React.useState(false);
  const camRef = React.useRef(cam); camRef.current = cam;
  const reset = () => setCam({ z: 1, x: 0, y: 0 });

  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); const f = Math.min((r.width - 40) / bw, (r.height - 40) / bh, 1.6); setFit(f > 0 && isFinite(f) ? f : 1); };
    measure();
    let ro; if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
    return () => ro && ro.disconnect();
  }, [bw, bh]);
  React.useEffect(() => { reset(); }, [bw, bh]); // new content → recentre the camera

  // Scroll to zoom, keeping the point under the cursor fixed. Native + non-passive so we can preventDefault.
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;   // cursor relative to stage centre
      const cy = e.clientY - rect.top - rect.height / 2;
      const c = camRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nz = Math.max(0.2, Math.min(8, c.z * factor));
      const k = nz / c.z;
      // keep the cursor point stationary: new pan = cursor - k*(cursor - pan)
      setCam({ z: nz, x: cx - k * (cx - c.x), y: cy - k * (cy - c.y) });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, base = camRef.current; setGrabbing(true);
    const mm = (ev) => setCam({ z: base.z, x: base.x + (ev.clientX - sx), y: base.y + (ev.clientY - sy) });
    const mu = () => { setGrabbing(false); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
  };

  const moved = cam.z !== 1 || cam.x !== 0 || cam.y !== 0;
  return (
    <div ref={ref} onMouseDown={onDown} onDoubleClick={reset} title="Drag to pan · scroll to zoom · double-click to recentre"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: grabbing ? 'grabbing' : 'grab' }}>
      <div style={{ width: bw, height: bh, transform: `translate(${cam.x}px, ${cam.y}px) scale(${fit * cam.z})`, flex: 'none', position: 'relative' }}>{children}</div>
      {/* Camera HUD */}
      <div style={{ position: 'absolute', right: 6, bottom: 6, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
        <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', background: 'color-mix(in srgb, var(--bg-void) 70%, transparent)', padding: '1px 5px', borderRadius: 3 }}>{Math.round(fit * cam.z * 100)}%</span>
        {moved && (
          <button type="button" onMouseDown={e => e.stopPropagation()} onClick={reset} title="Fit to view"
            style={{ pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-secondary)', borderRadius: 4, cursor: 'pointer' }}>
            <i data-lucide="scan" style={{ width: 12, height: 12 }}></i>
          </button>
        )}
      </div>
    </div>
  );
}

// Page-scene stage: lay nodes out absolutely and render each sampled at the playhead. When `selId` is
// set, that node is outlined and the others are dimmed so the editing target reads clearly.
function TLScene({ nodes, sample, selId }) {
  let pw = 100, ph = 100;
  (nodes || []).forEach(n => { pw = Math.max(pw, (n.x || 0) + (n.w || 0)); ph = Math.max(ph, (n.y || 0) + (n.h || 0)); });
  return (
    <div style={{ position: 'relative', width: pw, height: ph }}>
      {(nodes || []).filter(n => !n.hidden).map(n => {
        const s = sample(n);
        const isSel = selId && n.id === selId;
        const dim = selId && !isSel;
        return (
          <div key={n.id} style={{ position: 'absolute', left: s.x != null ? s.x : n.x, top: s.y != null ? s.y : n.y, width: n.w, height: n.h, overflow: n.clipContent ? 'hidden' : 'visible', opacity: dim ? 0.3 : 1, transition: 'opacity var(--dur-base) var(--ease-out)' }}>
            <PreviewNode node={s} />
            {isSel && <div style={{ position: 'absolute', inset: -3, border: '1.5px solid var(--action-solid)', borderRadius: 3, pointerEvents: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--action-solid) 22%, transparent)' }} />}
          </div>
        );
      })}
    </div>
  );
}

function TLStyles() {
  return (
    <style>{`
      .tl-track .tl-showhover { opacity: 0; transition: opacity var(--dur-fast) var(--ease-out); }
      .tl-track:hover .tl-showhover { opacity: 1; }
      .tl-lane:hover { background: color-mix(in srgb, var(--surface-hover) 40%, transparent); }
      .tl-key { transition: transform var(--dur-fast) var(--ease-out); }
      .tl-key:hover { transform: rotate(45deg) scale(1.18); }
      .tl-scrub:hover { border-color: var(--border-strong); color: var(--text-primary); }
      .tl-pickrow:not(:disabled):hover { background: var(--surface-hover); }
      .tl-pop { animation: tlPop var(--dur-base) var(--ease-out) both; }
      @keyframes tlPop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
    `}</style>
  );
}

const tlBtn = { width: 24, height: 22, border: 0, borderRadius: 4, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' };
const tlIco = { width: 13, height: 13 };
const tlField = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' };
const tlSelect = { height: 22, padding: '0 6px', border: '1px solid var(--border-subtle)', borderRadius: 3, background: 'var(--surface-inset)', color: 'var(--text-secondary)', fontSize: 11.5, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' };
const tlHint = { display: 'inline-flex', alignItems: 'center', gap: 5, flex: 'none' };
const tlHintKey = { color: 'var(--text-secondary)', fontWeight: 600 };

window.TimelineEditor = TimelineEditor;
