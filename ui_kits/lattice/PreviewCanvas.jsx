/* global React, Chart */
// Preview / Run mode — renders each node as real, styled UI and runs animation, hover & actions
// live: it's an interactive click-through prototype.

function pvKind(n) {
  if (n.kind) return n.kind;
  const byIcon = { frame: 'frame', 'rows-3': 'stack', 'layout-grid': 'grid', type: 'heading', square: 'button', 'text-cursor-input': 'input', image: 'image', minus: 'divider' };
  return byIcon[n.icon] || 'frame';
}
const WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const FONT = { 'Grotesk (UI)': 'var(--font-sans)', 'Serif display': 'var(--font-serif-display)', 'Mono': 'var(--font-mono)', 'System': 'system-ui, sans-serif' };
const BTN_FS = { sm: 12, md: 13, lg: 14 };
// Typography → Align, mapped onto the flex axis for kinds whose content is a single child.
const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end', justify: 'flex-start' };
const justifyFor = (align, fallback) => JUSTIFY[align || fallback] || 'flex-start';

const KEYFRAMES = `
@keyframes lt-fade{from{opacity:0}to{opacity:1}}
@keyframes lt-slide-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes lt-slide-down{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:none}}
@keyframes lt-slide-left{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes lt-slide-right{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}
@keyframes lt-scale{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes lt-pop{0%{opacity:0;transform:scale(.8)}70%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}`;

function textStyle(node, kind) {
  const fs = node.fontSize || (kind === 'heading' ? 28 : 14);
  const align = node.textAlign || 'left';
  return {
    color: node.textColor || (node.fillColor ? '#000' : 'var(--text-primary)'),
    fontFamily: FONT[node.fontFamily] || (kind === 'heading' ? 'var(--font-serif-display)' : 'var(--font-sans)'),
    fontSize: fs, fontWeight: WEIGHT[node.fontWeight] || (kind === 'heading' ? 600 : 400),
    lineHeight: node.lineHeight ?? 1.4, letterSpacing: (node.letterSpacing ?? 0) + 'px',
    textTransform: node.textTransform && node.textTransform !== 'none' ? node.textTransform : undefined,
    textAlign: align, letterSpacingRaw: node.letterSpacing,
  };
}

// Text with real drop shadows: each shadow is a duplicated, dilated, blurred copy of the glyphs
// painted behind the live text — so `spread` behaves exactly like box-shadow's spread.
// `type` is the base type style; `shadowType` is it minus any gradient text fill.
function ShadowedText({ node, type, shadowType, children }) {
  const layers = window.textShadowLayers ? window.textShadowLayers(node) : [];
  if (!layers.length) return <span style={type}>{children}</span>;
  return (
    <span style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      {layers.map((ls, i) => <span key={i} aria-hidden="true" style={{ ...shadowType, ...ls }}>{children}</span>)}
      <span style={{ ...type, position: 'relative' }}>{children}</span>
    </span>
  );
}

// Every canvas/preview icon goes through here so size, colour, stroke, rotation, flip and opacity
// all work (see the `[data-lt-icon]` rules in index.html).
function LIcon({ name, ...o }) {
  if (!name) return null;
  return <i data-lt-icon data-lucide={name} style={window.iconStyle ? window.iconStyle(o) : { width: o.size, height: o.size }}></i>;
}

const INPUT_SIZE = { sm: { fs: 12, px: 8 }, md: { fs: 13, px: 10 }, lg: { fs: 14, px: 12 } };

