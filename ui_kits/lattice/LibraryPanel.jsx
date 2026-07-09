/* global React */
// Left panel — categorized component library. Tiles are click-to-place and draggable onto the canvas.
function LibraryPanel({ onPlace, customComponents = [], onDeleteCustom, libraryComponents = [] }) {
  const { Input } = window.LatticeDesignSystem_e801cb;
  const [q, setQ] = React.useState('');
  const cats = [
    { group: 'Layout', items: [
      { name: 'Frame', icon: 'frame', kind: 'frame' },
      { name: 'Stack', icon: 'rows-3', kind: 'stack' },
      { name: 'Grid', icon: 'layout-grid', kind: 'grid' },
      { name: 'Card', icon: 'square', kind: 'card' },
      { name: 'Divider', icon: 'minus', kind: 'divider' },
    ] },
    { group: 'Content', items: [
      { name: 'Heading', icon: 'heading', kind: 'heading' },
      { name: 'Text', icon: 'type', kind: 'text' },
      { name: 'Icon', icon: 'sparkles', kind: 'icon' },
      { name: 'Image', icon: 'image', kind: 'image' },
      { name: 'Avatar', icon: 'circle-user', kind: 'avatar' },
      { name: 'Badge', icon: 'badge', kind: 'badge' },
      { name: 'Link', icon: 'link', kind: 'link' },
    ] },
    { group: 'Forms', items: [
      { name: 'Button', icon: 'square', kind: 'button' },
      { name: 'Input', icon: 'text-cursor-input', kind: 'input' },
      { name: 'Select', icon: 'chevrons-up-down', kind: 'select' },
      { name: 'Switch', icon: 'toggle-right', kind: 'switch' },
      { name: 'Checkbox', icon: 'square-check', kind: 'checkbox' },
    ] },
    { group: 'Data', items: [
      { name: 'List', icon: 'list', kind: 'list' },
      { name: 'Progress', icon: 'loader', kind: 'progress' },
      { name: 'Chart', icon: 'chart-column', kind: 'chart' },
    ] },
    { group: 'Shapes', items: [
      { name: 'Rectangle', icon: 'square', kind: 'rect' },
      { name: 'Ellipse', icon: 'circle', kind: 'ellipse' },
      { name: 'Line', icon: 'minus', kind: 'line' },
      { name: 'Triangle', icon: 'triangle', kind: 'triangle' },
      { name: 'Star', icon: 'star', kind: 'star' },
      { name: 'Polygon', icon: 'pentagon', kind: 'polygon' },
      { name: 'Arrow', icon: 'move-right', kind: 'arrow' },
    ] },
  ];
  const needle = q.trim().toLowerCase();
  const customMatches = (customComponents || []).filter(c => c.name.toLowerCase().includes(needle));
  const libMatches = (libraryComponents || []).filter(c => c.name.toLowerCase().includes(needle));

  // Saved variant tile — places its captured props onto a fresh node of its base kind.
  // `deletable` is false for read-only library assets (managed in the workspace Library page).
  const customTile = (c, deletable = true) => {
    const payload = { name: c.name, icon: c.icon || 'shapes', kind: c.base, props: c.props || {}, custom: true };
    return (
      <div key={c.id} style={{ position: 'relative' }}>
        <button type="button" draggable
          onDragStart={e => { e.dataTransfer.setData('application/lattice-component', JSON.stringify(payload)); e.dataTransfer.effectAllowed = 'copy'; }}
          onClick={() => onPlace(payload)}
          title={'Drag to canvas or click to place ' + c.name}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px', width: '100%',
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', cursor: 'grab', fontSize: 12, fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <i data-lucide={c.icon || 'shapes'} style={{ width: 14, height: 14 }}></i>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
        </button>
        {deletable && onDeleteCustom && (
          <button type="button" title="Delete component" onClick={() => onDeleteCustom(c.id)}
            style={{ position: 'absolute', top: -6, right: -6, width: 15, height: 15, borderRadius: '50%', border: 0, background: 'var(--surface-raised)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, lineHeight: '13px', padding: 0 }}>×</button>
        )}
      </div>
    );
  };

  const tile = (c) => (
    <button key={c.name} type="button" draggable
      onDragStart={e => { e.dataTransfer.setData('application/lattice-component', JSON.stringify(c)); e.dataTransfer.effectAllowed = 'copy'; }}
      onClick={() => onPlace(c)}
      title={'Drag to canvas or click to place ' + c.name}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px',
        background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)', cursor: 'grab', fontSize: 12, fontFamily: 'var(--font-sans)',
        transition: 'border-color var(--dur-fast), color var(--dur-fast)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
      <i data-lucide={c.icon} style={{ width: 14, height: 14 }}></i>{c.name}
    </button>
  );

  return (
    <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Library</div>
      <Input iconLeft={<i data-lucide="search"></i>} placeholder="Search components" size="sm" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {libMatches.length > 0 && (
          <div>
            {!needle && <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-disabled)', marginBottom: 6 }}>From library</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{libMatches.map(c => customTile(c, false))}</div>
          </div>
        )}
        {customMatches.length > 0 && (
          <div>
            {!needle && <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-disabled)', marginBottom: 6 }}>Custom</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{customMatches.map(c => customTile(c))}</div>
          </div>
        )}
        {cats.map(cat => {
          const items = cat.items.filter(c => c.name.toLowerCase().includes(needle));
          if (!items.length) return null;
          return (
            <div key={cat.group}>
              {!needle && <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-disabled)', marginBottom: 6 }}>{cat.group}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{items.map(tile)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.LibraryPanel = LibraryPanel;
