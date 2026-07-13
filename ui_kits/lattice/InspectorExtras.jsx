/* global React, Section, NumRow, KeyBtn, ColorField, IconPicker */
// Cross-kind Inspector sections: Animation, Hover, Interactions, Effects. Reuses global
// Section/NumRow/KeyBtn (from Inspector.jsx) and ColorField.

const rowLbl = { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', userSelect: 'none' };

// Pass `prop` (an animatable property key) to trail a ◆ keyframe button while a timeline is open —
// KeyBtn self-gates, so non-animatable colours (hover/effect swatches) simply omit it.
function ColorRowLabeled({ label, value, onChange, palette, prop }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...rowLbl, width: 76, flex: 'none' }}>{label}</span>
      {/* minWidth:0 lets the field shrink inside narrow effect cards instead of overflowing them */}
      <div style={{ flex: 1, minWidth: 0 }}><ColorField value={value} onChange={onChange} palette={palette} /></div>
      {prop && typeof KeyBtn !== 'undefined' && <KeyBtn prop={prop} value={value} />}
    </div>
  );
}

function AnimationSection({ node, onChange }) {
  const { Select } = window.LatticeDesignSystem_e801cb;
  const anim = node.anim || {};
  const set = (k) => (v) => onChange(node.id, { anim: { ...anim, [k]: v } });
  const type = anim.type || 'none';
  return (
    <Section title="Animation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Select label="On appear" size="sm"
          options={[
            { value: 'none', label: 'None' }, { value: 'fade', label: 'Fade in' },
            { value: 'slide-up', label: 'Slide up' }, { value: 'slide-down', label: 'Slide down' },
            { value: 'slide-left', label: 'Slide left' }, { value: 'slide-right', label: 'Slide right' },
            { value: 'scale', label: 'Scale in' }, { value: 'pop', label: 'Pop' },
          ]}
          value={type} onChange={e => set('type')(e.target.value)} />
        {type !== 'none' && (
          <>
            <NumRow label="Duration ms" value={anim.duration ?? 400} min={0} onChange={v => set('duration')(+v || 0)} />
            <NumRow label="Delay ms" value={anim.delay ?? 0} min={0} onChange={v => set('delay')(+v || 0)} />
            <Select label="Easing" size="sm" options={['ease-out', 'ease-in-out', 'ease-in', 'linear']}
              value={anim.easing || 'ease-out'} onChange={e => set('easing')(e.target.value)} />
          </>
        )}
      </div>
    </Section>
  );
}
window.AnimationSection = AnimationSection;

function HoverSection({ node, onChange, palette }) {
  const hv = node.hover || {};
  const set = (k) => (v) => onChange(node.id, { hover: { ...hv, [k]: v } });
  return (
    <Section title="Hover">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ColorRowLabeled label="Fill" value={hv.fill} onChange={set('fill')} palette={palette} />
        <ColorRowLabeled label="Text" value={hv.textColor} onChange={set('textColor')} palette={palette} />
        <ColorRowLabeled label="Border" value={hv.borderColor} onChange={set('borderColor')} palette={palette} />
        <NumRow label="Scale %" value={hv.scale ?? 100} min={50} onChange={v => set('scale')(+v || 100)} />
        <NumRow label="Opacity %" value={hv.opacity ?? 100} min={0} onChange={v => set('opacity')(+v || 100)} />
      </div>
    </Section>
  );
}
window.HoverSection = HoverSection;

const ACTION_TYPES = [
  { value: 'navigate', label: 'Go to page' }, { value: 'url', label: 'Open URL' },
  { value: 'runWorkflow', label: 'Run workflow' },
  { value: 'dialog', label: 'Open dialog' }, { value: 'closeDialog', label: 'Close dialog' },
  { value: 'toggle', label: 'Toggle node' }, { value: 'toast', label: 'Show toast' },
  { value: 'scroll', label: 'Scroll to node' }, { value: 'submit', label: 'Submit form' },
];

