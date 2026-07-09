/* global React, gradientCss */
// Color control — pick from the project palette, design tokens, or a custom hex. Value is a hex
// string or a `var(--token)` string (both work directly as an inline-style background/color).
// When `allowGradient` is set (Fill only), it also edits a linear/radial gradient descriptor
// `{ type, angle, cx, cy, stops:[{color,pos}] }` via `gradient`/`onGradient`.

const DS_TOKENS = [
  '--white', '--neutral-900', '--neutral-700', '--neutral-500', '--neutral-300',
  '--bg-app', '--bg-void', '--surface', '--surface-card', '--surface-hover', '--surface-inset',
  '--text-primary', '--text-secondary', '--text-muted', '--border-subtle', '--border-strong',
  '--action-solid', '--green-base', '--amber-base', '--red-base', '--blue-base',
];

const CHECKER = 'repeating-conic-gradient(#3a3a3a 0% 25%, #222 0% 50%) 50% / 8px 8px';

function Swatch({ color, active, title, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      width: 22, height: 22, padding: 0, cursor: 'pointer', borderRadius: 3,
      background: color === 'transparent' ? 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 50% / 8px 8px' : color,
      border: '1px solid ' + (active ? 'var(--text-primary)' : 'var(--border-default)'),
      boxShadow: active ? '0 0 0 1px var(--text-primary)' : 'none',
    }} />
  );
}

function ModeTab({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, height: 24, cursor: 'pointer', fontSize: 10.5, fontFamily: 'var(--font-mono)',
      border: '1px solid ' + (active ? 'var(--text-primary)' : 'var(--border-default)'),
      background: active ? 'var(--surface-hover)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize',
    }}>{label}</button>
  );
}