// A real form field: optional label / helper / error rows around the input, prefix & suffix icons,
// clear button, password show/hide, and the required / disabled / read-only / invalid states.
// Rows only render when their text is set, so a bare field lays out exactly as it always has.
function InputField({ node, tfx, fill }) {
  const [reveal, setReveal] = React.useState(false);
  // Controlled so the Inspector's "Default value" shows up live, yet still typable in Preview.
  const inputRef = React.useRef(null);
  // When bound to a workflow variable (and a runtime is present, i.e. Preview), the field reads and
  // writes the shared variable store so workflows see typed values in real time. Otherwise it keeps
  // its own local value exactly as before (design canvas / anim canvas have no runtime).
  const rt = React.useContext(window.WorkflowRuntime);
  const bound = !!(rt && node.bindVar);
  const [localVal, setLocalVal] = React.useState(node.inputValue || '');
  React.useEffect(() => { if (!bound) setLocalVal(node.inputValue || ''); }, [node.inputValue, bound]);
  const val = bound ? (rt.getVar(node.bindVar) ?? '') : localVal;
  const setVal = (v) => { if (bound) rt.setVar(node.bindVar, v); else setLocalVal(v); };
  // Adornment glyphs are added/swapped outside the App's icon re-scan, so paint them here.
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); });

  const sz = INPUT_SIZE[node.inputSize] || INPUT_SIZE.md;
  const invalid = !!node.invalid;

  const bd = invalid ? `1px solid var(--status-danger-fg)`
    : node.borderWidth === 0 ? 'none'
    : node.borderWidth > 0 ? `${node.borderWidth}px ${node.borderStyle || 'solid'} ${node.borderColor || 'var(--border-default)'}`
    : '1px solid var(--border-default)';
  const radius = (window.nodeFx && (window.nodeFx(node) || {}).borderRadius) || undefined;

  const isPassword = node.inputType === 'password';
  const type = isPassword && reveal ? 'text' : (node.inputType || 'text');
  // The show/hide toggle owns the trailing slot, so it replaces the suffix icon entirely. Matching
  // on icon name was fragile (lucide has eye, eye-off, eye-closed, eye-dashed, scan-eye, plus
  // look-alikes), so the rule is structural: toggle on ⇒ no suffix icon.
  const showToggle = isPassword && !!node.passwordToggle;
  const ico = {
    size: node.inputIconSize || 15, color: node.inputIconColor || 'var(--text-muted)',
    stroke: node.inputIconStroke, rotate: node.inputIconRotate,
    flipH: node.inputIconFlipH, flipV: node.inputIconFlipV, opacity: node.inputIconOpacity,
  };
  // preventDefault on mousedown so clicking an adornment doesn't steal focus from the field
  const glyph = (name, onClick) => (
    <span onMouseDown={onClick ? (e => e.preventDefault()) : undefined} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', cursor: onClick ? 'pointer' : 'default', flex: 'none' }}>
      <LIcon name={name} {...ico} />
    </span>
  );
  const clearValue = () => {
    if (node.disabled || node.readOnly) return;
    setVal('');
    if (inputRef.current) inputRef.current.focus();
  };

  const field = (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', gap: 7,
      border: bd, borderRadius: radius, background: fill || 'var(--surface-inset)',
      padding: `0 ${sz.px}px`, opacity: node.disabled ? 0.5 : 1, cursor: node.disabled ? 'not-allowed' : 'auto' }}>
      {node.prefixIcon && glyph(node.prefixIcon)}
      <input
        ref={inputRef}
        data-lt-input
        type={type}
        title={node.name}
        placeholder={node.placeholder || node.label || 'Text'}
        value={val}
        onChange={e => setVal(e.target.value)}
        name={node.inputName || undefined}
        autoComplete={node.autocomplete || undefined}
        maxLength={node.maxLength || undefined}
        min={node.inputType === 'number' ? node.min : undefined}
        max={node.inputType === 'number' ? node.max : undefined}
        step={node.inputType === 'number' ? node.step : undefined}
        required={!!node.required}
        disabled={!!node.disabled}
        readOnly={!!node.readOnly}
        aria-invalid={invalid || undefined}
        style={{
          flex: 1, minWidth: 0, height: '100%', border: 0, outline: 'none', background: 'transparent',
          color: node.textColor || 'var(--text-primary)',
          '--lt-placeholder': node.placeholderColor || node.textColor || undefined,
          fontFamily: FONT[node.fontFamily] || 'var(--font-sans)',
          fontSize: node.fontSize || sz.fs,
          textAlign: node.textAlign || undefined,
          cursor: node.disabled ? 'not-allowed' : 'auto',
          ...tfx,
        }} />
      {node.clearable && glyph('x', clearValue)}
      {node.suffixIcon && !showToggle && glyph(node.suffixIcon)}
      {/* The reveal button owns the trailing slot, so it renders last. */}
      {showToggle && glyph(reveal ? 'eye-off' : 'eye', () => setReveal(v => !v))}
    </div>
  );

  const label = node.fieldLabel;
  const note = invalid && node.errorText ? node.errorText : node.helperText;
  if (!label && !note) return <div style={{ width: '100%', height: '100%', display: 'flex' }}>{field}</div>;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, boxSizing: 'border-box' }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 500, color: node.textColor || 'var(--text-secondary)', fontFamily: FONT[node.fontFamily] || 'var(--font-sans)', flex: 'none' }}>
          {label}{node.required && <span style={{ color: 'var(--status-danger-fg)' }}> *</span>}
        </span>
      )}
      {field}
      {note && (
        <span style={{ fontSize: 11.5, color: invalid && node.errorText ? 'var(--status-danger-fg)' : 'var(--text-muted)', fontFamily: FONT[node.fontFamily] || 'var(--font-sans)', flex: 'none' }}>{note}</span>
      )}
    </div>
  );
}