function ActionsEditor({ node, onChange, pages = [], allNodes = [], workflows = [] }) {
  const { Select, Input, Button } = window.LatticeDesignSystem_e801cb;
  const actions = node.actions || [];
  const setA = (i, patch) => onChange(node.id, { actions: actions.map((a, j) => j === i ? { ...a, ...patch } : a) });
  const add = () => onChange(node.id, { actions: [...actions, { trigger: 'click', type: 'navigate', to: pages[0] && pages[0].id }] });
  const del = (i) => onChange(node.id, { actions: actions.filter((_, j) => j !== i) });

  return (
    <Section title={`Interactions · ${actions.length}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {actions.map((a, i) => (
          <div key={i} style={{ border: '1px solid var(--border-subtle)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 94, flex: 'none' }}>
                <Select size="sm" options={[{ value: 'click', label: 'On click' }, { value: 'hover', label: 'On hover' }]}
                  value={a.trigger || 'click'} onChange={e => setA(i, { trigger: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <Select size="sm" options={ACTION_TYPES} value={a.type || 'navigate'} onChange={e => setA(i, { type: e.target.value })} />
              </div>
              <button type="button" title="Remove" onClick={() => del(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}>
                <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
              </button>
            </div>
            {a.type === 'navigate' && (
              <Select size="sm" options={pages.map(p => ({ value: p.id, label: p.name }))} value={a.to || ''} onChange={e => setA(i, { to: e.target.value })} />
            )}
            {a.type === 'url' && (
              <Input size="sm" placeholder="https://…" value={a.to || ''} onChange={e => setA(i, { to: e.target.value })} />
            )}
            {a.type === 'runWorkflow' && (
              <Select size="sm" options={[{ value: '', label: workflows.length ? 'Select workflow…' : 'No workflows yet' }, ...workflows.map(w => ({ value: w.id, label: w.name }))]}
                value={a.workflowId || ''} onChange={e => setA(i, { workflowId: e.target.value })} />
            )}
            {(a.type === 'dialog' || a.type === 'toggle' || a.type === 'scroll') && (
              <Select size="sm" options={[{ value: '', label: 'Select node…' }, ...allNodes.map(n => ({ value: n.id, label: n.name }))]} value={a.target || ''} onChange={e => setA(i, { target: e.target.value })} />
            )}
            {a.type === 'toast' && (
              <Input size="sm" placeholder="Message" value={a.message || ''} onChange={e => setA(i, { message: e.target.value })} />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" fullWidth onClick={add} iconLeft={<i data-lucide="plus"></i>}>Add interaction</Button>
      </div>
    </Section>
  );
}
window.ActionsEditor = ActionsEditor;

const EFFECT_TYPES = [
  ['drop', 'Shadow'], ['inner', 'Inner'], ['glow', 'Glow'], ['blur', 'Blur'], ['bgblur', 'Bg blur'],
];
const EFFECT_TITLE = { drop: 'Drop shadow', inner: 'Inner shadow', glow: 'Glow', blur: 'Layer blur', bgblur: 'Background blur' };

function EffectsSection({ node, onChange, palette }) {
  const effects = node.effects || [];
  const presets = window.EFFECT_PRESETS || {};
  const setE = (i, patch) => onChange(node.id, { effects: effects.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const add = (type) => onChange(node.id, { effects: [...effects, { ...(presets[type] || { type, on: true }) }] });
  const del = (i) => onChange(node.id, { effects: effects.filter((_, j) => j !== i) });

  return (
    <Section title={`Effects · ${effects.length}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {effects.map((e, i) => {
          const shadowy = e.type === 'drop' || e.type === 'inner';
          return (
            <div key={i} style={{ border: '1px solid var(--border-subtle)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" title="Enabled" checked={e.on !== false} onChange={ev => setE(i, { on: ev.target.checked })} style={{ cursor: 'pointer', accentColor: 'var(--action-solid)' }} />
                <span style={{ flex: 1, fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{EFFECT_TITLE[e.type] || e.type}</span>
                <button type="button" title="Remove" onClick={() => del(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}>
                  <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
                </button>
              </div>
              {(shadowy || e.type === 'glow') && <ColorRowLabeled label="Color" value={e.color} onChange={v => setE(i, { color: v })} palette={palette} />}
              {shadowy && <NumRow label="Offset X" value={e.x ?? 0} min={-200} onChange={v => setE(i, { x: +v || 0 })} />}
              {shadowy && <NumRow label="Offset Y" value={e.y ?? 0} min={-200} onChange={v => setE(i, { y: +v || 0 })} />}
              <NumRow label="Blur" value={e.blur ?? 0} min={0} onChange={v => setE(i, { blur: Math.max(0, +v || 0) })} />
              {(shadowy || e.type === 'glow') && <NumRow label="Spread" value={e.spread ?? 0} min={-100} onChange={v => setE(i, { spread: +v || 0 })} />}
            </div>
          );
        })}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EFFECT_TYPES.map(([type, label]) => (
            <button key={type} type="button" onClick={() => add(type)} title={EFFECT_TITLE[type]}
              style={{ flex: '1 0 auto', height: 26, padding: '0 8px', cursor: 'pointer', fontSize: 11, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)' }}>+ {label}</button>
          ))}
        </div>
      </div>
    </Section>
  );
}
window.EffectsSection = EffectsSection;

// Photoshop-style text layer styles: stroke ("text border"), stacked shadows/glow, gradient fill,
// decoration, italic. Applies to every kind that renders text (window.TEXT_KINDS).
function TextEffectsSection({ node, onChange, palette, kind }) {
  const { Select, Switch, Button } = window.LatticeDesignSystem_e801cb;
  const shadows = node.textShadows || [];
  const presets = window.TEXT_SHADOW_PRESETS || {};
  const set = (k) => (v) => onChange(node.id, { [k]: v });
  const setS = (i, patch) => onChange(node.id, { textShadows: shadows.map((s, j) => j === i ? { ...s, ...patch } : s) });
  const addS = (type) => onChange(node.id, { textShadows: [...shadows, { ...(presets[type] || { type, on: true }) }] });
  const delS = (i) => onChange(node.id, { textShadows: shadows.filter((_, j) => j !== i) });
  const strokeOn = (node.textStrokeWidth || 0) > 0;
  const canGradient = window.TEXT_GRADIENT_KINDS && window.TEXT_GRADIENT_KINDS.has(kind);

  return (
    <Section title="Text effects">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Stroke — the text border */}
        <Switch label="Stroke" checked={strokeOn}
          onChange={on => onChange(node.id, on
            ? { textStrokeWidth: node.textStrokeWidth || 1, textStrokeColor: node.textStrokeColor || 'var(--text-primary)' }
            : { textStrokeWidth: 0 })} />
        {strokeOn && (
          <>
            <NumRow label="Width" value={node.textStrokeWidth ?? 1} min={0} step={0.5} onChange={v => set('textStrokeWidth')(Math.max(0, +v || 0))} />
            <ColorRowLabeled label="Color" value={node.textStrokeColor} onChange={set('textStrokeColor')} palette={palette} />
          </>
        )}

        {/* Gradient text fill (only where background-clip:text works) */}
        {canGradient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...rowLbl, width: 76, flex: 'none' }}>Gradient</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ColorField value={null} onChange={() => {}} palette={palette}
                allowGradient gradient={node.textGradient} onGradient={set('textGradient')} />
            </div>
          </div>
        )}

        {/* Stacked shadows / glows */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ ...rowLbl }}>Shadows · {shadows.length}</span>
          {shadows.map((s, i) => (
            <div key={i} style={{ border: '1px solid var(--border-subtle)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" title="Enabled" checked={s.on !== false} onChange={e => setS(i, { on: e.target.checked })} style={{ cursor: 'pointer', accentColor: 'var(--action-solid)' }} />
                <span style={{ flex: 1, fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{s.type === 'glow' ? 'Glow' : 'Drop shadow'}</span>
                <button type="button" title="Remove" onClick={() => delS(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}>
                  <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
                </button>
              </div>
              <ColorRowLabeled label="Color" value={s.color} onChange={v => setS(i, { color: v })} palette={palette} />
              {s.type !== 'glow' && <NumRow label="Offset X" value={s.x ?? 0} min={-100} onChange={v => setS(i, { x: +v || 0 })} />}
              {s.type !== 'glow' && <NumRow label="Offset Y" value={s.y ?? 0} min={-100} onChange={v => setS(i, { y: +v || 0 })} />}
              <NumRow label="Blur" value={s.blur ?? 0} min={0} onChange={v => setS(i, { blur: Math.max(0, +v || 0) })} />
              <NumRow label="Spread" value={s.spread ?? 0} min={0} onChange={v => setS(i, { spread: Math.max(0, Math.min(100, +v || 0)) })} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => addS('drop')} style={txBtn}>+ Shadow</button>
            <button type="button" onClick={() => addS('glow')} style={txBtn}>+ Glow</button>
          </div>
        </div>

        {/* Decoration + italic + word spacing */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Select label="Decoration" size="sm" options={['none', 'underline', 'line-through', 'overline']}
            value={node.textDecoration || 'none'} onChange={e => set('textDecoration')(e.target.value)} />
          {node.textDecoration && node.textDecoration !== 'none' && (
            <>
              <Select label="Line style" size="sm" options={['solid', 'dashed', 'dotted', 'wavy', 'double']}
                value={node.textDecorationStyle || 'solid'} onChange={e => set('textDecorationStyle')(e.target.value)} />
              <ColorRowLabeled label="Line color" value={node.textDecorationColor} onChange={set('textDecorationColor')} palette={palette} />
              <NumRow label="Thickness" value={node.textDecorationThickness ?? 0} min={0} onChange={v => set('textDecorationThickness')(Math.max(0, +v || 0))} />
            </>
          )}
          <Switch label="Italic" checked={node.fontStyle === 'italic'} onChange={on => set('fontStyle')(on ? 'italic' : 'normal')} />
          <NumRow label="Word sp." value={node.wordSpacing ?? 0} min={-20} onChange={v => set('wordSpacing')(+v || 0)} />
          <Button variant="outline" size="sm" fullWidth iconLeft={<i data-lucide="rotate-ccw"></i>}
            onClick={() => onChange(node.id, { textStrokeWidth: 0, textShadows: [], textGradient: null, textDecoration: 'none', fontStyle: 'normal', wordSpacing: 0 })}>
            Reset text effects
          </Button>
        </div>
      </div>
    </Section>
  );
}
const txBtn = { flex: 1, height: 26, cursor: 'pointer', fontSize: 11, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)' };
window.TextEffectsSection = TextEffectsSection;

// Reusable icon adjustments for any slot that renders a lucide glyph. `keys` maps each generic
// option onto the node field that stores it, so one editor drives the Icon node, the Button's icon
// and the Input's prefix/suffix. Pass `extras` for per-component controls (placement, gap, align).
// Omit a key to hide that control (e.g. the Input's shared style block has no picker).
function IconOptions({ node, onChange, palette, keys = {}, showPicker = true, pickerLabel = 'Icon', defaults = {}, extras = null }) {
  const { Switch } = window.LatticeDesignSystem_e801cb;
  const set = (k) => (v) => k && onChange(node.id, { [k]: v });
  const val = (k, d) => (k && node[k] != null ? node[k] : d);
  const dSize = defaults.size ?? 24;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showPicker && keys.name && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{pickerLabel}</div>
          <IconPicker value={node[keys.name]} onChange={set(keys.name)} placeholder="No icon" />
        </div>
      )}
      {keys.size   && <NumRow label="Size"   prop={keys.size} value={val(keys.size, dSize)} min={4} onChange={v => set(keys.size)(Math.max(4, +v || 4))} />}
      {keys.color  && <ColorRowLabeled label="Color" prop={keys.color} value={node[keys.color]} onChange={set(keys.color)} palette={palette} />}
      {keys.stroke && <NumRow label="Stroke" prop={keys.stroke} value={val(keys.stroke, 2)} min={0.25} step={0.25} onChange={v => set(keys.stroke)(Math.max(0.25, Math.min(6, +v || 2)))} />}
      {keys.rotate && <NumRow label="Rotation °" prop={keys.rotate} value={val(keys.rotate, 0)} min={-360} onChange={v => set(keys.rotate)(+v || 0)} />}
      {keys.opacity && <NumRow label="Opacity %" prop={keys.opacity} value={val(keys.opacity, 100)} min={0} onChange={v => set(keys.opacity)(Math.max(0, Math.min(100, +v || 0)))} />}
      {keys.flipH  && <Switch label="Flip horizontal" checked={!!node[keys.flipH]} onChange={set(keys.flipH)} />}
      {keys.flipV  && <Switch label="Flip vertical"   checked={!!node[keys.flipV]} onChange={set(keys.flipV)} />}
      {extras}
    </div>
  );
}
window.IconOptions = IconOptions;