function ColorField({ value, onChange, palette = [], allowNone = true, allowGradient = false, gradient = null, onGradient }) {
  const [open, setOpen] = React.useState(false);
  const [hex, setHex] = React.useState(value && value[0] === '#' ? value : '#ffffff');
  const ref = React.useRef(null);
  React.useEffect(() => { if (value && value[0] === '#') setHex(value); }, [value]);
  React.useEffect(() => {
    if (!open) return;
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', on), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', on); };
  }, [open]);

  const gEnabled = allowGradient && !!onGradient;
  const mode = (gEnabled && gradient && gradient.type) ? gradient.type : 'solid';
  const gradPreview = gEnabled && gradient ? window.gradientCss(gradient) : null;

  const pick = (v) => { onChange(v); setOpen(false); };
  const clear = () => { onChange(''); if (gEnabled) onGradient(null); };

  const setMode = (m) => {
    if (m === 'solid') { onGradient(null); return; }
    if (gradient && gradient.type) { onGradient({ ...gradient, type: m }); return; }
    const seed = value && value[0] === '#' ? value : '#4f46e5';
    onGradient({ type: m, angle: 180, cx: 50, cy: 50, stops: [{ color: seed, pos: 0 }, { color: '#9333ea', pos: 100 }] });
  };
  const setStop = (i, patch) => onGradient({ ...gradient, stops: gradient.stops.map((s, j) => j === i ? { ...s, ...patch } : s) });
  const addStop = () => onGradient({ ...gradient, stops: [...gradient.stops, { color: '#ffffff', pos: 100 }] });
  const delStop = (i) => { if (gradient.stops.length <= 2) return; onGradient({ ...gradient, stops: gradient.stops.filter((_, j) => j !== i) }); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, border: '1px solid var(--border-subtle)', padding: '2px 6px 2px 3px', borderRadius: 3 }}>
      <button type="button" title="Choose color" onClick={() => setOpen(o => !o)} style={{
        width: 22, height: 22, padding: 0, flex: 'none', border: '1px solid var(--border-default)', borderRadius: 2, cursor: 'pointer',
        // layer the (possibly translucent) colour over a checkerboard so alpha is visible
        background: gradPreview || (value ? `linear-gradient(${value}, ${value}), ${CHECKER}` : CHECKER),
      }} />
      <span title={gradPreview ? (mode + ' gradient') : (value || 'none')}
        style={{ flex: 1, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gradPreview ? (mode + ' gradient') : (value || 'none')}</span>
      {(value || gradPreview) && allowNone && <button type="button" title="Clear" onClick={clear} style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: 0, flex: 'none' }}>×</button>}

      {open && (
        <div style={{ position: 'absolute', top: '108%', right: 0, zIndex: 400, width: mode !== 'solid' ? 250 : 214, maxHeight: 'min(72vh, 480px)', overflowY: 'auto', background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', padding: 10 }}>
          {gEnabled && (
            <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
              <ModeTab label="Solid" active={mode === 'solid'} onClick={() => setMode('solid')} />
              <ModeTab label="Linear" active={mode === 'linear'} onClick={() => setMode('linear')} />
              <ModeTab label="Radial" active={mode === 'radial'} onClick={() => setMode('radial')} />
            </div>
          )}

          {mode !== 'solid' ? (
            <>
              <div style={{ height: 24, borderRadius: 3, border: '1px solid var(--border-default)', marginBottom: 10, background: gradPreview || '#000' }} />
              <div style={eb}>Presets</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {GRAD_PRESETS.map((g, i) => (
                  <button key={i} type="button" title="Use preset" onClick={() => onGradient({ ...g, stops: g.stops.map(s => ({ ...s })) })}
                    style={{ flex: 1, height: 20, borderRadius: 3, cursor: 'pointer', border: '1px solid var(--border-default)', background: window.gradientCss(g) }} />
                ))}
              </div>
              {mode === 'linear' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={eb2}>Angle</span>
                  <input type="range" min={0} max={360} value={gradient.angle ?? 180} onChange={e => onGradient({ ...gradient, angle: +e.target.value })} style={{ flex: 1 }} />
                  <input type="number" title="Angle" value={gradient.angle ?? 180} onChange={e => onGradient({ ...gradient, angle: +e.target.value || 0 })} style={{ ...miniIn, width: 42 }} />
                </div>
              )}
              <div style={eb}>Stops</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {gradient.stops.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="color" title="Stop color" value={s.color && s.color[0] === '#' ? s.color : '#ffffff'} onChange={e => setStop(i, { color: e.target.value })}
                      style={{ width: 24, height: 24, padding: 0, border: 0, background: 'none', cursor: 'pointer', flex: 'none' }} />
                    <input value={s.color} title="Color" onChange={e => setStop(i, { color: e.target.value })} style={{ ...miniIn, flex: 1, minWidth: 0 }} />
                    <input type="number" title="Position %" min={0} max={100} value={s.pos ?? 0} onChange={e => setStop(i, { pos: Math.max(0, Math.min(100, +e.target.value || 0)) })} style={{ ...miniIn, width: 44, flex: 'none' }} />
                    <button type="button" title="Remove stop" onClick={() => delStop(i)} disabled={gradient.stops.length <= 2}
                      style={{ border: 0, background: 'none', cursor: gradient.stops.length <= 2 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: gradient.stops.length <= 2 ? 0.3 : 1, fontSize: 14, lineHeight: 1, padding: 0, flex: 'none' }}>×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addStop} style={{ width: '100%', height: 24, cursor: 'pointer', fontSize: 11, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)' }}>+ Add stop</button>
            </>
          ) : (
            <>
              {palette.length > 0 && (
                <>
                  <div style={eb}>Palette</div>
                  <div style={grid}>
                    {palette.map((p, i) => <Swatch key={i} color={p.value} title={p.name || p.value} active={value === p.value} onClick={() => pick(p.value)} />)}
                  </div>
                </>
              )}
              <div style={eb}>Tokens</div>
              <div style={grid}>
                {DS_TOKENS.map(t => <Swatch key={t} color={`var(${t})`} title={t} active={value === `var(${t})`} onClick={() => pick(`var(${t})`)} />)}
              </div>
              <div style={eb}>Custom</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" title="Custom color" value={hex} onChange={e => { setHex(e.target.value); onChange(e.target.value); }}
                  style={{ width: 26, height: 26, padding: 0, border: 0, background: 'none', cursor: 'pointer' }} />
                <input value={hex} title="Hex" onChange={e => { setHex(e.target.value); if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(e.target.value)) onChange(e.target.value); }}
                  style={{ flex: 1, height: 26, boxSizing: 'border-box', padding: '0 7px', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none' }} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const GRAD_PRESETS = [
  { type: 'linear', angle: 180, cx: 50, cy: 50, stops: [{ color: '#4f46e5', pos: 0 }, { color: '#9333ea', pos: 100 }] },
  { type: 'linear', angle: 135, cx: 50, cy: 50, stops: [{ color: '#0ea5e9', pos: 0 }, { color: '#22d3ee', pos: 100 }] },
  { type: 'linear', angle: 135, cx: 50, cy: 50, stops: [{ color: '#f472b6', pos: 0 }, { color: '#fb7185', pos: 100 }] },
  { type: 'linear', angle: 135, cx: 50, cy: 50, stops: [{ color: '#22c55e', pos: 0 }, { color: '#84cc16', pos: 100 }] },
  { type: 'linear', angle: 135, cx: 50, cy: 50, stops: [{ color: '#f59e0b', pos: 0 }, { color: '#ef4444', pos: 100 }] },
  { type: 'radial', angle: 180, cx: 50, cy: 38, stops: [{ color: '#334155', pos: 0 }, { color: '#0f172a', pos: 100 }] },
];

const eb = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '2px 0 6px' };
const eb2 = { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 10 };
const miniIn = { height: 24, boxSizing: 'border-box', padding: '0 5px', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', MozAppearance: 'textfield' };

window.ColorField = ColorField;
