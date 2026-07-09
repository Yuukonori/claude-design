/* global React, ColorField, IconPicker, AnimationSection, HoverSection, ActionsEditor, EffectsSection, TextEffectsSection, IconOptions */
// Right panel — component-aware inspector for the selected node.

function kindOf(node) {
  if (node.kind) return node.kind;
  const byIcon = { frame: 'frame', 'rows-3': 'stack', 'layout-grid': 'grid', type: 'heading', square: 'button', 'text-cursor-input': 'input', image: 'image', minus: 'divider' };
  return byIcon[node.icon] || 'frame';
}
const CONTAINER = new Set(['frame', 'stack', 'grid', 'card', 'section']);
const NO_TEXT = new Set(['divider', 'image', 'icon', 'avatar', 'switch', 'select', 'list', 'progress', 'chart', 'rect', 'ellipse', 'line', 'triangle', 'star', 'polygon', 'arrow',
  'textarea', 'radio', 'slider', 'tabs', 'breadcrumb', 'alert', 'table', 'stat']);
const SHAPE = new Set(['rect', 'ellipse', 'line', 'triangle', 'star', 'polygon', 'arrow']);
// Kinds that draw a border by default (their own component style) — the Border switch reflects that
// default as ON, and turning it off actually removes the field's border.
const BORDER_INTRINSIC = new Set(['input', 'textarea']);
window.kindOf = kindOf;

