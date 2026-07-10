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
// Resolve a node's font family to a CSS value: a built-in maps to its token; a custom uploaded font
// (registered in window.__latticeFonts) maps to its own quoted family name; anything else -> null so
// callers fall back to var(--font-sans).
function ff(name) { return FONT[name] || ((window.__latticeFonts || []).indexOf(name) !== -1 ? "'" + name + "'" : null); }
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
    fontFamily: ff(node.fontFamily) || (kind === 'heading' ? 'var(--font-serif-display)' : 'var(--font-sans)'),
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

// Resolve any icon slot to an element, priority: pasted SVG > image/asset > Lucide glyph. `o` carries
// the shared size/color/stroke/rotate/flip/opacity (see iconStyle). An inline SVG is tintable via
// `color` (currentColor); an <img> asset keeps its own colors but still honors size/opacity/transform.
function IconGlyph({ svg, src, name, o }) {
  o = o || {};
  const gs = window.iconStyle ? window.iconStyle(o) : { width: o.size, height: o.size };
  if (svg) return <span data-lt-icon style={{ display: 'inline-flex', ...gs }} dangerouslySetInnerHTML={{ __html: svg }} />;
  if (src) {
    const url = window.resolveAssetSrc ? window.resolveAssetSrc(src) : src;
    const st = { width: o.size, height: o.size, objectFit: 'contain' };
    if (gs.opacity != null) st.opacity = gs.opacity;
    if (gs.transform) st.transform = gs.transform;
    return <img src={url} alt="" style={st} />;
  }
  return name ? <LIcon name={name} {...o} /> : null;
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
          fontFamily: ff(node.fontFamily) || 'var(--font-sans)',
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
        <span style={{ fontSize: 12, fontWeight: 500, color: node.textColor || 'var(--text-secondary)', fontFamily: ff(node.fontFamily) || 'var(--font-sans)', flex: 'none' }}>
          {label}{node.required && <span style={{ color: 'var(--status-danger-fg)' }}> *</span>}
        </span>
      )}
      {field}
      {note && (
        <span style={{ fontSize: 11.5, color: invalid && node.errorText ? 'var(--status-danger-fg)' : 'var(--text-muted)', fontFamily: ff(node.fontFamily) || 'var(--font-sans)', flex: 'none' }}>{note}</span>
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
  const shaderOn = node.shader && node.shader.on && window.ShaderFill;
  const shaderLayer = shaderOn ? <window.ShaderFill code={node.shader.code} speed={node.shader.speed} /> : null;

  if (kind === 'rect') return shaderOn
    ? <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...fx }}>{shaderLayer}</div>
    : <div style={{ width: '100%', height: '100%', background: fillCss, ...fx }} />;
  if (kind === 'ellipse') return shaderOn
    ? <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...fx, borderRadius: '50%' }}>{shaderLayer}</div>
    : <div style={{ width: '100%', height: '100%', background: fillCss, ...fx, borderRadius: '50%' }} />;
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
    // A shader fill replaces the button's background — keep it transparent so the animated layer
    // behind (see PreviewNode) shows through, with only the label/border on top.
    const shaderOn = node.shader && node.shader.on;
    const palette = {
      solid: { background: shaderOn ? 'transparent' : (fill || 'var(--action-solid)'), color: solidFill ? '#000' : 'var(--action-solid-text)', border: '1px solid ' + (shaderOn ? 'transparent' : (solidFill || (fill ? 'transparent' : 'var(--action-solid)'))) },
      outline: { background: shaderOn ? 'transparent' : (fill || 'transparent'), color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
      ghost: { background: shaderOn ? 'transparent' : (fill || 'transparent'), color: 'var(--text-secondary)', border: '1px solid transparent' },
      danger: { background: shaderOn ? 'transparent' : (fill || 'transparent'), color: 'var(--status-danger-fg)', border: '1px solid var(--status-danger-fg)' },
    }[v];
    // Icon placement: left (default), right, or icon-only (label hidden).
    const pos = node.btnIconPos || 'left';
    const iconEl = (node.btnIconSvg || node.btnIconSrc || node.btnIcon) ? (
      <IconGlyph svg={node.btnIconSvg} src={node.btnIconSrc} name={node.btnIcon}
        o={{ size: node.btnIconSize || 15, color: node.btnIconColor, stroke: node.btnIconStroke, rotate: node.btnIconRotate, flipH: node.btnIconFlipH, flipV: node.btnIconFlipV, opacity: node.btnIconOpacity }} />
    ) : null;
    return (
      <button type="button" disabled={!!node.disabled} style={{ ...box, ...palette, display: 'inline-flex', alignItems: 'center', justifyContent: justifyFor(node.textAlign, 'center'), gap: node.btnIconGap ?? 7, fontFamily: ff(node.fontFamily) || 'var(--font-sans)', fontWeight: WEIGHT[node.fontWeight] || 500, fontSize: node.fontSize || BTN_FS[node.btnSize] || 13, cursor: node.disabled ? 'not-allowed' : 'pointer', opacity: node.disabled ? 0.45 : 1, ...tfx }}>
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
    const sz = node.iconSize || 24;
    // Priority: pasted SVG markup > internal-path / URL image > Lucide glyph.
    const glyph = <IconGlyph svg={node.iconSvg} src={node.iconSrc} name={node.iconName || 'star'}
      o={{ size: sz, color: node.textColor || 'var(--text-primary)', stroke: node.iconStroke, rotate: node.iconRotate, flipH: node.iconFlipH, flipV: node.iconFlipV, opacity: node.iconOpacity }} />;
    return <div style={{ ...box, display: 'flex', alignItems: VALIGN[node.iconVAlign] || 'center', justifyContent: justifyFor(node.iconAlign, 'center') }}>
      {glyph}
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
    return <Tag style={{ ...box, margin: 0, paddingLeft: 20, overflow: 'auto', color: node.textColor || 'var(--text-secondary)', fontFamily: ff(node.fontFamily) || 'var(--font-sans)', fontSize: node.fontSize || 13, lineHeight: node.lineHeight ?? 1.7, textAlign: node.textAlign || undefined, ...tfx }}>{items.map((it, i) => <li key={i}>{it}</li>)}</Tag>;
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
    // Resolve an internal asset path (e.g. "src/assets/logo.png") to its data URL; URLs pass through.
    const imgSrc = window.resolveAssetSrc ? window.resolveAssetSrc(node.src) : node.src;
    return imgSrc
      ? <img src={imgSrc} alt={node.label || ''} style={{ ...box, objectFit: node.fit || 'cover', borderRadius: node.radius || 0, border: '1px solid var(--border-subtle)' }} />
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
  if (kind === 'textarea') {
    const sz = INPUT_SIZE[node.inputSize] || INPUT_SIZE.md;
    const bd = node.borderWidth === 0 ? 'none'
      : node.borderWidth > 0 ? `${node.borderWidth}px ${node.borderStyle || 'solid'} ${node.borderColor || 'var(--border-default)'}`
      : '1px solid var(--border-default)';
    const radius = (window.nodeFx && (window.nodeFx(node) || {}).borderRadius) || undefined;
    const area = (
      <textarea data-lt-input placeholder={node.placeholder || 'Write a message…'} defaultValue={node.inputValue || ''}
        disabled={!!node.disabled} readOnly={!!node.readOnly} rows={node.rows || 3}
        style={{ width: '100%', flex: 1, minHeight: 0, resize: 'none', boxSizing: 'border-box', border: bd, borderRadius: radius,
          background: fill || 'var(--surface-inset)', color: node.textColor || 'var(--text-primary)',
          fontFamily: ff(node.fontFamily) || 'var(--font-sans)', fontSize: node.fontSize || sz.fs, lineHeight: node.lineHeight ?? 1.5,
          fontWeight: WEIGHT[node.fontWeight] || 400, letterSpacing: (node.letterSpacing ?? 0) + 'px',
          textTransform: node.textTransform && node.textTransform !== 'none' ? node.textTransform : undefined,
          padding: `${sz.px}px`, outline: 'none', opacity: node.disabled ? 0.5 : 1, ...tfx }} />
    );
    if (!node.fieldLabel && !node.helperText) return <div style={{ width: '100%', height: '100%', display: 'flex' }}>{area}</div>;
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, boxSizing: 'border-box' }}>
        {node.fieldLabel && <span style={{ fontSize: 12, fontWeight: 500, color: node.textColor || 'var(--text-secondary)', fontFamily: ff(node.fontFamily) || 'var(--font-sans)', flex: 'none' }}>{node.fieldLabel}</span>}
        {area}
        {node.helperText && <span style={{ fontSize: 11.5, color: 'var(--text-muted)', flex: 'none' }}>{node.helperText}</span>}
      </div>
    );
  }
  if (kind === 'radio') {
    const opts = String(node.optionsText || '').split(',').map(s => s.trim()).filter(Boolean);
    const horiz = node.radioDir === 'horizontal';
    const multi = !!node.radioMulti;
    // Multi mode selects a list of indices; single mode selects one (classic radio semantics).
    const selSet = multi
      ? new Set(String(node.selectedMulti || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)))
      : new Set([node.selected ?? 0]);
    const dot = fill || 'var(--action-solid)';
    return (
      <div style={{ ...box, display: 'flex', flexDirection: horiz ? 'row' : 'column', flexWrap: 'wrap', alignContent: 'center',
        gap: horiz ? 16 : 10, justifyContent: justifyFor(node.textAlign, 'left'), color: node.textColor || 'var(--text-secondary)',
        fontFamily: ff(node.fontFamily) || 'var(--font-sans)', fontSize: node.fontSize || 14, fontWeight: WEIGHT[node.fontWeight] || 400,
        letterSpacing: (node.letterSpacing ?? 0) + 'px', textTransform: node.textTransform && node.textTransform !== 'none' ? node.textTransform : undefined, ...tfx }}>
        {opts.map((o, i) => {
          const on = selSet.has(i);
          return (
            <label key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, flex: 'none', boxSizing: 'border-box', borderRadius: multi ? 5 : '50%',
                border: `2px solid ${on ? dot : 'var(--border-strong)'}`, background: multi && on ? dot : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && (multi
                  ? <LIcon name="check" size={11} color="var(--action-solid-text)" />
                  : <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />)}
              </span>
              {o}
            </label>
          );
        })}
      </div>
    );
  }
  if (kind === 'slider') {
    const min = node.min ?? 0, max = node.max ?? 100;
    const val = Math.max(min, Math.min(max, node.value ?? 50));
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    return (
      <div style={{ ...box, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1, height: 6, background: 'var(--surface-hover)', borderRadius: 999 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: fill || 'var(--action-solid)', borderRadius: 999 }} />
          <div style={{ position: 'absolute', top: '50%', left: pct + '%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: 'var(--text-primary)', border: '2px solid var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
        </div>
        {node.showValue && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: node.textColor || 'var(--text-muted)', minWidth: 28, textAlign: 'right', flex: 'none' }}>{Math.round(val)}</span>}
      </div>
    );
  }
  if (kind === 'tabs') {
    const items = String(node.tabsText || '').split(',').map(s => s.trim()).filter(Boolean);
    const idx = Math.max(0, Math.min(items.length - 1, node.activeTab ?? 0));
    return (
      <div style={{ ...box, display: 'flex', alignItems: node.h > 60 ? 'flex-start' : 'center', ...tfx }}>
        {items.length ? <DS.Tabs tabs={items} value={items[idx]} style={{ width: '100%' }} /> : null}
      </div>
    );
  }
  if (kind === 'breadcrumb') {
    const items = String(node.itemsText || '').split(',').map(s => s.trim()).filter(Boolean);
    const sep = node.separator || '/';
    return (
      <div style={{ ...box, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, color: node.textColor || 'var(--text-muted)',
        fontFamily: ff(node.fontFamily) || 'var(--font-sans)', fontSize: node.fontSize || 13, fontWeight: WEIGHT[node.fontWeight] || 400,
        letterSpacing: (node.letterSpacing ?? 0) + 'px', textTransform: node.textTransform && node.textTransform !== 'none' ? node.textTransform : undefined,
        justifyContent: justifyFor(node.textAlign, 'left'), ...tfx }}>
        {items.map((it, i) => (
          <React.Fragment key={i}>
            <span style={{ color: i === items.length - 1 ? (node.textColor || 'var(--text-primary)') : 'inherit', fontWeight: i === items.length - 1 ? 500 : 400 }}>{it}</span>
            {i < items.length - 1 && <span style={{ opacity: 0.55 }}>{sep}</span>}
          </React.Fragment>
        ))}
      </div>
    );
  }
  if (kind === 'alert') {
    const TONES = { info: 'var(--blue-base)', success: 'var(--green-base)', warning: 'var(--amber-base)', danger: 'var(--status-danger-fg)', neutral: 'var(--text-secondary)' };
    const c = TONES[node.tone || 'info'] || TONES.info;
    const fs = node.fontSize || 13.5;
    return (
      <div style={{ ...box, display: 'flex', gap: 10, padding: '12px 14px', background: fill || 'var(--surface-card)', borderLeft: `3px solid ${c}`,
        fontFamily: ff(node.fontFamily) || 'var(--font-sans)', ...tfx }}>
        {node.alertIcon && <LIcon name={node.alertIcon} size={18} color={c} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {node.label && <span style={{ fontWeight: 600, color: node.textColor || 'var(--text-primary)', fontSize: fs }}>{node.label}</span>}
          {node.alertText && <span style={{ fontSize: fs - 1, color: node.textColor || 'var(--text-muted)', lineHeight: 1.5 }}>{node.alertText}</span>}
        </div>
      </div>
    );
  }
  if (kind === 'table') {
    const cols = String(node.tableCols || '').split(',').map(s => s.trim()).filter(Boolean);
    const rows = String(node.tableRows || '').split('\n').map(r => r.split(',').map(c => c.trim())).filter(r => r.some(Boolean));
    const fs = node.fontSize || 12.5;
    return (
      <div style={{ ...box, overflow: 'auto', fontFamily: ff(node.fontFamily) || 'var(--font-sans)', background: fill || 'transparent', ...tfx }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs, color: node.textColor || 'var(--text-secondary)' }}>
          {cols.length > 0 && (
            <thead><tr>{cols.map((c, i) => <th key={i} style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-default)', color: node.textColor || 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</th>)}</tr></thead>
          )}
          <tbody>{rows.map((r, ri) => (
            <tr key={ri} style={{ background: node.striped && ri % 2 ? 'var(--surface-inset)' : 'transparent' }}>
              {r.map((cell, ci) => <td key={ci} style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{cell}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  if (kind === 'stat') {
    const trend = node.statTrend || 'up';
    const tc = trend === 'up' ? 'var(--green-base)' : trend === 'down' ? 'var(--status-danger-fg)' : 'var(--text-muted)';
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, padding: '4px 2px', background: fill || 'transparent', fontFamily: ff(node.fontFamily) || 'var(--font-sans)', ...tfx }}>
        {node.label && <span style={{ fontSize: 12, color: node.textColor || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{node.label}</span>}
        <span style={{ fontSize: node.fontSize || 26, fontWeight: 600, color: node.textColor || 'var(--text-primary)', fontFamily: ff(node.fontFamily) || 'var(--font-serif-display)', lineHeight: 1.1 }}>{node.statValue || '—'}</span>
        {node.statDelta && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: tc }}>
            {trend !== 'none' && <LIcon name={trend === 'up' ? 'trending-up' : 'trending-down'} size={13} color={tc} />}
            {node.statDelta}
          </span>
        )}
      </div>
    );
  }
  // container (frame / stack / grid / card / section) — no built-in border; it comes from the
  // Border setting via nodeFx (so Preview matches the editor, which draws containers borderless).
  // A shader fill sits behind the content, so keep the container transparent to let it show through.
  const contBg = (node.shader && node.shader.on) ? (fill || 'transparent') : (fill || 'var(--surface-card)');
  return <div style={{ ...box, background: contBg, padding: node.padding || 0 }} />;
}

// Wrap the rendered component in an effects layer (radius / border / shadow / glow / blur /
// opacity / rotation / blend). An element's own box-shadow is not clipped by its own overflow,
// so a rounded, clipped box can still cast a shadow.
function PreviewNode({ node }) {
  if (SHAPE_KINDS.has(pvKind(node))) return renderShape(node); // shapes own their full styling
  const inner = pvRender(node);
  let fx = window.nodeFx ? window.nodeFx(node) : null;
  // Inputs & textareas draw their own border (see above) — drop the duplicate wrapper border.
  if (fx && fx.border && (pvKind(node) === 'input' || pvKind(node) === 'textarea')) { const { border, ...rest } = fx; fx = Object.keys(rest).length ? rest : null; }
  // Shader fill: an animated WebGL texture behind the node's content, clipped to its radius.
  if (node.shader && node.shader.on && window.ShaderFill) {
    const radius = fx && fx.borderRadius;
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', ...(fx || {}) }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', borderRadius: radius }}>
          <window.ShaderFill code={node.shader.code} speed={node.shader.speed} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>{inner}</div>
      </div>
    );
  }
  return fx ? <div style={{ width: '100%', height: '100%', ...fx }}>{inner}</div> : inner;
}
window.PreviewNode = PreviewNode;

