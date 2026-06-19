/* global React */
// Left panel — component library (searchable) over a layers tree.
function LibraryPanel({ onPlace, layers, selectedId, onSelect }) {
  const { Input, Badge } = window.LatticeDesignSystem_e801cb;
  const [q, setQ] = React.useState('');
  const library = [
    { name: 'Frame', icon: 'frame' }, { name: 'Stack', icon: 'rows-3' },
    { name: 'Grid', icon: 'layout-grid' }, { name: 'Text', icon: 'type' },
    { name: 'Button', icon: 'square' }, { name: 'Input', icon: 'text-cursor-input' },
    { name: 'Image', icon: 'image' }, { name: 'Divider', icon: 'minus' },
  ];
  const filtered = library.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside style={{
      width: 'var(--sidebar-w)', flex: 'none', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', minHeight: 0,
    }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Library</div>
        <Input iconLeft={<i data-lucide="search"></i>} placeholder="Search components" size="sm" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
          {filtered.map(c => (
            <button key={c.name} onClick={() => onPlace(c)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px',
              background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)',
              transition: 'border-color var(--dur-fast), color var(--dur-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <i data-lucide={c.icon} style={{ width: 14, height: 14 }}></i>{c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 12, flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Layers</span>
          <Badge>{layers.length}</Badge>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {layers.map(l => (
            <button key={l.id} onClick={() => onSelect(l.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', paddingLeft: 8 + l.depth * 16,
              background: l.id === selectedId ? 'var(--surface-hover)' : 'transparent',
              border: 0, borderLeft: '2px solid ' + (l.id === selectedId ? 'var(--text-primary)' : 'transparent'),
              color: l.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12.5, fontFamily: 'var(--font-sans)', textAlign: 'left', width: '100%',
            }}>
              <i data-lucide={l.icon} style={{ width: 13, height: 13, opacity: 0.7 }}></i>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
window.LibraryPanel = LibraryPanel;
