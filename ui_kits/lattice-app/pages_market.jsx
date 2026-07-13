/* global React, AppShell, EmptyState, Ic, api, navigate, useAuth, toast */
// Marketplace: Market (browse & install), Plugins (design-shortcut packs), Library (owned assets).

function openEditorProject(id) { window.location.href = '/ui_kits/lattice/?project=' + id; }

// Map a market catalog entry to a library_items install payload.
function toInstallPayload(kind, item) {
  if (kind === 'componentStyles') return { type: 'component', name: item.name, source: item.id, data: { base: item.base, props: item.props || {} } };
  if (kind === 'shaders')        return { type: 'shader',    name: item.name, source: item.id, data: { code: item.code } };
  if (kind === 'animations')     return { type: 'animation', name: item.name, source: item.id, data: { states: item.states || {} } };
  if (kind === 'templates')      return { type: 'template',  name: item.name, source: item.id, data: { canvas: item.canvas || {} } };
  if (kind === 'plugins')        return { type: 'plugin',    name: item.name, source: item.id, data: { icon: item.icon, actions: item.actions || [] } };
  return null;
}

const TYPE_META = {
  component: { icon: 'component', label: 'Component' },
  shader:    { icon: 'sparkles',  label: 'Shader' },
  animation: { icon: 'film',      label: 'Animation' },
  template:  { icon: 'layout-template', label: 'Template' },
  plugin:    { icon: 'blocks',    label: 'Plugin' },
};

// Human label for a node kind, shown as the card tag on component styles.
const KIND_LABEL = {
  button: 'Button', card: 'Card', frame: 'Panel', stack: 'Stack', grid: 'Grid',
  heading: 'Heading', text: 'Text', link: 'Link', badge: 'Badge', alert: 'Alert',
  input: 'Input', textarea: 'Textarea', select: 'Select', switch: 'Switch',
  checkbox: 'Checkbox', radio: 'Radio', slider: 'Slider', table: 'Table',
  chart: 'Chart', stat: 'Stat', avatar: 'Avatar', tabs: 'Tabs', progress: 'Progress',
  list: 'List', image: 'Image', divider: 'Divider',
};
const GROUP_ORDER = ['Buttons', 'Cards & panels', 'Typography', 'Forms', 'Badges & status', 'Data & charts'];
const TEMPLATE_GROUP_ORDER = ['Starters', 'Sidebar menus', 'Tab bars', 'Pill bars'];

// --- Live previews ------------------------------------------------------------------------------
// The Market renders every asset as the real thing (via the editor's PreviewNode), not an icon.
const STAGE_H = 132;

// Consistent preview backdrop: canvas-grid surface for components/templates, void for shaders.
function Stage({ children, grid, dark }) {
  return (
    <div className={grid ? 'lattice-grid' : undefined}
      style={{ position: 'relative', height: STAGE_H, borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden',
        background: dark ? 'var(--bg-void)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 12, boxSizing: 'border-box' }}>
      {children}
    </div>
  );
}

// Largest scale (≤1) that fits w×h inside the given box.
function fitScale(w, h, maxW, maxH) {
  if (!w || !h) return 1;
  return Math.min(maxW / w, maxH / h, 1);
}

// A single PreviewNode rendered at natural size, then transform-scaled so type/spacing shrink too.
function NodePreview({ node, maxW = 208, maxH = 104 }) {
  const w = node.w || 120, h = node.h || 40;
  const k = fitScale(w, h, maxW, maxH);
  if (!window.PreviewNode) return null;
  return (
    <div style={{ width: w * k, height: h * k }}>
      <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: 'top left' }}>
        <window.PreviewNode node={node} />
      </div>
    </div>
  );
}

// A saved component style: base kind + captured props → a real node.
function ComponentThumb({ base, props, id }) {
  const node = { id: 'cs_' + (id || 'x'), kind: base, name: (props && props.label) || '', ...(props || {}) };
  return <Stage grid><NodePreview node={node} /></Stage>;
}