function Inspector({ node, onChange, onBaseChange, onRename, connections, onDelete, onDetach, onDuplicate, allNodes = [], onSetParent, responsive = true, palette = [], pages = [], workflows = [], variables = [], pageVars = [], editingState = 'default', onSetEditingState, singleSelected = true, onResetState, editingFrame = null, onSetEditingFrame, onAddCustomState, onUpdateCustomState, onDeleteCustomState, onAddFrame, onUpdateFrame, onDeleteFrame, frameEditing = false, onOpenAnimEditor, onSaveAsComponent, onEditShader, shaderPresets, width, assets = [], onAddAsset }) {
  const SHADERS = shaderPresets || window.SHADER_PRESETS || { plasma: '' };
  const { Select, Switch, Tag, Badge, Button, Input } = window.LatticeDesignSystem_e801cb;

  if (!node) {
    return (
      <aside style={{ ...inspAside, width: width || inspAside.width }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
          <i data-lucide="mouse-pointer-click" style={{ width: 22, height: 22, color: 'var(--text-disabled)' }}></i>
          <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, color: 'var(--text-secondary)' }}>Nothing selected</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 180 }}>Select a node on the canvas to inspect its properties.</div>
        </div>
      </aside>
    );
  }

  const kind = kindOf(node);
  const isContainer = CONTAINER.has(kind);
  const perCorner = Array.isArray(node.radii) && node.radii.length === 4;
  // input-like kinds have a border by default → "on" unless explicitly disabled (borderWidth === 0)
  const borderOn = BORDER_INTRINSIC.has(kindOf(node)) ? node.borderWidth !== 0 : (node.borderWidth || 0) > 0;
  const isTextKind = !!(window.TEXT_KINDS && window.TEXT_KINDS.has(kind));
  const rel = connections.filter(c => c.from === node.id || c.to === node.id);
  const set = (k) => (v) => onChange(node.id, { [k]: v });
  const setNum = (k, min) => (v) => onChange(node.id, { [k]: Math.max(min ?? -99999, +v || 0) });
  // Image source: upload a binary (stored as an internal asset path) or pick an existing asset. The
  // node's `src` then holds an internal path like "src/assets/logo.png", resolved at render time.
  const assetImages = (assets || []).filter(a => a.type === 'file' && a.dataUrl && /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i.test(a.path));
  const pickImageAsset = () => {
    if (!onAddAsset) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { const path = onAddAsset(file.name, reader.result, file.type); if (path) set('src')(path); };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  const renderImgSource = () => (
    <div style={{ display: 'flex', gap: 6 }}>
      <Button variant="outline" size="sm" onClick={pickImageAsset} iconLeft={<i data-lucide="upload"></i>}>Upload</Button>
      {assetImages.length > 0 && (
        <Select size="sm" value="" title="Use an asset by internal path" wrapStyle={{ flex: 1 }}
          onChange={e => { if (e.target.value) set('src')(e.target.value); }}
          options={[{ value: '', label: 'From assets…' }].concat(assetImages.map(a => ({ value: a.path, label: a.path.split('/').pop() })))} />
      )}
    </div>
  );
  // W/H editing keeps the ratio when "Lock aspect ratio" is on
  const ratio = (node.w && node.h) ? node.w / node.h : 1;
  const setW = (v) => { const w = Math.max(12, +v || 12); if (node.lockAspect) onChange(node.id, { w, h: Math.max(8, Math.round(w / ratio)) }); else set('w')(w); };
  const setH = (v) => { const h = Math.max(8, +v || 8); if (node.lockAspect) onChange(node.id, { w: Math.max(12, Math.round(h * ratio)), h }); else set('h')(h); };
  const chartStr = (v) => Array.isArray(v) ? v.join(', ') : (v || '');

  const currentParentConn = connections.find(c => c.to === node.id && c.kind === 'child');
  const currentParentId = currentParentConn?.from || null;
  const hasParent = !!currentParentId;
  const otherNodes = allNodes.filter(n => n.id !== node.id);

  return (
    <aside key={node.id} style={{ ...inspAside, width: width || inspAside.width }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i data-lucide={node.icon} style={{ width: 15, height: 15, color: 'var(--text-secondary)' }}></i>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{kind}</span>
        <Badge tone={node.synced ? 'success' : 'warning'}>{node.synced ? 'Synced' : 'Modified'}</Badge>
      </div>

      <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto', flex: 1, minHeight: 0 }}>

        {frameEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--blue-base)', borderRadius: 4, background: 'var(--blue-base)18', fontSize: 11.5, color: 'var(--text-secondary)' }}>
            <i data-lucide="film" style={{ width: 14, height: 14, color: 'var(--blue-base)', flex: 'none' }}></i>
            Editing this keyframe — changes below shape only this frame.
          </div>
        )}

        {!frameEditing && singleSelected && onSetEditingState && (() => {
          const NAME = { default: 'Default', hoverOn: 'Hover On', hoverOff: 'Hover Off', clickOn: 'Click On' };
          const customs = node.customStates || [];
          const nameOf = (k) => NAME[k] || (customs.find(c => c.id === k) || {}).name || k;
          const has = (k) => window.stateHasOverrides && window.stateHasOverrides(node, k);
          const off = (k) => window.stateEnabled && !window.stateEnabled(node, k);
          const tag = (k) => (has(k) ? '  •' : '') + (off(k) ? '  (off)' : '');
          const enabled = window.stateEnabled ? window.stateEnabled(node, editingState) : true;
          const st = (node.states && node.states[editingState]) || {};
          const custom = customs.find(c => c.id === editingState);
          const opts = ['default', 'hoverOn', 'hoverOff', 'clickOn'].map(k => ({ value: k, label: NAME[k] + (k === 'default' ? '' : tag(k)) }))
            .concat(customs.map(c => ({ value: c.id, label: c.name + tag(c.id) })))
            .concat([{ value: '__new', label: '＋ New custom state' }]);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select label="Interaction state" size="sm" value={editingState}
                onChange={e => e.target.value === '__new' ? (onAddCustomState && onAddCustomState()) : onSetEditingState(e.target.value)} options={opts} />
              {editingState !== 'default' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 4, background: 'var(--surface-inset)', opacity: enabled ? 1 : 0.65 }}>
                  {custom && <Input label="State name" size="sm" value={custom.name} onChange={e => onUpdateCustomState && onUpdateCustomState(custom.id, { name: e.target.value })} />}
                  {custom && <Select label="Type" size="sm" options={[{ value: 'static', label: 'Static' }, { value: 'anim', label: 'Animation (frames)' }]}
                    value={custom.type || 'static'} onChange={e => onUpdateCustomState && onUpdateCustomState(custom.id, { type: e.target.value })} />}
                  <Switch label={`Enable ${nameOf(editingState)}`} checked={enabled} onChange={on => onChange(node.id, { off: !on })} />

                  {(!custom || custom.type !== 'anim') && (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Changes below apply only when <b>{nameOf(editingState)}</b> is active{enabled ? '' : ' — currently disabled'}.</div>
                      <NumRow label="Duration ms" value={st.dur ?? 150} min={0} onChange={v => onChange(node.id, { dur: Math.max(0, +v || 0) })} />
                      <Select label="Easing" size="sm" options={['ease-out', 'ease-in-out', 'ease-in', 'linear']} value={st.ease || 'ease-out'} onChange={e => onChange(node.id, { ease: e.target.value })} />
                      {editingState === 'clickOn' && (
                        <Select label="Click mode" size="sm" options={[{ value: 'toggle', label: 'Toggle (sticky)' }, { value: 'press', label: 'While pressed' }]}
                          value={node.clickMode || 'toggle'} onChange={e => (onBaseChange || onChange)(node.id, { clickMode: e.target.value })} />
                      )}
                    </>
                  )}

                  {custom && custom.type === 'anim' && (
                    <>
                      <Switch label="Loop" checked={!!custom.loop} onChange={on => onUpdateCustomState(custom.id, { loop: on })} />
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Open the editor to duplicate the component into keyframes, connect them, and set each transition's duration. Preview plays them in order.</div>
                      <Button variant="solid" size="sm" fullWidth iconLeft={<i data-lucide="film"></i>} onClick={() => onOpenAnimEditor && onOpenAnimEditor(custom.id)}>
                        Adjust{(custom.frames || []).length ? ` (${custom.frames.length} keyframe${custom.frames.length === 1 ? '' : 's'})` : ''}
                      </Button>
                    </>
                  )}

                  {custom
                    ? <Button variant="danger" size="sm" fullWidth iconLeft={<i data-lucide="trash-2"></i>} onClick={() => onDeleteCustomState && onDeleteCustomState(custom.id)}>Delete state</Button>
                    : <Button variant="outline" size="sm" fullWidth iconLeft={<i data-lucide="rotate-ccw"></i>} onClick={() => onResetState && onResetState(node.id, editingState)}>Reset this state</Button>}
                </div>
              )}
            </div>
          );
        })()}

        <Section title="Content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input label="Name" size="sm" value={node.name} onChange={e => onRename(node.id, e.target.value)} />
            {!NO_TEXT.has(kind) && (
              <Input label={kind === 'input' ? 'Label' : 'Text'} size="sm" value={node.label || ''} placeholder="Displayed text"
                onChange={e => onChange(node.id, { label: e.target.value })} />
            )}
          </div>
        </Section>

        <Section title="Dimensions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr 14px 1fr', columnGap: 6, rowGap: 6, alignItems: 'center' }}>
              <FieldLabel>W</FieldLabel>
              <input title="Width" type="number" value={node.w} min={12} onChange={e => setW(e.target.value)} style={numIn} />
              <FieldLabel>H</FieldLabel>
              <input title="Height" type="number" value={node.h} min={8} onChange={e => setH(e.target.value)} style={numIn} />
              <FieldLabel>X</FieldLabel>
              <input title="X position" type="number" value={node.x} onChange={e => set('x')(+e.target.value || 0)} style={numIn} />
              <FieldLabel>Y</FieldLabel>
              <input title="Y position" type="number" value={node.y} onChange={e => set('y')(+e.target.value || 0)} style={numIn} />
            </div>
            <Switch label="Lock aspect ratio" checked={!!node.lockAspect} onChange={set('lockAspect')} />
          </div>
        </Section>

        <Section title="Transform">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <NumRow label="Scale %" value={node.scale ?? 100} min={1} onChange={v => set('scale')(Math.max(1, Math.min(1000, +v || 100)))} />
            <NumRow label="Rotation °" value={node.rotation ?? 0} min={-360} onChange={v => set('rotation')(+v || 0)} />
            <NumRow label="Skew X °" value={node.skewX ?? 0} min={-89} onChange={v => set('skewX')(Math.max(-89, Math.min(89, +v || 0)))} />
            <NumRow label="Skew Y °" value={node.skewY ?? 0} min={-89} onChange={v => set('skewY')(Math.max(-89, Math.min(89, +v || 0)))} />
            <Select label="Origin" size="sm" options={['center', 'top left', 'top', 'top right', 'left', 'right', 'bottom left', 'bottom', 'bottom right']}
              value={node.transformOrigin || 'center'} onChange={e => set('transformOrigin')(e.target.value)} />
            <Switch label="Flip horizontal" checked={!!node.flipH} onChange={set('flipH')} />
            <Switch label="Flip vertical"   checked={!!node.flipV} onChange={set('flipV')} />
            <Button variant="outline" size="sm" fullWidth iconLeft={<i data-lucide="rotate-ccw"></i>}
              onClick={() => onChange(node.id, { scale: 100, rotation: 0, skewX: 0, skewY: 0, flipH: false, flipV: false, transformOrigin: 'center' })}>
              Reset transform
            </Button>
          </div>
        </Section>

        {isContainer && (
          <Section title="Layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select label="Direction" size="sm" options={['Flex row', 'Flex column', 'Grid', 'Stack']}
                value={node.layout || 'Flex column'} onChange={e => onChange(node.id, { layout: e.target.value })} />
              {(node.layout === 'Grid' || kind === 'grid') && <NumRow label="Columns" value={node.columns ?? 2} min={1} onChange={setNum('columns', 1)} />}
              <NumRow label="Gap" value={node.gap ?? 0} min={0} onChange={setNum('gap', 0)} />
              <NumRow label="Padding" value={node.padding ?? 0} min={0} onChange={setNum('padding', 0)} />
              <Select label="Align" size="sm" options={['start', 'center', 'end', 'stretch']} value={node.align || 'stretch'} onChange={e => set('align')(e.target.value)} />
              <Select label="Justify" size="sm" options={['start', 'center', 'end', 'space-between', 'space-around']} value={node.justify || 'start'} onChange={e => set('justify')(e.target.value)} />
            </div>
          </Section>
        )}

        {isTextKind && (
          <Section title="Typography">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <NumRow label="Font size" value={node.fontSize ?? (kind === 'heading' ? 28 : 14)} min={8} onChange={setNum('fontSize', 8)} />
              <Select label="Weight" size="sm" options={['regular', 'medium', 'semibold', 'bold']} value={node.fontWeight || (kind === 'heading' ? 'semibold' : 'regular')} onChange={e => set('fontWeight')(e.target.value)} />
              <Select label="Font family" size="sm" options={['Grotesk (UI)', 'Serif display', 'Mono', 'System']} value={node.fontFamily || (kind === 'heading' ? 'Serif display' : 'Grotesk (UI)')} onChange={e => set('fontFamily')(e.target.value)} />
              <NumRow label="Line height" value={node.lineHeight ?? 1.4} min={0.8} step={0.1} onChange={v => set('lineHeight')(+v || 1.4)} />
              <NumRow label="Letter sp." value={node.letterSpacing ?? 0} min={-5} step={0.5} onChange={v => set('letterSpacing')(+v || 0)} />
              <Select label="Transform" size="sm" options={['none', 'uppercase', 'lowercase', 'capitalize']} value={node.textTransform || 'none'} onChange={e => set('textTransform')(e.target.value)} />
              <Select label="Align" size="sm" options={['left', 'center', 'right', 'justify']} value={node.textAlign || 'left'} onChange={e => set('textAlign')(e.target.value)} />
              <CRow label="Text color" value={node.textColor} onChange={set('textColor')} palette={palette} />
            </div>
          </Section>
        )}

        {isTextKind && TextEffectsSection && <TextEffectsSection node={node} onChange={onChange} palette={palette} kind={kind} />}

        {kind === 'icon' && IconOptions && (
          <Section title="Icon">
            <IconOptions node={node} onChange={onChange} palette={palette}
              keys={{ name: 'iconName', size: 'iconSize', color: 'textColor', stroke: 'iconStroke', rotate: 'iconRotate', opacity: 'iconOpacity', flipH: 'iconFlipH', flipV: 'iconFlipV' }}
              extras={
                <>
                  <Select label="Align" size="sm" options={['left', 'center', 'right']} value={node.iconAlign || 'center'} onChange={e => set('iconAlign')(e.target.value)} />
                  <Select label="Vertical align" size="sm" options={['top', 'middle', 'bottom']} value={node.iconVAlign || 'middle'} onChange={e => set('iconVAlign')(e.target.value)} />
                </>
              } />
          </Section>
        )}

        {kind === 'button' && (
          <Section title="Button">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select label="Variant" size="sm" options={['solid', 'outline', 'ghost', 'danger']} value={node.variant || 'solid'} onChange={e => set('variant')(e.target.value)} />
              <Select label="Size" size="sm" options={['sm', 'md', 'lg']} value={node.btnSize || 'md'} onChange={e => set('btnSize')(e.target.value)} />
              <Switch label="Full width" checked={!!node.fullWidth} onChange={set('fullWidth')} />
              <Switch label="Disabled" checked={!!node.disabled} onChange={set('disabled')} />
              {IconOptions && (
                <div style={dividerBlock}>
                  <IconOptions node={node} onChange={onChange} palette={palette} defaults={{ size: 15 }}
                    keys={{ name: 'btnIcon', size: 'btnIconSize', color: 'btnIconColor', stroke: 'btnIconStroke', rotate: 'btnIconRotate', opacity: 'btnIconOpacity', flipH: 'btnIconFlipH', flipV: 'btnIconFlipV' }}
                    extras={
                      <>
                        <Select label="Position" size="sm" options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'only', label: 'Icon only' }]}
                          value={node.btnIconPos || 'left'} onChange={e => set('btnIconPos')(e.target.value)} />
                        <NumRow label="Gap" value={node.btnIconGap ?? 7} min={0} onChange={v => set('btnIconGap')(Math.max(0, +v || 0))} />
                      </>
                    } />
                </div>
              )}
            </div>
          </Section>
        )}

        {kind === 'input' && (
          <Section title="Field">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Placeholder" size="sm" placeholder="name@studio.com" value={node.placeholder || ''} onChange={e => set('placeholder')(e.target.value)} />
              <Input label="Default value" size="sm" placeholder="Prefilled text" value={node.inputValue || ''} onChange={e => set('inputValue')(e.target.value)} />
              <Input label="Field label" size="sm" placeholder="(none)" value={node.fieldLabel || ''} onChange={e => set('fieldLabel')(e.target.value)} />
              <Input label="Helper text" size="sm" placeholder="(none)" value={node.helperText || ''} onChange={e => set('helperText')(e.target.value)} />
              <CRow label="Placeholder" value={node.placeholderColor} onChange={set('placeholderColor')} palette={palette} />

              <div style={dividerBlock}>
                <Select label="Input type" size="sm" options={['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date', 'time']} value={node.inputType || 'text'} onChange={e => set('inputType')(e.target.value)} />
                <Select label="Size" size="sm" options={['sm', 'md', 'lg']} value={node.inputSize || 'md'} onChange={e => set('inputSize')(e.target.value)} />
                <Switch label="Required"  checked={!!node.required} onChange={set('required')} />
                <Switch label="Disabled"  checked={!!node.disabled} onChange={set('disabled')} />
                <Switch label="Read only" checked={!!node.readOnly} onChange={set('readOnly')} />
                <NumRow label="Max length" value={node.maxLength ?? 0} min={0} onChange={v => set('maxLength')(Math.max(0, +v || 0))} />
                <Input label="Name" size="sm" placeholder="username" value={node.inputName || ''} onChange={e => set('inputName')(e.target.value)} />
                <Input label="Autocomplete" size="sm" placeholder="off, email, current-password…" value={node.autocomplete || ''} onChange={e => set('autocomplete')(e.target.value)} />
              </div>

              {node.inputType === 'number' && (
                <div style={dividerBlock}>
                  <NumRow label="Min"  value={node.min ?? 0} min={-99999} onChange={v => set('min')(+v || 0)} />
                  <NumRow label="Max"  value={node.max ?? 100} min={-99999} onChange={v => set('max')(+v || 0)} />
                  <NumRow label="Step" value={node.step ?? 1} min={0} step={0.1} onChange={v => set('step')(+v || 1)} />
                </div>
              )}

              {node.inputType === 'password' && (
                <div style={dividerBlock}>
                  <Switch label="Show/hide toggle" checked={!!node.passwordToggle} onChange={set('passwordToggle')} />
                </div>
              )}

              <div style={dividerBlock}>
                <div><div style={fieldCap}>Prefix icon</div><IconPicker value={node.prefixIcon} onChange={set('prefixIcon')} placeholder="No icon" /></div>
                <div>
                  <div style={fieldCap}>Suffix icon</div>
                  <IconPicker value={node.suffixIcon} onChange={set('suffixIcon')} placeholder="No icon" />
                  {node.inputType === 'password' && node.passwordToggle && (
                    <div style={{ fontSize: 11, color: 'var(--status-warning-fg, var(--amber-base))', marginTop: 5 }}>
                      Hidden — the show/hide toggle occupies the trailing slot. Turn the toggle off to use a suffix icon.
                    </div>
                  )}
                </div>
                <Switch label="Clearable" checked={!!node.clearable} onChange={set('clearable')} />
                {/* One style set drives both adornment icons (and the clear/eye glyphs). */}
                {IconOptions && (node.prefixIcon || node.suffixIcon || node.clearable || node.passwordToggle) && (
                  <IconOptions node={node} onChange={onChange} palette={palette} showPicker={false} defaults={{ size: 15 }}
                    keys={{ size: 'inputIconSize', color: 'inputIconColor', stroke: 'inputIconStroke', rotate: 'inputIconRotate', opacity: 'inputIconOpacity', flipH: 'inputIconFlipH', flipV: 'inputIconFlipV' }} />
                )}
              </div>

              <div style={dividerBlock}>
                <Switch label="Invalid" checked={!!node.invalid} onChange={set('invalid')} />
                {node.invalid && <Input label="Error text" size="sm" placeholder="This field is required" value={node.errorText || ''} onChange={e => set('errorText')(e.target.value)} />}
              </div>

              <div style={dividerBlock}>
                <Select label="Bind to variable" size="sm"
                  options={[{ value: '', label: '(none)' },
                    ...variables.map(v => ({ value: v.id, label: `${v.name} · Global` })),
                    ...pageVars.map(v => ({ value: v.id, label: `${v.name} · Page` }))]}
                  value={node.bindVar || ''} onChange={e => set('bindVar')(e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  In Preview, typing here updates the variable live — workflows read it as <span style={{ fontFamily: 'var(--font-mono)' }}>{'{{name}}'}</span>. Manage variables in the Workflow tab.
                </div>
              </div>
            </div>
          </Section>
        )}

        {kind === 'select' && (
          <Section title="Select">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Placeholder" size="sm" value={node.placeholder || ''} placeholder="Select…" onChange={e => set('placeholder')(e.target.value)} />
              <Input label="Options (comma-separated)" size="sm" value={node.optionsText || ''} placeholder="One, Two, Three" onChange={e => set('optionsText')(e.target.value)} />
            </div>
          </Section>
        )}

        {kind === 'textarea' && (
          <Section title="Textarea">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Placeholder" size="sm" placeholder="Write a message…" value={node.placeholder || ''} onChange={e => set('placeholder')(e.target.value)} />
              <Input label="Default value" size="sm" placeholder="Prefilled text" value={node.inputValue || ''} onChange={e => set('inputValue')(e.target.value)} />
              <Input label="Field label" size="sm" placeholder="(none)" value={node.fieldLabel || ''} onChange={e => set('fieldLabel')(e.target.value)} />
              <Input label="Helper text" size="sm" placeholder="(none)" value={node.helperText || ''} onChange={e => set('helperText')(e.target.value)} />
              <NumRow label="Rows" value={node.rows ?? 3} min={1} onChange={v => set('rows')(Math.max(1, +v || 1))} />
              <Select label="Size" size="sm" options={['sm', 'md', 'lg']} value={node.inputSize || 'md'} onChange={e => set('inputSize')(e.target.value)} />
              <Switch label="Disabled"  checked={!!node.disabled} onChange={set('disabled')} />
              <Switch label="Read only" checked={!!node.readOnly} onChange={set('readOnly')} />
            </div>
          </Section>
        )}

        {kind === 'radio' && (
          <Section title="Radio group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Options (comma-separated)" size="sm" value={node.optionsText || ''} placeholder="One, Two, Three" onChange={e => set('optionsText')(e.target.value)} />
              <Switch label="Allow multiple" checked={!!node.radioMulti}
                onChange={on => onChange(node.id, { radioMulti: on, ...(on && !node.selectedMulti ? { selectedMulti: String(node.selected ?? 0) } : {}) })} />
              {node.radioMulti
                ? <Input label="Selected # (comma-sep)" size="sm" value={node.selectedMulti || ''} placeholder="0, 2" onChange={e => set('selectedMulti')(e.target.value)} />
                : <NumRow label="Selected #" value={node.selected ?? 0} min={0} onChange={v => set('selected')(Math.max(0, Math.round(+v || 0)))} />}
              <Select label="Direction" size="sm" options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]}
                value={node.radioDir || 'vertical'} onChange={e => set('radioDir')(e.target.value)} />
            </div>
          </Section>
        )}

        {kind === 'slider' && (
          <Section title="Slider">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <NumRow label="Min"   value={node.min ?? 0}   min={-99999} onChange={v => set('min')(+v || 0)} />
              <NumRow label="Max"   value={node.max ?? 100} min={-99999} onChange={v => set('max')(+v || 0)} />
              <NumRow label="Value" value={node.value ?? 50} min={-99999} onChange={v => set('value')(+v || 0)} />
              <NumRow label="Step"  value={node.step ?? 1}  min={0} step={0.1} onChange={v => set('step')(Math.max(0, +v || 0))} />
              <Switch label="Show value" checked={!!node.showValue} onChange={set('showValue')} />
            </div>
          </Section>
        )}

        {kind === 'tabs' && (
          <Section title="Tabs">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Tabs (comma-separated)" size="sm" value={node.tabsText || ''} placeholder="Overview, Activity, Settings" onChange={e => set('tabsText')(e.target.value)} />
              <NumRow label="Active tab #" value={node.activeTab ?? 0} min={0} onChange={v => set('activeTab')(Math.max(0, Math.round(+v || 0)))} />
            </div>
          </Section>
        )}

        {kind === 'breadcrumb' && (
          <Section title="Breadcrumb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Items (comma-separated)" size="sm" value={node.itemsText || ''} placeholder="Home, Projects, Lattice" onChange={e => set('itemsText')(e.target.value)} />
              <Input label="Separator" size="sm" value={node.separator || ''} placeholder="/" onChange={e => set('separator')(e.target.value)} />
            </div>
          </Section>
        )}

        {kind === 'alert' && (
          <Section title="Alert">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select label="Tone" size="sm" options={['info', 'success', 'warning', 'danger', 'neutral']} value={node.tone || 'info'} onChange={e => set('tone')(e.target.value)} />
              <Input label="Title" size="sm" placeholder="Heads up!" value={node.label || ''} onChange={e => onChange(node.id, { label: e.target.value })} />
              <Input label="Message" size="sm" placeholder="Message body" value={node.alertText || ''} onChange={e => set('alertText')(e.target.value)} />
              <div><div style={fieldCap}>Icon</div><IconPicker value={node.alertIcon} onChange={set('alertIcon')} placeholder="No icon" /></div>
              <CRow label="Text color" value={node.textColor} onChange={set('textColor')} palette={palette} />
            </div>
          </Section>
        )}

        {kind === 'table' && (
          <Section title="Table">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Columns (comma-separated)" size="sm" value={node.tableCols || ''} placeholder="Name, Role, Status" onChange={e => set('tableCols')(e.target.value)} />
              <div><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Rows (one per line, cells comma-separated)</div>
                <textarea value={node.tableRows || ''} title="Table rows" placeholder={'Rin, Design, Active\nLee, Eng, Away'} onChange={e => set('tableRows')(e.target.value)}
                  style={{ width: '100%', minHeight: 72, boxSizing: 'border-box', padding: 8, border: '1px solid var(--border-default)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', resize: 'vertical' }} /></div>
              <Switch label="Striped rows" checked={!!node.striped} onChange={set('striped')} />
              <CRow label="Text color" value={node.textColor} onChange={set('textColor')} palette={palette} />
            </div>
          </Section>
        )}

        {kind === 'stat' && (
          <Section title="Stat">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Label" size="sm" placeholder="Revenue" value={node.label || ''} onChange={e => onChange(node.id, { label: e.target.value })} />
              <Input label="Value" size="sm" placeholder="$48.2k" value={node.statValue || ''} onChange={e => set('statValue')(e.target.value)} />
              <Input label="Delta" size="sm" placeholder="+12.5%" value={node.statDelta || ''} onChange={e => set('statDelta')(e.target.value)} />
              <Select label="Trend" size="sm" options={[{ value: 'up', label: 'Up (green)' }, { value: 'down', label: 'Down (red)' }, { value: 'none', label: 'None' }]}
                value={node.statTrend || 'up'} onChange={e => set('statTrend')(e.target.value)} />
              <CRow label="Text color" value={node.textColor} onChange={set('textColor')} palette={palette} />
            </div>
          </Section>
        )}

        {kind === 'image' && (
          <Section title="Image">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Source (URL or asset path)" size="sm" placeholder="https://… or src/assets/…" value={node.src || ''} onChange={e => set('src')(e.target.value)} />
              {renderImgSource()}
              <Input label="Alt text" size="sm" placeholder="Description" value={node.label || ''} onChange={e => onChange(node.id, { label: e.target.value })} />
              <Select label="Fit" size="sm" options={['cover', 'contain', 'fill', 'none']} value={node.fit || 'cover'} onChange={e => set('fit')(e.target.value)} />
              <NumRow label="Radius" value={node.radius ?? 0} min={0} onChange={setNum('radius', 0)} />
            </div>
          </Section>
        )}

        {kind === 'avatar' && (
          <Section title="Avatar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Name (initials)" size="sm" value={node.label || ''} placeholder="Rin Sato" onChange={e => onChange(node.id, { label: e.target.value })} />
              <Input label="Image (URL or asset path)" size="sm" placeholder="https://… or src/assets/…" value={node.src || ''} onChange={e => set('src')(e.target.value)} />
              {renderImgSource()}
            </div>
          </Section>
        )}

        {kind === 'badge' && (
          <Section title="Badge">
            <Select label="Tone" size="sm" options={['neutral', 'success', 'warning', 'danger', 'info']} value={node.tone || 'neutral'} onChange={e => set('tone')(e.target.value)} />
          </Section>
        )}

        {(kind === 'switch' || kind === 'checkbox') && (
          <Section title={kind === 'switch' ? 'Switch' : 'Checkbox'}>
            <Switch label="Checked" checked={!!node.checked} onChange={set('checked')} />
          </Section>
        )}

        {kind === 'list' && (
          <Section title="List">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Items (one per line)</div>
                <textarea value={node.itemsText || ''} title="List items" placeholder={'First item\nSecond item'} onChange={e => set('itemsText')(e.target.value)}
                  style={{ width: '100%', minHeight: 72, boxSizing: 'border-box', padding: 8, border: '1px solid var(--border-default)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none', resize: 'vertical' }} /></div>
              <Switch label="Numbered" checked={!!node.ordered} onChange={set('ordered')} />
            </div>
          </Section>
        )}

        {kind === 'link' && (
          <Section title="Link">
            <Input label="Href" size="sm" placeholder="https://… or #/page" value={node.href || ''} onChange={e => set('href')(e.target.value)} />
          </Section>
        )}

        {kind === 'progress' && (
          <Section title="Progress">
            <NumRow label="Value %" value={node.value ?? 60} min={0} onChange={v => set('value')(Math.max(0, Math.min(100, +v || 0)))} />
          </Section>
        )}

        {kind === 'chart' && (
          <Section title="Chart">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select label="Type" size="sm" options={['bar', 'line', 'area', 'pie', 'donut']} value={node.chartType || 'bar'} onChange={e => set('chartType')(e.target.value)} />
              <Input label="Data (comma-separated)" size="sm" value={chartStr(node.chartData)} placeholder="40, 70, 30, 90" onChange={e => set('chartData')(e.target.value)} />
              <Input label="Labels (comma-separated)" size="sm" value={chartStr(node.chartLabels)} placeholder="Q1, Q2, Q3, Q4" onChange={e => set('chartLabels')(e.target.value)} />
              <CRow label="Color" value={node.chartColor} onChange={set('chartColor')} palette={palette} />
            </div>
          </Section>
        )}

        {SHAPE.has(kind) && (kind === 'rect' || kind === 'polygon' || kind === 'star') && (
          <Section title="Shape">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {kind === 'rect' && <NumRow label="Corner radius" value={node.radius ?? 0} min={0} onChange={setNum('radius', 0)} />}
              {kind === 'polygon' && <NumRow label="Sides" value={node.sides ?? 6} min={3} onChange={v => set('sides')(Math.max(3, Math.min(12, +v || 6)))} />}
              {kind === 'star' && <NumRow label="Points" value={node.points ?? 5} min={3} onChange={v => set('points')(Math.max(3, Math.min(12, +v || 5)))} />}
              {kind === 'star' && <NumRow label="Inner ratio %" value={Math.round((node.innerRatio ?? 0.5) * 100)} min={5} onChange={v => set('innerRatio')(Math.max(0.05, Math.min(0.95, (+v || 50) / 100)))} />}
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fill &amp; stroke live in Appearance and Border below.</div>
            </div>
          </Section>
        )}

        <Section title="Appearance">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...rowLabel, width: 76, flex: 'none' }}>Fill</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ColorField value={node.fillColor} onChange={set('fillColor')} palette={palette}
                  allowGradient gradient={node.gradient} onGradient={set('gradient')} />
              </div>
            </div>

            <NumRow label="Opacity %" value={node.opacity ?? 100} min={0} onChange={v => set('opacity')(Math.max(0, Math.min(100, +v || 0)))} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...rowLabel, width: 76, flex: 'none' }}>Radius</span>
              <input type="number" title="Corner radius" value={node.radius ?? 0} min={0} onChange={e => set('radius')(Math.max(0, +e.target.value || 0))} style={{ ...numIn, flex: 1 }} />
              <button type="button" title="Per-corner radius" onClick={() => onChange(node.id, { radii: perCorner ? null : [node.radius || 0, node.radius || 0, node.radius || 0, node.radius || 0] })}
                style={{ width: 28, height: 28, flex: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', background: perCorner ? 'var(--surface-hover)' : 'var(--surface-inset)', border: '1px solid ' + (perCorner ? 'var(--text-primary)' : 'var(--border-subtle)'), borderRadius: 3, color: 'var(--text-secondary)' }}>
                <i data-lucide="grid-2x2" style={{ width: 13, height: 13 }}></i>
              </button>
            </div>
            {perCorner && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 6, rowGap: 6 }}>
                {['TL', 'TR', 'BR', 'BL'].map((lbl, i) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FieldLabel>{lbl}</FieldLabel>
                    <input type="number" title={lbl + ' radius'} min={0} value={node.radii[i] ?? 0}
                      onChange={e => onChange(node.id, { radii: node.radii.map((v, j) => j === i ? Math.max(0, +e.target.value || 0) : v) })} style={numIn} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Switch label="Border" checked={borderOn}
                onChange={on => onChange(node.id, on
                  ? { borderWidth: node.borderWidth || 1, borderStyle: node.borderStyle || 'solid', borderColor: node.borderColor || 'var(--border-strong)' }
                  : { borderWidth: 0 })} />
              {borderOn && (
                <>
                  <NumRow label="Width" value={node.borderWidth ?? 1} min={0} onChange={v => set('borderWidth')(Math.max(0, +v || 0))} />
                  <Select label="Style" size="sm" options={['solid', 'dashed', 'dotted']} value={node.borderStyle || 'solid'} onChange={e => set('borderStyle')(e.target.value)} />
                  <CRow label="Color" value={node.borderColor} onChange={set('borderColor')} palette={palette} />
                </>
              )}
            </div>

            <Select label="Blend" size="sm" options={['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'color-dodge']} value={node.blendMode || 'normal'} onChange={e => set('blendMode')(e.target.value)} />
          </div>
        </Section>

        {EffectsSection && <EffectsSection node={node} onChange={onChange} palette={palette} />}

        <Section title="Shader">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Switch label="Shader fill" checked={!!(node.shader && node.shader.on)}
              onChange={on => onChange(node.id, { shader: {
                ...(node.shader || {}),
                on,
                code: (node.shader && node.shader.code) || SHADERS.plasma || '',
                preset: (node.shader && node.shader.preset) || 'plasma',
                speed: (node.shader && node.shader.speed) ?? 1,
              } })} />
            {node.shader && node.shader.on && (
              <>
                <Select label="Preset" size="sm" options={Object.keys(SHADERS)}
                  value={node.shader.preset || 'plasma'}
                  onChange={e => onChange(node.id, { shader: { ...node.shader, preset: e.target.value, code: SHADERS[e.target.value] || node.shader.code } })} />
                <NumRow label="Speed" value={node.shader.speed ?? 1} min={0} step={0.1} onChange={v => onChange(node.id, { shader: { ...node.shader, speed: Math.max(0, +v || 0) } })} />
                <Button variant="outline" size="sm" fullWidth iconLeft={<i data-lucide="code"></i>}
                  onClick={() => onEditShader && onEditShader(node.id)}>Edit code</Button>
              </>
            )}
          </div>
        </Section>

        {/* Node-level sections (not per-state) — only shown while editing the Default state. */}
        {editingState === 'default' && AnimationSection && <AnimationSection node={node} onChange={onChange} />}
        {editingState === 'default' && ActionsEditor && <ActionsEditor node={node} onChange={onChange} pages={pages} allNodes={otherNodes} workflows={workflows} />}

        {editingState === 'default' && <Section title="Behavior">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {responsive && <Switch label="Responsive (per-screen)" checked={node.responsive !== false} onChange={v => onChange(node.id, { responsive: v })} />}
            <Switch label="Clip content"  checked={!!node.clipContent} onChange={v => onChange(node.id, { clipContent: v })} />
            <Switch label="Lock position" checked={!!node.locked}      onChange={v => onChange(node.id, { locked: v })} />
            <Switch label="Hidden"        checked={!!node.hidden}      onChange={v => onChange(node.id, { hidden: v })} />
          </div>
        </Section>}

        {editingState === 'default' && !frameEditing && <Section title={`Relationships · ${rel.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Select label="Parent frame" size="sm" options={['(none)', ...otherNodes.map(n => n.name)]}
              value={currentParentId ? (allNodes.find(n => n.id === currentParentId)?.name || '(none)') : '(none)'}
              onChange={e => {
                if (!onSetParent) return;
                if (e.target.value === '(none)') { onSetParent(node.id, null); return; }
                const parent = otherNodes.find(n => n.name === e.target.value);
                if (parent) onSetParent(node.id, parent.id);
              }} />
            <Button variant="outline" size="sm" fullWidth disabled={!hasParent} onClick={() => onDetach(node.id)} iconLeft={<i data-lucide="unlink"></i>}>Detach from parent</Button>
            {rel.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {rel.map((c, i) => {
                  const isFrom = c.from === node.id;
                  const otherName = allNodes.find(n => n.id === (isFrom ? c.to : c.from))?.name || (isFrom ? c.to : c.from);
                  return <Tag key={i}>{isFrom ? `${c.kind} → ${otherName}` : `child of ${otherName}`}</Tag>;
                })}
              </div>
            )}
          </div>
        </Section>}
      </div>

      {!frameEditing && (
        <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onSaveAsComponent && (
            <Button variant="outline" size="sm" fullWidth onClick={() => onSaveAsComponent(node.id)} iconLeft={<i data-lucide="package-plus"></i>}>Save as component</Button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" fullWidth onClick={onDuplicate} iconLeft={<i data-lucide="copy"></i>}>Duplicate</Button>
            <Button variant="danger"  size="sm" fullWidth onClick={() => onDelete(node.id)} iconLeft={<i data-lucide="trash-2"></i>}>Delete</Button>
          </div>
        </div>
      )}
    </aside>
  );
}

function FieldLabel({ children }) {
  return <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', userSelect: 'none', textAlign: 'center' }}>{children}</span>;
}

function NumRow({ label, value, onChange, min = 0, step = 1 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', columnGap: 8, alignItems: 'center' }}>
      <span style={rowLabel}>{label}</span>
      <input type="number" title={label} value={value} min={min} step={step} onChange={e => onChange(e.target.value)} style={numIn} />
    </div>
  );
}

function CRow({ label, value, onChange, palette }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...rowLabel, width: 76, flex: 'none' }}>{label}</span>
      {/* minWidth:0 lets the field shrink rather than overflow its row */}
      <div style={{ flex: 1, minWidth: 0 }}><ColorField value={value} onChange={onChange} palette={palette} /></div>
    </div>
  );
}

const rowLabel = { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', userSelect: 'none' };
const dividerBlock = { borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 };
const fieldCap = { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 };
const numIn = {
  width: '100%', height: 28, padding: '0 7px', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)',
  color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box', outline: 'none', borderRadius: 3, MozAppearance: 'textfield',
};
const inspAside = { width: 280, flex: 'none', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', background: 'var(--surface)', minHeight: 0 };

// Collapsed section titles persist across selections/sessions so hidden groups stay hidden.
const COLLAPSED = (() => { try { return new Set(JSON.parse(localStorage.getItem('lattice_collapsed') || '[]')); } catch { return new Set(); } })();
const saveCollapsed = () => { try { localStorage.setItem('lattice_collapsed', JSON.stringify([...COLLAPSED])); } catch {} };

// Collapsible option group: click the header to fold it away (like a dropdown), so tall panels
// don't force endless scrolling. The caret is a CSS-rotated glyph (no Lucide re-scan needed).
function Section({ title, children }) {
  const [open, setOpen] = React.useState(!COLLAPSED.has(title));
  const toggle = () => { setOpen(o => { const n = !o; n ? COLLAPSED.delete(title) : COLLAPSED.add(title); saveCollapsed(); return n; }); };
  return (
    <div>
      <button type="button" onClick={toggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', marginBottom: open ? 9 : 0, textAlign: 'left' }}>
        <span style={{ fontSize: 9, color: 'var(--text-disabled)', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>▶</span>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{title}</span>
      </button>
      {open && children}
    </div>
  );
}

window.Inspector = Inspector;