function hasHover(h) { return h && (h.fill || h.textColor || h.borderColor || (h.scale && h.scale !== 100) || (h.opacity != null && h.opacity !== 100)); }

function PreviewCanvas({ nodes, connections, artboard, device, onAction, runtime = null, runtimeProps = {}, pageTimeline = null }) {
  const [override, setOverride] = React.useState({});
  // Workflow "Set property" nodes stash live overrides here (nodeId -> patch), applied on render.
  const applyRt = (n) => runtimeProps[n.id] ? { ...n, ...runtimeProps[n.id] } : n;
  // Live interaction state, per node id: whether it's hovered, the active pointer interaction
  // (press/hold/drag), sticky click toggles, and momentary pulses (click/right-click/drop/hover-off).
  const [hover, setHover] = React.useState({});     // nodeId -> bool
  const [pointer, setPointer] = React.useState({}); // nodeId -> 'press' | 'hold' | 'drag'
  const [toggled, setToggled] = React.useState({}); // nodeId -> bool (clickMode 'toggle')
  const [pulse, setPulse] = React.useState({});     // nodeId -> { key } momentary reaction
  const [, setTick] = React.useState(0);            // ticks each rAF while a track animation plays
  // Time-based playback clocks for track animations bound to triggers. nodeId -> {stateId,start,dur,loop,sustain}
  const clocksRef = React.useRef({});
  const idleRef = React.useRef({});                 // nodeId -> {stateId,start,dur} looping idle track-anims
  const sceneTimeRef = React.useRef(0);             // current time (ms) of the page scene timeline
  const sceneRafRef = React.useRef(0);
  const rafRef = React.useRef(0);
  const holdTimersRef = React.useRef({});           // nodeId -> setTimeout id (press → hold threshold)
  const pulseTimersRef = React.useRef({});          // nodeId -> setTimeout id (clear a momentary pulse)
  const rootRef = React.useRef(null);
  const childIds = new Set(connections.filter(c => c.kind === 'child').map(c => c.from));

  // --- Zoom & pan — Preview is a pannable/zoomable surface (wheel to zoom; middle-drag or
  // Space-drag to pan), so the prototype's own clicks/hovers keep working untouched.
  const viewportRef = React.useRef(null);
  const [view, setView] = React.useState({ x: 0, y: 0, z: 1 });
  const viewT = React.useRef(view);
  const setV = (upd) => setView(v => { const nv = typeof upd === 'function' ? upd(v) : upd; viewT.current = nv; return nv; });
  const panRef = React.useRef(null);
  const spaceRef = React.useRef(false);
  const [spaceHeld, setSpaceHeld] = React.useState(false);
  const [panning, setPanning] = React.useState(false);
  // Zoom keeping the given viewport point fixed (cursor for wheel, centre for buttons).
  const zoomAt = (nz, px, py) => {
    const cur = viewT.current;
    const z = Math.min(4, Math.max(0.1, nz));
    const k = z / cur.z;
    setV({ x: px - (px - cur.x) * k, y: py - (py - cur.y) * k, z });
  };

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

  // --- Track-animation clocks: a rAF loop ticks re-renders while any bound animation is playing. ---
  const ensureRaf = () => {
    if (rafRef.current) return;
    const loop = () => {
      const clocks = clocksRef.current;
      const ids = Object.keys(clocks);
      if (!ids.length && !Object.keys(idleRef.current).length) { rafRef.current = 0; return; }
      const now = performance.now();
      // Retire momentary animations (no loop / no sustain) once they've run their duration → revert.
      ids.forEach(id => { const c = clocks[id]; if (!c.loop && !c.sustain && now - c.start >= c.dur) delete clocks[id]; });
      setTick(t => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };
  const startClock = (id, stt, opts) => {
    if (!stt) return;
    clocksRef.current[id] = { stateId: stt.id, start: performance.now(), dur: Math.max(1, window.stateDuration ? window.stateDuration(stt) : 400), loop: !!(opts && opts.loop), sustain: !!(opts && opts.sustain) };
    ensureRaf();
  };
  const stopClock = (id) => { delete clocksRef.current[id]; };
  React.useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); Object.values(holdTimersRef.current).forEach(clearTimeout); Object.values(pulseTimersRef.current).forEach(clearTimeout); }, []);

  // --- Which interaction trigger is a node currently showing, and its resolved pose. -------------
  // A trigger is "usable" only if it's enabled and actually carries content (a static override or a
  // bound animation). Priority when several could apply: momentary pulse > drag > hold > press >
  // sticky click > hover. Anything unusable falls through, ultimately to Default.
  const usable = (n, key) => key && key !== 'default' && (!window.stateEnabled || window.stateEnabled(n, key)) && (!window.stateHasOverrides || window.stateHasOverrides(n, key));
  const animOf = (n, key) => { const id = window.stateAnimId && window.stateAnimId(n, key); return id ? (n.customStates || []).find(c => c.id === id) : null; };
  const sustainedTrigger = (n) => {
    const p = pointer[n.id];
    if (p === 'drag' && usable(n, 'drag')) return 'drag';
    if (p === 'hold' && usable(n, 'hold')) return 'hold';
    if (p === 'press' && usable(n, 'press')) return 'press';
    if ((n.clickMode || 'toggle') === 'toggle' && toggled[n.id] && usable(n, 'click')) return 'click';
    if (hover[n.id] && usable(n, 'hoverOn')) return 'hoverOn';
    return 'default';
  };
  const activeTrigger = (n) => { const pl = pulse[n.id]; if (pl && usable(n, pl.key)) return pl.key; return sustainedTrigger(n); };
  // Start the clock for a sustained trigger's bound animation (hold freezes on its last key).
  const startTriggerAnim = (n, key) => {
    const stt = animOf(n, key);
    if (!stt) return;
    const sustain = key === 'hold' ? ((n.states && n.states.hold && n.states.hold.sustain) !== false) : false;
    startClock(n.id, stt, { loop: key === 'hold' ? false : !!stt.loop, sustain });
  };
  // Fire a momentary reaction (click/right-click/drop/hover-off): play once, then auto-revert.
  const firePulse = (n, key) => {
    if (!usable(n, key)) return;
    const stt = animOf(n, key);
    const dur = stt ? (window.stateDuration ? window.stateDuration(stt) : 300) : (window.stateTiming ? window.stateTiming(n, key).dur : 150);
    if (stt) startClock(n.id, stt, { loop: false, sustain: false });
    setPulse(p => ({ ...p, [n.id]: { key } }));
    clearTimeout(pulseTimersRef.current[n.id]);
    pulseTimersRef.current[n.id] = setTimeout(() => setPulse(p => { const q = { ...p }; delete q[n.id]; return q; }), Math.max(80, dur) + 30);
  };
  // Resolve the node to its current pose: sample a bound animation over time, else merge the static
  // override, else the base node.
  const poseFor = (n) => {
    const key = activeTrigger(n);
    const stt = key !== 'default' ? animOf(n, key) : null;
    if (stt) {
      const clk = clocksRef.current[n.id];
      let e;
      if (clk && clk.stateId === stt.id) {
        e = performance.now() - clk.start;
        if (e >= clk.dur) e = clk.loop ? (clk.dur > 0 ? e % clk.dur : 0) : clk.dur;
      } else { e = window.stateDuration ? window.stateDuration(stt) : 0; }
      return { key, animing: true, rendered: window.poseAt ? window.poseAt(n, stt, e) : n };
    }
    if (key !== 'default') return { key, animing: false, rendered: window.mergeState ? window.mergeState(n, key) : n };
    // No trigger active — play a looping idle track animation if the node has one.
    const idle = idleRef.current[n.id];
    if (idle) {
      const ist = (n.customStates || []).find(c => c.id === idle.stateId);
      if (ist) { const d = idle.dur || 1; const e = d > 0 ? (performance.now() - idle.start) % d : 0; return { key: 'default', animing: true, rendered: window.poseAt ? window.poseAt(n, ist, e) : n }; }
    }
    return { key: 'default', animing: false, rendered: n };
  };
  // A looping, enabled, track-based animation that isn't bound to any trigger auto-plays as "idle"
  // (e.g. a loading spinner). Frame-based legacy loops keep using the animState() path above.
  const idleAnimOf = (n) => {
    const bound = new Set(Object.values(n.states || {}).map(s => s && s.animId).filter(Boolean));
    return (n.customStates || []).find(c => (c.type || 'static') === 'anim' && c.loop && (c.tracks && c.tracks.length) && !bound.has(c.id) && (!window.stateEnabled || window.stateEnabled(n, c.id)));
  };
  const idleSig = nodes.map(n => { const c = idleAnimOf(n); return c ? n.id + ':' + c.id + ':' + (window.stateDuration ? window.stateDuration(c) : 0) : ''; }).join('|');
  React.useEffect(() => {
    const idle = {};
    nodes.forEach(n => { const c = idleAnimOf(n); if (c) idle[n.id] = { stateId: c.id, start: performance.now(), dur: Math.max(1, window.stateDuration ? window.stateDuration(c) : 400) }; });
    idleRef.current = idle;
    if (Object.keys(idle).length) ensureRaf();
  }, [idleSig]); // eslint-disable-line

  // --- Page scene timeline: one clock drives many nodes' property tracks over the whole screen. -----
  const sceneTL = pageTimeline && pageTimeline.on !== false && pageTimeline.autoplay !== false && (pageTimeline.tracks || []).length ? pageTimeline : null;
  const sceneDur = sceneTL ? Math.max(1, sceneTL.duration || (window.tracksDuration ? window.tracksDuration(sceneTL.tracks) : 0)) : 0;
  const sceneSig = sceneTL ? ((sceneTL.tracks || []).length + ':' + sceneDur + ':' + sceneTL.loop) : '';
  React.useEffect(() => {
    if (!sceneTL) { sceneTimeRef.current = 0; if (sceneRafRef.current) { cancelAnimationFrame(sceneRafRef.current); sceneRafRef.current = 0; } return; }
    const start = performance.now();
    const step = (now) => {
      let e = now - start;
      if (e >= sceneDur) { if (sceneTL.loop !== false) e = sceneDur > 0 ? e % sceneDur : 0; else e = sceneDur; }
      sceneTimeRef.current = e;
      setTick(t => (t + 1) % 1000000);
      if (sceneTL.loop !== false || e < sceneDur) sceneRafRef.current = requestAnimationFrame(step);
    };
    sceneRafRef.current = requestAnimationFrame(step);
    return () => { if (sceneRafRef.current) cancelAnimationFrame(sceneRafRef.current); };
  }, [sceneSig]); // eslint-disable-line
  // Overrides for one node from the scene timeline at the current scene time (or null).
  const sceneOvOf = (n) => sceneTL ? window.sampleTracks((sceneTL.tracks || []).filter(tr => tr.nodeId === n.id), sceneTimeRef.current) : null;
  const applyScene = (n) => { const ov = sceneTL ? sceneOvOf(n) : null; return ov && Object.keys(ov).length ? { ...n, ...ov } : n; };

  const dispatch = (action) => {
    if (!action) return;
    if (action.type === 'toggle') { setOverride(o => ({ ...o, [action.target]: !o[action.target] })); return; }
    if (action.type === 'scroll') {
      const n = nodes.find(x => x.id === action.target); const el = viewportRef.current;
      if (n && el) { const r = el.getBoundingClientRect(); const z = viewT.current.z; setV(v => ({ ...v, x: r.width / 2 - (n.x + n.w / 2) * z, y: r.height / 2 - (n.y + n.h / 2) * z })); }
      return;
    }
    onAction && onAction(action);
  };
  const run = (node, trigger) => (e) => {
    const acts = (node.actions || []).filter(a => (a.trigger || 'click') === trigger);
    if (acts.length) { if (e) { e.preventDefault(); e.stopPropagation(); } acts.forEach(dispatch); }
  };

  const hasScene = (n) => !!(sceneTL && (sceneTL.tracks || []).some(tr => tr.nodeId === n.id));
  const visible = nodes.map(applyRt).map(applyScene).filter(n => !n.hidden && !override[n.id]);
  const W = artboard ? artboard.w : 1440, H = artboard ? artboard.h : 1024;

  // State overrides are applied by re-rendering the merged node (below); this only supplies the
  // transition so the change animates. Targets descendants too, since fill/scale/etc. live inside
  // PreviewNode. Timing comes from the *active* state, so entering and leaving can differ.
  const stateCSS = visible.filter(n => n.states || n.hover || animState(n) || idleAnimOf(n) || hasScene(n)).map(n => {
    const cs = animState(n);
    if (cs) { const fi = frameIdx[n.id] || 0; const fr = cs.frames[fi]; const dur = (fr && fr.dur) || 400; const ease = (fr && fr.ease) || 'linear'; return `[data-nid="${n.id}"],[data-nid="${n.id}"] *{transition:all ${dur}ms ${ease}}`; }
    // A track animation samples every frame in JS, so suppress CSS transitions while it plays; a
    // static state tweens via CSS using the active trigger's timing.
    if (clocksRef.current[n.id] || idleAnimOf(n) || hasScene(n)) return `[data-nid="${n.id}"],[data-nid="${n.id}"] *{transition:none}`;
    const t = window.stateTiming ? window.stateTiming(n, activeTrigger(n)) : { dur: 150, ease: 'ease-out' };
    return `[data-nid="${n.id}"],[data-nid="${n.id}"] *{transition:all ${t.dur}ms ${t.ease}}`;
  }).join('\n');

  // Fit the artboard, centred, whenever its size changes (mount + device switch).
  const fitView = React.useCallback(() => {
    const el = viewportRef.current; if (!el) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const z = Math.max(0.1, Math.min(2, Math.min((r.width - 48) / W, (r.height - 48) / H)));
    setV({ x: Math.round((r.width - W * z) / 2), y: Math.round((r.height - H * z) / 2), z });
  }, [W, H]);
  React.useEffect(() => { fitView(); }, [fitView]);

  // Wheel to zoom toward the cursor.
  React.useEffect(() => {
    const el = viewportRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(viewT.current.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Hold Space to pan (ignored while typing in a field).
  React.useEffect(() => {
    const typing = (t) => /^(INPUT|TEXTAREA|SELECT)$/.test((t && t.tagName) || '') || (t && t.isContentEditable);
    const kd = (e) => { if (e.code === 'Space' && !e.repeat && !typing(e.target)) { e.preventDefault(); spaceRef.current = true; setSpaceHeld(true); } };
    const ku = (e) => { if (e.code === 'Space') { spaceRef.current = false; setSpaceHeld(false); } };
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);
    return () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }, []);

  // Document-level pan drag (started by middle-button or Space+left on the viewport).
  React.useEffect(() => {
    const onMove = (e) => { const p = panRef.current; if (!p) return; setV(v => ({ ...v, x: p.ox + (e.clientX - p.sx), y: p.oy + (e.clientY - p.sy) })); };
    const onUp = () => { if (panRef.current) { panRef.current = null; setPanning(false); } };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startPan = (e) => { panRef.current = { sx: e.clientX, sy: e.clientY, ox: viewT.current.x, oy: viewT.current.y }; setPanning(true); e.preventDefault(); };
  const zoomButton = (mult) => { const el = viewportRef.current; const r = el && el.getBoundingClientRect(); zoomAt(viewT.current.z * mult, r ? r.width / 2 : 0, r ? r.height / 2 : 0); };
  const reset100 = () => { const el = viewportRef.current; const r = el && el.getBoundingClientRect(); zoomAt(1, r ? r.width / 2 : 0, r ? r.height / 2 : 0); };

  return (
    <window.WorkflowRuntime.Provider value={runtime}>
    <div ref={viewportRef}
      style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative', background: 'var(--bg-app)',
        cursor: panning ? 'grabbing' : spaceHeld ? 'grab' : 'default' }}
      onMouseDown={e => { if (e.button === 1 || (e.button === 0 && spaceRef.current)) startPan(e); }}>
      <style>{KEYFRAMES + '\n' + stateCSS}</style>
      {visible.length === 0 ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 22, color: 'var(--text-secondary)', marginBottom: 6 }}>Nothing to preview</div>
            <div style={{ fontSize: 13 }}>Place components on the canvas, then switch back to preview.</div>
          </div>
        </div>
      ) : (
        <div ref={rootRef} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${view.x}px,${view.y}px) scale(${view.z})` }}>
        <div style={{ position: 'relative', width: W, height: H, background: 'var(--surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {visible.map(n => {
            const a = n.anim;
            // `backwards` (not `both`): apply the first keyframe during the delay so there's no
            // start-flash, but DON'T hold the last keyframe after. Entrance keyframes end at the
            // element's natural state, so releasing to base looks identical.
            const animation = a && a.type && a.type !== 'none' ? `lt-${a.type} ${a.duration ?? 400}ms ${a.easing || 'ease-out'} ${a.delay ?? 0}ms backwards` : undefined;
            const cs = animState(n);                             // legacy frame-based auto-play (idle)
            const hasStates = !!(n.states || n.hover) && !cs;
            const toggleMode = (n.clickMode || 'toggle') === 'toggle';
            // Pose: legacy card frames, else the resolved trigger pose (static merge or sampled anim).
            const rendered = cs ? (window.mergeFrame ? window.mergeFrame(n, cs.frames[frameIdx[n.id] || 0]) : n) : poseFor(n).rendered;
            const clickable = hasStates && (usable(n, 'click') || usable(n, 'press') || usable(n, 'hold') || (n.actions || []).some(x => (x.trigger || 'click') === 'click'));
            const dragEnabled = hasStates && (usable(n, 'drag') || usable(n, 'drop'));

            // Pointer / hover / click machine driving the trigger states above.
            const onEnter = (e) => { if (hasStates) { setHover(h => ({ ...h, [n.id]: true })); startTriggerAnim(n, 'hoverOn'); } run(n, 'hover')(e); };
            const onLeave = () => {
              if (!hasStates) return;
              setHover(h => ({ ...h, [n.id]: false }));
              clearTimeout(holdTimersRef.current[n.id]);
              setPointer(p => { const q = { ...p }; delete q[n.id]; return q; });
              stopClock(n.id);
              firePulse(n, 'hoverOff');
            };
            const onDown = (e) => {
              if (!hasStates || e.button !== 0) return;
              setPointer(p => ({ ...p, [n.id]: 'press' }));
              if (animOf(n, 'press')) firePulse(n, 'press'); else startTriggerAnim(n, 'press'); // anim = momentary pop, static = sustained depress
              const holdMs = (n.states && n.states.hold && n.states.hold.holdMs) ?? 250;
              clearTimeout(holdTimersRef.current[n.id]);
              holdTimersRef.current[n.id] = setTimeout(() => { setPointer(p => ({ ...p, [n.id]: 'hold' })); stopClock(n.id); startTriggerAnim(n, 'hold'); }, holdMs);
            };
            const onUp = () => {
              if (!hasStates) return;
              clearTimeout(holdTimersRef.current[n.id]);
              setPointer(p => { const q = { ...p }; delete q[n.id]; return q; });
              stopClock(n.id);
            };
            const onClick = (e) => {
              if (hasStates) { if (toggleMode) setToggled(t => ({ ...t, [n.id]: !t[n.id] })); else firePulse(n, 'click'); }
              run(n, 'click')(e);
            };
            const onCtx = (e) => { if (hasStates && usable(n, 'rightClick')) { e.preventDefault(); firePulse(n, 'rightClick'); } };
            const onDragStart = () => { if (dragEnabled) { clearTimeout(holdTimersRef.current[n.id]); setPointer(p => ({ ...p, [n.id]: 'drag' })); startTriggerAnim(n, 'drag'); } };
            const onDragEnd = () => { if (dragEnabled) { setPointer(p => { const q = { ...p }; delete q[n.id]; return q; }); stopClock(n.id); firePulse(n, 'drop'); } };
            return (
              <div key={n.id} data-nid={n.id} draggable={dragEnabled || undefined}
                onClick={onClick} onContextMenu={onCtx}
                onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseDown={onDown} onMouseUp={onUp}
                onDragStart={onDragStart} onDragEnd={onDragEnd}
                style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, animation, cursor: clickable ? 'pointer' : (dragEnabled ? 'grab' : 'default'), overflow: n.clipContent ? 'hidden' : 'visible' }}>
                <PreviewNode node={rendered} />
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* Zoom controls — mirror the design canvas so Preview is navigable too */}
      {visible.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14, display: 'flex',
          background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, overflow: 'hidden', userSelect: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', zIndex: 30,
        }}>
          <button type="button" title="Zoom out" onClick={() => zoomButton(1 / 1.2)} style={pvZBtn}>
            <i data-lucide="minus" style={{ width: 13, height: 13 }}></i>
          </button>
          <button type="button" title="Reset to 100%" onClick={reset100}
            style={{ ...pvZBtn, width: 54, fontSize: 11, fontFamily: 'var(--font-mono)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {Math.round(view.z * 100)}%
          </button>
          <button type="button" title="Zoom in" onClick={() => zoomButton(1.2)} style={pvZBtn}>
            <i data-lucide="plus" style={{ width: 13, height: 13 }}></i>
          </button>
          <button type="button" title="Fit to screen" onClick={fitView} style={{ ...pvZBtn, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <i data-lucide="maximize" style={{ width: 13, height: 13 }}></i>
          </button>
        </div>
      )}
    </div>
    </window.WorkflowRuntime.Provider>
  );
}

const pvZBtn = {
  width: 32, height: 30, border: 0, background: 'transparent',
  color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 120ms',
};

window.PreviewCanvas = PreviewCanvas;