// A template's active page, rendered as a real (scaled) mini canvas that fits maxW×maxH. Shared by
// the card thumbnail (small) and the Preview modal (large). Returns null when there's nothing to draw.
function TemplateCanvasView({ canvas, maxW, maxH }) {
  const page = canvas && canvas.pages && (canvas.pages.find(p => p.id === canvas.activePageId) || canvas.pages[0]);
  const nodes = (page && page.nodes) || [];
  if (!nodes.length || !window.PreviewNode) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h); });
  const bw = maxX - minX, bh = maxY - minY;
  const k = fitScale(bw, bh, maxW, maxH);
  // A menu's active item carries its "active" look in states.click; static PreviewNode ignores states,
  // so bake that pose into the marked (navActive) item so the thumbnail shows which item is selected.
  const STATE_META = { dur: 1, ease: 1, off: 1, animId: 1, preset: 1, holdMs: 1, sustain: 1 };
  const posed = (n) => {
    if (!n.navActive || !n.states || !n.states.click) return n;
    const ov = {}; for (const key in n.states.click) if (!STATE_META[key]) ov[key] = n.states.click[key];
    return Object.assign({}, n, ov);
  };
  return (
    <div style={{ position: 'relative', width: bw * k, height: bh * k }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: bw, height: bh, transform: `scale(${k})`, transformOrigin: 'top left' }}>
        {nodes.map(n => (
          <div key={n.id} style={{ position: 'absolute', left: n.x - minX, top: n.y - minY, width: n.w, height: n.h }}>
            <window.PreviewNode node={posed(n)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// A template: its first page rendered as a scaled-down mini canvas.
function TemplateThumb({ canvas }) {
  const inner = TemplateCanvasView({ canvas, maxW: 210, maxH: 108 });
  if (!inner) return <AssetThumb icon="layout-template" />;
  return <Stage grid>{inner}</Stage>;
}

// An interaction animation: the target state (hover/press) resolved through the same appearance
// engine the editor uses, then looped on a sample chip so the motion is visible at rest.
function animTarget(states) {
  const st = (states && (states.hoverOn || states.clickOn)) || {};
  const fx = (window.nodeFx && window.nodeFx({
    scale: st.scale, opacity: st.opacity, effects: st.effects,
    borderWidth: st.borderWidth, borderColor: st.borderColor, rotation: st.rotation,
  })) || {};
  const decl = [
    'transform:' + (fx.transform || 'none'),
    'opacity:' + (fx.opacity != null ? fx.opacity : 1),
    'box-shadow:' + (fx.boxShadow || 'none'),
  ];
  if (st.borderColor) decl.push('border-color:' + st.borderColor);
  if (st.fillColor) decl.push('background:' + st.fillColor);
  if (st.textColor) decl.push('color:' + st.textColor);
  return { decl: decl.join(';'), ease: st.ease || 'ease-out' };
}

function AnimThumb({ states, id }) {
  const name = 'ltanim_' + String(id || 'x').replace(/[^a-z0-9]/gi, '');
  const { decl, ease } = animTarget(states);
  const css = `@keyframes ${name}{0%,100%{transform:none;opacity:1;box-shadow:none;border-color:var(--border-default);background:var(--surface-hover);color:var(--text-secondary)}50%{${decl}}}`;
  return (
    <Stage grid>
      <style>{css}</style>
      <div style={{ width: 104, height: 62, borderRadius: 12, border: '1px solid var(--border-default)', background: 'var(--surface-hover)',
        color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-serif-display)', fontSize: 22, fontWeight: 600, animation: `${name} 1.8s ${ease} infinite` }}>Aa</div>
    </Stage>
  );
}

// Live WebGL preview for a shader (falls back to the void backdrop if WebGL is unavailable).
function ShaderThumb({ code }) {
  return (
    <Stage dark>
      {window.ShaderFill ? <div style={{ position: 'absolute', inset: 0 }}><window.ShaderFill code={code} speed={1} /></div> : null}
    </Stage>
  );
}

// Generic icon thumbnail — last-resort fallback (plugins, or a preview that fails to build).
function AssetThumb({ icon }) {
  return (
    <div className="lattice-grid" style={{ height: STAGE_H, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)' }}>
      <Ic n={icon} s={26} />
    </div>
  );
}

// One bad catalog entry must never blank the whole grid.
class PreviewBoundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { console.warn('[market preview]', e); }
  render() { return this.state.failed ? (this.props.fallback || null) : this.props.children; }
}

// Dispatch to the right preview for a normalized asset spec ({ base, props, code, states, canvas }).
function AssetPreview({ type, spec }) {
  const fallback = <AssetThumb icon={(TYPE_META[type] && TYPE_META[type].icon) || 'shapes'} />;
  let inner = fallback;
  if (type === 'shader' && spec.code) inner = <ShaderThumb code={spec.code} />;
  else if (type === 'component' && spec.base) inner = <ComponentThumb base={spec.base} props={spec.props} id={spec.id} />;
  else if (type === 'animation' && spec.states) inner = <AnimThumb states={spec.states} id={spec.id} />;
  else if (type === 'template' && spec.canvas) inner = <TemplateThumb canvas={spec.canvas} />;
  return <PreviewBoundary fallback={fallback}>{inner}</PreviewBoundary>;
}

function Card({ children }) {
  return <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column' }}>{children}</div>;
}

function CardBody({ name, description, tag, children }) {
  const { Tag } = window.LatticeDesignSystem_e801cb;
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      {(name || tag) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {tag && <Tag shape="pill">{tag}</Tag>}
        </div>
      )}
      {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{description}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>{children}</div>
    </div>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>{children}</div>;
}

function SectionHead({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '4px 2px 12px' }}>{children}</div>;
}

// --- Interactive menu demos (Preview modal) -----------------------------------------------------
// The menu templates are static canvases in the editor; in the Preview modal we render a live,
// clickable version so the active-highlight motion (the whole point of these menus) is visible.
var MK_INK = '#3b2f96', MK_AC = '#4f46e5';
var MK_SB_ITEMS = [
  { icon: 'layout-grid', label: 'Dashboard' }, { icon: 'folder', label: 'Files' },
  { icon: 'bar-chart-3', label: 'Reports' }, { icon: 'users', label: 'Team' }, { icon: 'settings', label: 'Settings' },
];
var MK_TAB_ITEMS = ['Overview', 'Activity', 'Reports', 'Settings'];
var MK_PILL_ITEMS = ['All', 'Design', 'Code', 'Prototype', 'Handoff'];
var MK_EASE = 'transform .3s cubic-bezier(.4,0,.2,1)';

function MkSidebar({ variant }) {
  const [on, setOn] = React.useState(0);
  const items = MK_SB_ITEMS, ROW = 50;
  if (variant === 'rail') {
    return (
      <div style={{ width: 216, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '12px 0' }}>
        <div style={{ padding: '2px 18px 12px', fontFamily: 'var(--font-serif-display)', fontWeight: 600, fontSize: 16 }}>Lattice</div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 8, right: 8, top: 5, height: 40, borderRadius: 10, background: 'var(--surface-hover)', transform: `translateY(${on * ROW}px)`, transition: MK_EASE }} />
          <div style={{ position: 'absolute', left: 0, top: 11, width: 3, height: 28, borderRadius: 2, background: MK_AC, transform: `translateY(${on * ROW}px)`, transition: MK_EASE }} />
          {items.map((it, i) => (
            <button key={i} type="button" onClick={() => setOn(i)} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: ROW, padding: '0 18px', background: 'transparent', border: 0, cursor: 'pointer', color: i === on ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13, fontWeight: i === on ? 600 : 400, transition: 'color .2s' }}>
              <Ic n={it.icon} s={18} /><span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (variant === 'pill') {
    return (
      <div style={{ width: 210, background: MK_INK, borderRadius: 20, padding: '14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px 14px', color: '#fff' }}>
          <Ic n="box" s={18} /><span style={{ fontFamily: 'var(--font-serif-display)', fontSize: 16, fontWeight: 600 }}>Lattice</span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 40, background: '#fff', borderRadius: 12, transform: `translateY(${on * ROW}px)`, transition: MK_EASE }} />
          {items.map((it, i) => (
            <button key={i} type="button" onClick={() => setOn(i)} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: ROW, padding: '0 14px', background: 'transparent', border: 0, cursor: 'pointer', color: i === on ? MK_INK : 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: i === on ? 600 : 400, transition: 'color .2s' }}>
              <Ic n={it.icon} s={18} /><span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  // notch: compact icon-only rail with a sliding rounded indicator
  const NR = 52;
  return (
    <div style={{ width: 86, background: MK_INK, borderRadius: 22, padding: '14px 0' }}>
      <div style={{ textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>CI</div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 10, right: 10, top: 4, height: NR - 8, background: '#fff', borderRadius: 14, transform: `translateY(${on * NR}px)`, transition: MK_EASE }} />
        {items.map((it, i) => (
          <button key={i} type="button" aria-label={it.label} onClick={() => setOn(i)} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: NR, background: 'transparent', border: 0, cursor: 'pointer', color: i === on ? MK_INK : 'rgba(255,255,255,0.8)', transition: 'color .2s' }}>
            <Ic n={it.icon} s={20} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MkTabBar({ variant }) {
  const [on, setOn] = React.useState(0);
  const items = MK_TAB_ITEMS, n = items.length;
  if (variant === 'filled') {
    return (
      <div style={{ display: 'flex', gap: 6, background: 'var(--surface-card)', padding: 6, borderRadius: 12, border: '1px solid var(--border-subtle)', minWidth: 400 }}>
        {items.map((t, i) => (
          <button key={i} type="button" onClick={() => setOn(i)} style={{ flex: 1, textAlign: 'center', padding: '9px 14px', fontSize: 13, borderRadius: 10, border: 0, cursor: 'pointer', background: i === on ? MK_AC : 'transparent', color: i === on ? '#fff' : 'var(--text-muted)', fontWeight: i === on ? 600 : 400, transition: 'background .2s, color .2s' }}>{t}</button>
        ))}
      </div>
    );
  }
  if (variant === 'segmented') {
    return (
      <div style={{ position: 'relative', display: 'flex', background: 'var(--surface-hover)', borderRadius: 10, padding: 3, minWidth: 420 }}>
        <div style={{ position: 'absolute', top: 3, bottom: 3, width: `calc((100% - 6px) / ${n})`, left: `calc(3px + ${on} * ((100% - 6px) / ${n}))`, background: 'var(--surface-card)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left .3s cubic-bezier(.4,0,.2,1)' }} />
        {items.map((t, i) => (
          <button key={i} type="button" onClick={() => setOn(i)} style={{ position: 'relative', zIndex: 1, flex: 1, textAlign: 'center', padding: '8px 14px', fontSize: 12.5, border: 0, cursor: 'pointer', background: 'transparent', color: i === on ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === on ? 600 : 400, transition: 'color .2s' }}>{t}</button>
        ))}
      </div>
    );
  }
  // underline
  return (
    <div style={{ minWidth: 420 }}>
      <div style={{ position: 'relative', display: 'flex' }}>
        {items.map((t, i) => (
          <button key={i} type="button" onClick={() => setOn(i)} style={{ flex: 1, textAlign: 'center', padding: '11px 14px', fontSize: 13, border: 0, cursor: 'pointer', background: 'transparent', color: i === on ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === on ? 500 : 400, transition: 'color .2s' }}>{t}</button>
        ))}
        <div style={{ position: 'absolute', bottom: 0, height: 2, background: MK_AC, width: `${100 / n}%`, transform: `translateX(${on * 100}%)`, transition: MK_EASE }} />
      </div>
      <div style={{ height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

function MkPillBar({ variant }) {
  const [on, setOn] = React.useState(0);
  const items = MK_PILL_ITEMS;
  const chipStyle = (i) => {
    const active = i === on;
    const s = { padding: '8px 16px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', border: '1px solid transparent', background: 'transparent', color: 'var(--text-muted)', transition: 'background .2s, color .2s, border-color .2s', fontWeight: active ? 600 : 400 };
    if (active && variant === 'solid') { s.background = MK_AC; s.color = '#fff'; }
    if (active && variant === 'outline') { s.borderColor = MK_AC; s.color = MK_AC; }
    if (active && variant === 'soft') { s.background = `color-mix(in srgb, ${MK_AC} 16%, transparent)`; s.color = MK_AC; }
    return s;
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 420 }}>
      {items.map((t, i) => <button key={i} type="button" onClick={() => setOn(i)} style={chipStyle(i)}>{t}</button>)}
    </div>
  );
}

var MK_MENU_MAP = {
  'tpl-menu-sidebar-pill': ['sidebar', 'pill'], 'tpl-menu-sidebar-notch': ['sidebar', 'notch'], 'tpl-menu-sidebar-rail': ['sidebar', 'rail'],
  'tpl-menu-tabs-underline': ['tabs', 'underline'], 'tpl-menu-tabs-filled': ['tabs', 'filled'], 'tpl-menu-tabs-segmented': ['tabs', 'segmented'],
  'tpl-menu-pills-solid': ['pills', 'solid'], 'tpl-menu-pills-outline': ['pills', 'outline'], 'tpl-menu-pills-soft': ['pills', 'soft'],
};

function MkMenuDemo({ id }) {
  const m = MK_MENU_MAP[id];
  React.useLayoutEffect(() => { const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 0); return () => clearTimeout(t); }, []);
  if (!m) return null;
  const family = m[0], variant = m[1];
  const el = family === 'sidebar' ? <MkSidebar variant={variant} /> : family === 'tabs' ? <MkTabBar variant={variant} /> : <MkPillBar variant={variant} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ transform: family === 'sidebar' ? 'scale(1.05)' : 'scale(1.08)' }}>{el}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Click the items — the highlight follows.</div>
    </div>
  );
}

// A large, live render of an asset for the Preview modal — same renderers as the card thumbnails,
// just given more room (templates fit a big box; shaders fill; components/animations scale up).
function BigPreview({ type, spec }) {
  const box = { position: 'relative', minHeight: 340, maxHeight: '62vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, overflow: 'hidden', boxSizing: 'border-box' };
  if (type === 'shader' && spec.code) {
    return <div style={{ ...box, background: 'var(--bg-void)', padding: 0 }}>{window.ShaderFill ? <div style={{ position: 'absolute', inset: 0 }}><window.ShaderFill code={spec.code} speed={1} /></div> : null}</div>;
  }
  if (type === 'component' && spec.base) {
    const node = { id: 'cs_' + (spec.id || 'x'), kind: spec.base, name: (spec.props && spec.props.label) || '', ...(spec.props || {}) };
    return <div className="lattice-grid" style={{ ...box, background: 'var(--surface)' }}><NodePreview node={node} maxW={560} maxH={320} /></div>;
  }
  if (type === 'animation' && spec.states) {
    return <div className="lattice-grid" style={{ ...box, background: 'var(--surface)' }}><div style={{ transform: 'scale(1.7)' }}><AnimThumb states={spec.states} id={spec.id} /></div></div>;
  }
  // Menu templates get a live, clickable demo instead of the static canvas.
  if (type === 'template' && MK_MENU_MAP[spec.id]) {
    return <div className="lattice-grid" style={{ ...box, background: 'var(--surface)' }}><MkMenuDemo id={spec.id} /></div>;
  }
  const inner = TemplateCanvasView({ canvas: spec.canvas, maxW: 780, maxH: 460 });
  return <div className="lattice-grid" style={{ ...box, background: 'var(--surface)' }}>{inner || <AssetThumb icon="layout-template" />}</div>;
}

// In-page Preview modal: a lightweight backdrop + panel (own width, not the small DS Dialog) that
// shows the asset large with the same Install / Use template actions as the card.
function PreviewModal({ entry, installed, busy, onClose, onUse, onInstall }) {
  const { Button, Tag } = window.LatticeDesignSystem_e801cb;
  const item = entry.item, type = entry.type;
  const spec = { id: item.id, base: item.base, props: item.props, code: item.code, states: item.states, canvas: item.canvas };
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Paint any Lucide glyphs the enlarged preview introduces.
    const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 0);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [item.id]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(880px, 96vw)', maxHeight: '92vh', overflow: 'auto', background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
            {item.description && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>}
          </div>
          <Tag shape="pill">{(TYPE_META[type] && TYPE_META[type].label) || type}</Tag>
          <Button variant="ghost" size="sm" onClick={onClose} iconLeft={<Ic n="x" s={15} />}>Close</Button>
        </div>
        <PreviewBoundary fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Preview unavailable.</div>}>
          <BigPreview type={type} spec={spec} />
        </PreviewBoundary>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end' }}>
          {type === 'template' && (
            <Button variant="solid" size="sm" disabled={busy} onClick={onUse} iconLeft={<Ic n="rocket" s={14} />}>Use template</Button>
          )}
          <Button variant={installed ? 'ghost' : (type === 'template' ? 'outline' : 'solid')} size="sm"
            disabled={busy || (installed && type !== 'template')} onClick={onInstall}
            iconLeft={<Ic n={installed ? 'check' : 'download'} s={14} />}>
            {installed ? 'Installed' : 'Install'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Market -------------------------------------------------------------------------------------
function Market() {
  const { Button } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [catalog, setCatalog] = React.useState(null);
  const [library, setLibrary] = React.useState([]);
  const [busy, setBusy] = React.useState('');
  const [preview, setPreview] = React.useState(null); // { item, key, type } for the Preview modal

  const reloadLib = React.useCallback(() => api.library().then(r => setLibrary(r.items)).catch(() => {}), []);
  React.useEffect(() => {
    api.market().then(setCatalog).catch(() => setCatalog({}));
    reloadLib();
  }, [reloadLib]);

  // Previews mount after the catalog resolves, so paint any Lucide glyphs they introduce (icon
  // buttons, input adornments, alerts). renderLucideIcons is idempotent (skips painted glyphs).
  React.useEffect(() => {
    if (!catalog) return;
    const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 0);
    return () => clearTimeout(t);
  }, [catalog]);

  const installedSources = new Set(library.map(i => i.source).filter(Boolean));

  const install = async (kind, item) => {
    setBusy(item.id);
    try { await api.installItem(toInstallPayload(kind, item)); await reloadLib(); toast({ tone: 'success', title: 'Added to library', message: item.name }); }
    catch (ex) { toast({ tone: 'warning', title: 'Install failed', message: ex.message }); } finally { setBusy(''); }
  };

  const useTemplate = async (item) => {
    setBusy(item.id);
    try { const r = await api.createProject({ name: item.name, canvas: item.canvas || {} }); openEditorProject(r.project.id); }
    catch (ex) { toast({ tone: 'warning', title: 'Could not create project', message: ex.message }); setBusy(''); }
  };

  const sections = [
    ['componentStyles', 'Component styles', 'component'],
    ['shaders', 'Shaders', 'shader'],
    ['animations', 'Animations', 'animation'],
    ['templates', 'Templates', 'template'],
  ];

  const renderCard = (item, key, type) => {
    const installed = installedSources.has(item.id);
    const tag = type === 'component' ? (KIND_LABEL[item.base] || 'Component') : TYPE_META[type].label;
    const spec = { id: item.id, base: item.base, props: item.props, code: item.code, states: item.states, canvas: item.canvas };
    const openPreview = () => setPreview({ item, key, type });
    return (
      <Card key={item.id}>
        {/* Thumbnail doubles as a preview trigger (hover reveals a "Preview" hint). */}
        <div className="mk-thumb" onClick={openPreview} style={{ position: 'relative', cursor: 'pointer' }} title="Click to preview">
          <AssetPreview type={type} spec={spec} />
          <div className="mk-thumb-ov"><span><Ic n="eye" s={13} /> Preview</span></div>
        </div>
        <CardBody name={item.name} description={item.description} tag={tag}>
          {type === 'template' && (
            <Button variant="solid" size="sm" disabled={busy === item.id} onClick={() => useTemplate(item)} iconLeft={<Ic n="rocket" s={14} />}>Use template</Button>
          )}
          <Button variant="ghost" size="sm" onClick={openPreview} iconLeft={<Ic n="eye" s={14} />}>Preview</Button>
          <Button variant={installed ? 'ghost' : (type === 'template' ? 'outline' : 'solid')} size="sm"
            disabled={busy === item.id || (installed && type !== 'template')}
            onClick={() => install(key, item)}
            iconLeft={<Ic n={installed ? 'check' : 'download'} s={14} />}>
            {installed ? 'Installed' : 'Install'}
          </Button>
        </CardBody>
      </Card>
    );
  };

  return (
    <AppShell active="/market" user={user} title="Market">
      <div style={{ marginBottom: 20, maxWidth: 640 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Install styles, shaders, animations and starter templates into your Library, then enable
          them per project from the editor's <strong style={{ color: 'var(--text-secondary)' }}>Settings → Assets &amp; Plugins</strong>.
        </div>
      </div>

      {catalog === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : sections.map(([key, label, type]) => {
        const items = catalog[key] || [];
        if (!items.length) return null;
        // Component styles and templates are sub-grouped (Buttons…, or Starters / Sidebar menus…);
        // the rest render flat.
        if (key === 'componentStyles' || key === 'templates') {
          const order = key === 'templates' ? TEMPLATE_GROUP_ORDER : GROUP_ORDER;
          const defGroup = key === 'templates' ? 'Templates' : 'Components';
          const groups = {};
          items.forEach(it => { const g = it.group || defGroup; (groups[g] = groups[g] || []).push(it); });
          const ordered = [...order.filter(g => groups[g]), ...Object.keys(groups).filter(g => !order.includes(g))];
          return (
            <div key={key} style={{ marginBottom: 30 }}>
              <SectionHead>{label}</SectionHead>
              {ordered.map(g => (
                <div key={g} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 2px 10px' }}>{g}</div>
                  <Grid>{groups[g].map(it => renderCard(it, key, type))}</Grid>
                </div>
              ))}
            </div>
          );
        }
        return (
          <div key={key} style={{ marginBottom: 30 }}>
            <SectionHead>{label}</SectionHead>
            <Grid>{items.map(it => renderCard(it, key, type))}</Grid>
          </div>
        );
      })}

      {preview && (
        <PreviewModal
          entry={preview}
          installed={installedSources.has(preview.item.id)}
          busy={busy === preview.item.id}
          onClose={() => setPreview(null)}
          onUse={() => { const it = preview.item; setPreview(null); useTemplate(it); }}
          onInstall={() => install(preview.key, preview.item)}
        />
      )}

      <style>{`
        .mk-thumb-ov { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.34); opacity: 0; transition: opacity .15s ease; pointer-events: none; }
        .mk-thumb:hover .mk-thumb-ov { opacity: 1; }
        .mk-thumb-ov > span { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #fff; background: rgba(0,0,0,0.6); padding: 6px 11px; }
      `}</style>
    </AppShell>
  );
}
window.Market = Market;

// --- Plugins ------------------------------------------------------------------------------------
function Plugins() {
  const { Button, Tag } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [catalog, setCatalog] = React.useState(null);
  const [library, setLibrary] = React.useState([]);
  const [busy, setBusy] = React.useState('');

  const reloadLib = React.useCallback(() => api.library().then(r => setLibrary(r.items)).catch(() => {}), []);
  React.useEffect(() => { api.market().then(setCatalog).catch(() => setCatalog({})); reloadLib(); }, [reloadLib]);

  const installedSources = new Set(library.map(i => i.source).filter(Boolean));
  const install = async (item) => {
    setBusy(item.id);
    try { await api.installItem(toInstallPayload('plugins', item)); await reloadLib(); toast({ tone: 'success', title: 'Plugin installed', message: item.name }); }
    catch (ex) { toast({ tone: 'warning', title: 'Install failed', message: ex.message }); } finally { setBusy(''); }
  };

  const plugins = (catalog && catalog.plugins) || [];

  return (
    <AppShell active="/plugins" user={user} title="Plugins">
      <div style={{ marginBottom: 20, maxWidth: 640, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Plugins add design shortcuts to the editor — quick actions with optional keyboard shortcuts.
        Install here, then enable a plugin per project in the editor's Settings; run its actions from the
        command menu (<strong style={{ color: 'var(--text-secondary)' }}>Ctrl/⌘ K</strong>).
      </div>
      {catalog === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : !plugins.length ? (
        <EmptyState icon="blocks" title="No plugins yet" message="Plugins will appear here." />
      ) : (
        <Grid>
          {plugins.map(p => {
            const installed = installedSources.has(p.id);
            return (
              <Card key={p.id}>
                <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-secondary)' }}><Ic n={p.icon || 'blocks'} s={17} /></div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                </div>
                <CardBody description={p.description} name="">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(p.actions || []).map(a => <Tag key={a.id}>{a.label}{a.shortcut ? ' · ' + a.shortcut.toUpperCase() : ''}</Tag>)}
                    </div>
                    <Button variant={installed ? 'ghost' : 'solid'} size="sm" fullWidth disabled={busy === p.id || installed}
                      onClick={() => install(p)} iconLeft={<Ic n={installed ? 'check' : 'download'} s={14} />}>
                      {installed ? 'Installed' : 'Install'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </Grid>
      )}
    </AppShell>
  );
}
window.Plugins = Plugins;

// --- Library ------------------------------------------------------------------------------------
function Library() {
  const { Button, Dialog, Input } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [items, setItems] = React.useState(null);
  const [dlg, setDlg] = React.useState(null); // { mode:'rename'|'delete', item }
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => api.library().then(r => setItems(r.items)).catch(() => setItems([])), []);
  React.useEffect(() => { load(); }, [load]);

  // Repaint Lucide glyphs that installed-asset previews introduce, once items resolve.
  React.useEffect(() => {
    if (!items) return;
    const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 0);
    return () => clearTimeout(t);
  }, [items]);

  const submit = async () => {
    setBusy(true);
    try {
      if (dlg.mode === 'rename') { await api.updateItem(dlg.item.id, { name: name.trim() || dlg.item.name }); toast({ tone: 'success', title: 'Renamed' }); }
      if (dlg.mode === 'delete') { await api.deleteItem(dlg.item.id); toast({ tone: 'neutral', title: 'Removed from library' }); }
      setDlg(null); load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setBusy(false); }
  };

  const groups = ['component', 'shader', 'animation', 'template', 'plugin'];
  const byType = (t) => (items || []).filter(i => i.type === t);

  return (
    <AppShell active="/library" user={user} title="Library"
      actions={<Button variant="outline" size="sm" onClick={() => navigate('/market')} iconLeft={<Ic n="store" s={15} />}>Browse market</Button>}>
      {items === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : !items.length ? (
        <EmptyState icon="library" title="Your library is empty"
          message="Install styles, shaders, animations or plugins from the Market to reuse across projects."
          action={<Button variant="solid" size="sm" onClick={() => navigate('/market')} iconLeft={<Ic n="store" s={15} />}>Open Market</Button>} />
      ) : groups.map(t => {
        const list = byType(t);
        if (!list.length) return null;
        return (
          <div key={t} style={{ marginBottom: 26 }}>
            <SectionHead>{(TYPE_META[t].label) + 's'}</SectionHead>
            <Grid>
              {list.map(it => (
                <Card key={it.id}>
                  <AssetPreview type={it.type} spec={{ id: it.id, base: it.data && it.data.base, props: it.data && it.data.props, code: it.data && it.data.code, states: it.data && it.data.states, canvas: it.data && it.data.canvas }} />
                  <CardBody name={it.name} description={it.source ? ('from market · ' + it.source) : 'custom'} tag={it.type === 'component' ? ((it.data && KIND_LABEL[it.data.base]) || 'Component') : TYPE_META[t].label}>
                    <Button variant="outline" size="sm" onClick={() => { setName(it.name); setDlg({ mode: 'rename', item: it }); }} iconLeft={<Ic n="pencil" s={14} />}>Rename</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDlg({ mode: 'delete', item: it })} iconLeft={<Ic n="trash-2" s={14} />}>Delete</Button>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </div>
        );
      })}

      <Dialog open={!!dlg && dlg.mode === 'rename'} onClose={() => setDlg(null)} title="Rename item"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="solid" size="sm" disabled={busy} onClick={submit}>Save</Button></>}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </Dialog>
      <Dialog open={!!dlg && dlg.mode === 'delete'} onClose={() => setDlg(null)} title="Remove from library?"
        description={dlg && dlg.mode === 'delete' ? `"${dlg.item.name}" will be removed from your library.` : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={submit}>Remove</Button></>}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Projects that enabled it will no longer see it.</div>
      </Dialog>
    </AppShell>
  );
}
window.Library = Library;