const SHAPE_KINDS = new Set(['rect', 'ellipse', 'line', 'triangle', 'star', 'polygon', 'arrow']);
const POLY_KINDS = new Set(['triangle', 'star', 'polygon', 'arrow']);
window.SHAPE_KINDS = SHAPE_KINDS;

// Polygon points in a 0..100 box (the svg stretches to the node via preserveAspectRatio=none).
function shapePoints(kind, node) {
  if (kind === 'triangle') return '50,3 97,97 3,97';
  if (kind === 'arrow') return '2,34 60,34 60,10 98,50 60,90 60,66 2,66';
  if (kind === 'polygon') {
    const n = Math.max(3, node.sides || 6), pts = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push((50 + 48 * Math.cos(a)).toFixed(1) + ',' + (50 + 48 * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  }
  if (kind === 'star') {
    const p = Math.max(3, node.points || 5), ir = Math.max(0.05, node.innerRatio ?? 0.5) * 48, pts = [];
    for (let i = 0; i < p * 2; i++) { const r = i % 2 ? ir : 48; const a = -Math.PI / 2 + i * Math.PI / p; pts.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  }
  return '';
}

function svgGradient(gid, g) {
  const stops = (g.stops || []).slice().sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
    .map((s, i) => <stop key={i} offset={(s.pos ?? 0) + '%'} style={{ stopColor: s.color || '#000' }} />);
  if (g.type === 'radial') return <radialGradient id={gid} cx={(g.cx ?? 50) + '%'} cy={(g.cy ?? 50) + '%'} r="60%">{stops}</radialGradient>;
  const a = (g.angle ?? 180) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
  return <linearGradient id={gid} x1={(50 - dx * 50) + '%'} y1={(50 - dy * 50) + '%'} x2={(50 + dx * 50) + '%'} y2={(50 + dy * 50) + '%'}>{stops}</linearGradient>;
}

// Shapes own their whole style (PreviewNode returns this directly, no fx wrapper). Fill/stroke go
// through CSS style so design tokens (var(--…)) resolve; polygonal kinds use inline SVG.
function renderShape(node) {
  const kind = pvKind(node);
  const fx = (window.nodeFx && window.nodeFx(node)) || {};
  const fillCss = (window.fillBg && window.fillBg(node)) || node.fillColor || 'var(--text-primary)';

  if (kind === 'rect') return <div style={{ width: '100%', height: '100%', background: fillCss, ...fx }} />;
  if (kind === 'ellipse') return <div style={{ width: '100%', height: '100%', background: fillCss, ...fx, borderRadius: '50%' }} />;
  if (kind === 'line') {
    const t = node.borderWidth || 2;
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', ...fx }}>
      <div style={{ width: '100%', height: t, background: node.borderColor || node.fillColor || 'var(--text-primary)' }} />
    </div>;
  }
  // triangle / star / polygon / arrow
  const gid = 'g_' + node.id;
  const grad = node.gradient && node.gradient.stops && node.gradient.stops.length;
  const sw = node.borderWidth || 0;
  const { border, borderRadius, ...svgFx } = fx; // svg draws its own stroke
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible', ...svgFx }}>
      {grad && <defs>{svgGradient(gid, node.gradient)}</defs>}
      <polygon points={shapePoints(kind, node)} strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        style={{ fill: grad ? `url(#${gid})` : fillCss, stroke: sw ? (node.borderColor || 'var(--text-primary)') : 'none', strokeWidth: sw }} />
    </svg>
  );
}

function pvRender(node) {
  const DS = window.LatticeDesignSystem_e801cb;
  const kind = pvKind(node);
  const fill = window.fillBg ? window.fillBg(node) : node.fillColor;   // gradient or solid
  const solidFill = node.gradient ? null : node.fillColor;            // solid only (borders/contrast)
  const box = { width: '100%', height: '100%', boxSizing: 'border-box' };
  // Text layer styles. `tfx` holds only inheritable props, so spreading it on a wrapper reaches the
  // label inside a DS component. `tgrad` clips a gradient to the glyphs (direct-text kinds only).
  const tfx = window.textFx ? window.textFx(node) : null;
  const tgrad = (window.TEXT_GRADIENT_KINDS && window.TEXT_GRADIENT_KINDS.has(kind) && window.textGradientFx)
    ? window.textGradientFx(node) : null;

  if (kind === 'button') {
    const v = node.variant || 'solid';
    const palette = {
      solid: { background: fill || 'var(--action-solid)', color: solidFill ? '#000' : 'var(--action-solid-text)', border: '1px solid ' + (solidFill || (fill ? 'transparent' : 'var(--action-solid)')) },
      outline: { background: fill || 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
      ghost: { background: fill || 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
      danger: { background: fill || 'transparent', color: 'var(--status-danger-fg)', border: '1px solid var(--status-danger-fg)' },
    }[v];
    // Icon placement: left (default), right, or icon-only (label hidden).
    const pos = node.btnIconPos || 'left';
    const iconEl = node.btnIcon ? (
      <LIcon name={node.btnIcon} size={node.btnIconSize || 15} color={node.btnIconColor}
        stroke={node.btnIconStroke} rotate={node.btnIconRotate}
        flipH={node.btnIconFlipH} flipV={node.btnIconFlipV} opacity={node.btnIconOpacity} />
    ) : null;
    return (
      <button type="button" disabled={!!node.disabled} style={{ ...box, ...palette, display: 'inline-flex', alignItems: 'center', justifyContent: justifyFor(node.textAlign, 'center'), gap: node.btnIconGap ?? 7, fontFamily: FONT[node.fontFamily] || 'var(--font-sans)', fontWeight: WEIGHT[node.fontWeight] || 500, fontSize: node.fontSize || BTN_FS[node.btnSize] || 13, cursor: node.disabled ? 'not-allowed' : 'pointer', opacity: node.disabled ? 0.45 : 1, ...tfx }}>
        {pos !== 'right' && iconEl}{pos !== 'only' && (node.label ?? node.name)}{pos === 'right' && iconEl}
      </button>
    );
  }
  if (kind === 'input') return <InputField node={node} tfx={tfx} fill={fill} />;
  if (kind === 'select') {
    const opts = String(node.optionsText || '').split(',').map(s => s.trim()).filter(Boolean);
    return <DS.Select size="sm" options={opts.length ? opts : ['Option']} wrapStyle={box} style={{ height: '100%' }} />;
  }
  if (kind === 'switch') return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: justifyFor(node.textAlign, 'left'), ...tfx }}><DS.Switch label={node.label} defaultChecked={!!node.checked} /></div>;
  if (kind === 'checkbox') return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: justifyFor(node.textAlign, 'left'), ...tfx }}><DS.Checkbox label={node.label || 'Option'} defaultChecked={!!node.checked} /></div>;
  if (kind === 'badge') return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: justifyFor(node.textAlign, 'center'), ...tfx }}><DS.Badge tone={node.tone || 'neutral'}>{node.label ?? node.name}</DS.Badge></div>;
  if (kind === 'avatar') {
    const s = Math.min(node.w, node.h);
    const size = s <= 24 ? 'xs' : s <= 30 ? 'sm' : s <= 44 ? 'md' : 'lg';
    return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: justifyFor(node.textAlign, 'center'), ...tfx }}><DS.Avatar name={node.label || 'A'} src={node.src || undefined} size={size} /></div>;
  }
  if (kind === 'icon') {
    const VALIGN = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };
    return <div style={{ ...box, display: 'flex', alignItems: VALIGN[node.iconVAlign] || 'center', justifyContent: justifyFor(node.iconAlign, 'center') }}>
      <LIcon name={node.iconName || 'star'} size={node.iconSize || 24} color={node.textColor || 'var(--text-primary)'}
        stroke={node.iconStroke} rotate={node.iconRotate}
        flipH={node.iconFlipH} flipV={node.iconFlipV} opacity={node.iconOpacity} />
    </div>;
  }
  if (kind === 'link') {
    const ts = textStyle(node, 'link');
    // links underline by default; an explicit Decoration setting (incl. "none") wins
    const deco = !node.textDecoration ? 'underline' : (node.textDecoration === 'none' ? 'none' : undefined);
    const { textShadow, ...tfxNoShadow } = tfx || {};
    const base = { color: node.textColor || 'var(--blue-base)', textDecoration: deco, fontFamily: ts.fontFamily, fontSize: ts.fontSize, fontWeight: ts.fontWeight, letterSpacing: (node.letterSpacing ?? 0) + 'px', textTransform: ts.textTransform, ...tfxNoShadow };
    return (
      <a href={node.href || '#'} onClick={e => e.preventDefault()} style={{ ...box, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <ShadowedText node={node} type={{ ...base, ...tgrad }} shadowType={base}>{node.label || 'Link'}</ShadowedText>
      </a>
    );
  }
  if (kind === 'list') {
    const items = String(node.itemsText || 'First item\nSecond item\nThird item').split('\n').filter(s => s.trim());
    const Tag = node.ordered ? 'ol' : 'ul';
    return <Tag style={{ ...box, margin: 0, paddingLeft: 20, overflow: 'auto', color: node.textColor || 'var(--text-secondary)', fontFamily: FONT[node.fontFamily] || 'var(--font-sans)', fontSize: node.fontSize || 13, lineHeight: node.lineHeight ?? 1.7, textAlign: node.textAlign || undefined, ...tfx }}>{items.map((it, i) => <li key={i}>{it}</li>)}</Tag>;
  }
  if (kind === 'progress') {
    const v = Math.max(0, Math.min(100, node.value ?? 60));
    return <div style={{ ...box, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '100%', height: 8, background: 'var(--surface-hover)', overflow: 'hidden' }}><div style={{ width: v + '%', height: '100%', background: fill || 'var(--action-solid)' }} /></div>
    </div>;
  }
  if (kind === 'chart') {
    return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fill || 'transparent' }}>
      <Chart type={node.chartType || 'bar'} data={node.chartData} labels={node.chartLabels} color={node.chartColor} width={node.w} height={node.h} />
    </div>;
  }
  if (kind === 'image') {
    return node.src
      ? <img src={node.src} alt={node.label || ''} style={{ ...box, objectFit: node.fit || 'cover', borderRadius: node.radius || 0, border: '1px solid var(--border-subtle)' }} />
      : <div style={{ ...box, background: fill || 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: node.radius || 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)' }}><i data-lucide="image" style={{ width: 24, height: 24 }}></i></div>;
  }
  if (kind === 'divider') {
    const t = node.thickness || 1;
    return node.orientation === 'vertical'
      ? <div style={{ ...box, display: 'flex', justifyContent: 'center' }}><div style={{ width: t, height: '100%', background: fill || 'var(--border-default)' }} /></div>
      : <div style={{ ...box, display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', height: t, background: fill || 'var(--border-default)' }} /></div>;
  }
  if (kind === 'heading' || kind === 'text') {
    const ts = textStyle(node, kind);
    // Outer div owns layout + the node's fill background; the inner span owns the type styles so a
    // gradient text fill (background-clip:text) doesn't consume the node's own background.
    // `textShadow` is dropped here — these kinds get real layered shadows instead (see ShadowedText).
    const { textShadow, ...tfxNoShadow } = tfx || {};
    const base = { color: ts.color, fontFamily: ts.fontFamily, fontSize: ts.fontSize, fontWeight: ts.fontWeight, lineHeight: ts.lineHeight, letterSpacing: (node.letterSpacing ?? 0) + 'px', textTransform: ts.textTransform, ...tfxNoShadow };
    return (
      <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: ts.textAlign === 'center' ? 'center' : ts.textAlign === 'right' ? 'flex-end' : 'flex-start', textAlign: ts.textAlign, background: fill || 'transparent', padding: fill ? '0 8px' : 0 }}>
        <ShadowedText node={node} type={{ ...base, ...tgrad }} shadowType={base}>{node.label ?? node.name}</ShadowedText>
      </div>
    );
  }
  // container (frame / stack / grid / card / section) — no built-in border; it comes from the
  // Border setting via nodeFx (so Preview matches the editor, which draws containers borderless).
  return <div style={{ ...box, background: fill || 'var(--surface-card)', padding: node.padding || 0 }} />;
}

// Wrap the rendered component in an effects layer (radius / border / shadow / glow / blur /
// opacity / rotation / blend). An element's own box-shadow is not clipped by its own overflow,
// so a rounded, clipped box can still cast a shadow.
function PreviewNode({ node }) {
  if (SHAPE_KINDS.has(pvKind(node))) return renderShape(node); // shapes own their full styling
  const inner = pvRender(node);
  let fx = window.nodeFx ? window.nodeFx(node) : null;
  // Inputs draw their own border (see above) — drop the duplicate wrapper border for them.
  if (fx && fx.border && pvKind(node) === 'input') { const { border, ...rest } = fx; fx = Object.keys(rest).length ? rest : null; }
  return fx ? <div style={{ width: '100%', height: '100%', ...fx }}>{inner}</div> : inner;
}
window.PreviewNode = PreviewNode;

function hasHover(h) { return h && (h.fill || h.textColor || h.borderColor || (h.scale && h.scale !== 100) || (h.opacity != null && h.opacity !== 100)); }

function PreviewCanvas({ nodes, connections, artboard, device, onAction, runtime = null, runtimeProps = {} }) {
  const [override, setOverride] = React.useState({});
  // Workflow "Set property" nodes stash live overrides here (nodeId -> patch), applied on render.
  const applyRt = (n) => runtimeProps[n.id] ? { ...n, ...runtimeProps[n.id] } : n;
  // Live interaction state: per-node hover phase, the currently-pressed node, and sticky toggles.
  const [phase, setPhase] = React.useState({});   // nodeId -> 'hoverOn' | 'hoverOff'
  const [pressId, setPressId] = React.useState(null);
  const [toggled, setToggled] = React.useState({}); // nodeId -> bool (clickMode 'toggle')
  const rootRef = React.useRef(null);
  const childIds = new Set(connections.filter(c => c.kind === 'child').map(c => c.from));

  // First enabled keyframe-animation custom state on a node (auto-plays in Preview).
  const animState = (n) => (n.customStates || []).find(c => c.type === 'anim' && (c.frames || []).length >= 1 && (!window.stateEnabled || window.stateEnabled(n, c.id)));
  const [frameIdx, setFrameIdx] = React.useState({}); // nodeId -> current frame index
  const animSig = nodes.map(n => { const c = animState(n); return c ? n.id + ':' + c.id + ':' + c.loop + ':' + (c.frames || []).map(f => f.dur).join(',') : ''; }).join('|');
  React.useEffect(() => {
    const timers = [];
    nodes.forEach(n => {
      const cs = animState(n); if (!cs) return;
      const frames = cs.frames || [];
      setFrameIdx(s => ({ ...s, [n.id]: 0 }));
      if (frames.length < 2) return;
      let i = 0;
      const step = () => {
        let next = i + 1;
        if (next >= frames.length) { if (!cs.loop) return; next = 0; }
        i = next; setFrameIdx(s => ({ ...s, [n.id]: i }));
        timers.push(setTimeout(step, Math.max(60, (frames[i] && frames[i].dur) || 400)));
      };
      timers.push(setTimeout(step, Math.max(60, (frames[0] && frames[0].dur) || 400)));
    });
    return () => timers.forEach(clearTimeout);
  }, [animSig]); // eslint-disable-line

  // Which interaction state is a node currently showing? Disabled states fall back to Default.
  const stateOf = (n) => {
    if (!(n.states || n.hover)) return 'default';
    const toggleMode = (n.clickMode || 'toggle') === 'toggle';
    let s = phase[n.id] || 'default';
    if (toggleMode && toggled[n.id]) s = 'clickOn';
    else if (!toggleMode && pressId === n.id) s = 'clickOn';
    if (s !== 'default' && window.stateEnabled && !window.stateEnabled(n, s)) return 'default';
    return s;
  };

  const dispatch = (action) => {
    if (!action) return;
    if (action.type === 'toggle') { setOverride(o => ({ ...o, [action.target]: !o[action.target] })); return; }
    if (action.type === 'scroll') { const el = rootRef.current && rootRef.current.querySelector('[data-nid="' + action.target + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    onAction && onAction(action);
  };
  const run = (node, trigger) => (e) => {
    const acts = (node.actions || []).filter(a => (a.trigger || 'click') === trigger);
    if (acts.length) { if (e) { e.preventDefault(); e.stopPropagation(); } acts.forEach(dispatch); }
  };

  const visible = nodes.map(applyRt).filter(n => !n.hidden && !override[n.id]);
  const W = artboard ? artboard.w : 1440, H = artboard ? artboard.h : 1024;

  // State overrides are applied by re-rendering the merged node (below); this only supplies the
  // transition so the change animates. Targets descendants too, since fill/scale/etc. live inside
  // PreviewNode. Timing comes from the *active* state, so entering and leaving can differ.
  const stateCSS = visible.filter(n => n.states || n.hover || animState(n)).map(n => {
    const cs = animState(n);
    let dur, ease;
    if (cs) { const fi = frameIdx[n.id] || 0; const fr = cs.frames[fi]; dur = (fr && fr.dur) || 400; ease = (fr && fr.ease) || 'linear'; }
    else { const t = window.stateTiming ? window.stateTiming(n, stateOf(n)) : { dur: 150, ease: 'ease-out' }; dur = t.dur; ease = t.ease; }
    return `[data-nid="${n.id}"],[data-nid="${n.id}"] *{transition:all ${dur}ms ${ease}}`;
  }).join('\n');

  return (
    <window.WorkflowRuntime.Provider value={runtime}>
    <div ref={rootRef} style={{ flex: 1, minWidth: 0, overflow: 'auto', background: 'var(--bg-app)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 32 }}>
      <style>{KEYFRAMES + '\n' + stateCSS}</style>
      {visible.length === 0 ? (
        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 22, color: 'var(--text-secondary)', marginBottom: 6 }}>Nothing to preview</div>
          <div style={{ fontSize: 13 }}>Place components on the canvas, then switch back to preview.</div>
        </div>
      ) : (
        <div style={{ position: 'relative', flex: 'none', width: W, height: H, background: 'var(--surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {visible.map(n => {
            const a = n.anim;
            // `backwards` (not `both`): apply the first keyframe during the delay so there's no
            // start-flash, but DON'T hold the last keyframe after. Entrance keyframes end at the
            // element's natural state, so releasing to base looks identical.
            const animation = a && a.type && a.type !== 'none' ? `lt-${a.type} ${a.duration ?? 400}ms ${a.easing || 'ease-out'} ${a.delay ?? 0}ms backwards` : undefined;
            const cs = animState(n);
            const hasStates = !!(n.states || n.hover) && !cs;
            const toggleMode = (n.clickMode || 'toggle') === 'toggle';
            const active = cs ? 'default' : stateOf(n);
            const rendered = cs ? (window.mergeFrame ? window.mergeFrame(n, cs.frames[frameIdx[n.id] || 0]) : n)
              : (active !== 'default' && window.mergeState) ? window.mergeState(n, active) : n;
            const hasClickState = hasStates && ((n.states && n.states.clickOn) || false);
            const clickable = hasClickState || (n.actions || []).some(x => (x.trigger || 'click') === 'click');
            const onClick = (e) => { if (hasStates && toggleMode) setToggled(t => ({ ...t, [n.id]: !t[n.id] })); run(n, 'click')(e); };
            const onEnter = (e) => { if (hasStates) setPhase(p => ({ ...p, [n.id]: 'hoverOn' })); run(n, 'hover')(e); };
            const onLeave = () => { if (!hasStates) return; setPhase(p => ({ ...p, [n.id]: 'hoverOff' })); if (!toggleMode) setPressId(id => id === n.id ? null : id); };
            const onDown = () => { if (hasStates && !toggleMode) setPressId(n.id); };
            const onUp = () => { if (hasStates && !toggleMode) setPressId(id => id === n.id ? null : id); };
            return (
              <div key={n.id} data-nid={n.id}
                onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseDown={onDown} onMouseUp={onUp}
                style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, animation, cursor: clickable ? 'pointer' : 'default', overflow: n.clipContent ? 'hidden' : 'visible' }}>
                <PreviewNode node={rendered} />
              </div>
            );
          })}
        </div>
      )}
    </div>
    </window.WorkflowRuntime.Provider>
  );
}
window.PreviewCanvas = PreviewCanvas;
