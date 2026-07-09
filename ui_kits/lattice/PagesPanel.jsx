/* global React, ContextMenu */
// Left panel — pages list. Add / switch / rename (dbl-click) / delete.
function PagesPanel({ pages, activePageId, onSelect, onAdd, onRename, onDelete }) {
  const [editingId, setEditingId] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  const [menu, setMenu] = React.useState(null); // { x, y, id }

  const startRename = (p) => { setEditingId(p.id); setDraft(p.name); };
  const commitRename = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim());
    setEditingId(null);
  };

  return (
    <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Pages</span>
        <button type="button" title="New page" onClick={onAdd} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22,
          border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
          <i data-lucide="plus" style={{ width: 13, height: 13 }}></i>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 148, overflow: 'auto' }}>
        {pages.map(p => {
          const active = p.id === activePageId;
          return (
            <div key={p.id}
              onClick={() => onSelect(p.id)}
              onDoubleClick={() => startRename(p)}
              onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, id: p.id }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                background: active ? 'var(--surface-hover)' : 'transparent',
                borderLeft: '2px solid ' + (active ? 'var(--text-primary)' : 'transparent'),
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12.5,
              }}>
              <i data-lucide="file" style={{ width: 13, height: 13, opacity: 0.7 }}></i>
              {editingId === p.id ? (
                <input autoFocus value={draft} title="Rename page"
                  onChange={e => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, minWidth: 0, height: 20, border: '1px solid var(--border-strong)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontSize: 12.5, fontFamily: 'var(--font-sans)', padding: '0 4px', outline: 'none' }} />
              ) : (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              )}
            </div>
          );
        })}
      </div>

      <ContextMenu open={!!menu} x={menu?.x || 0} y={menu?.y || 0} onClose={() => setMenu(null)}
        items={menu ? [
          { label: 'Rename', icon: 'pencil', onClick: () => startRename(pages.find(p => p.id === menu.id)) },
          { separator: true },
          { label: 'Delete page', icon: 'trash-2', danger: true, disabled: pages.length <= 1, onClick: () => onDelete(menu.id) },
        ] : []} />
    </div>
  );
}
window.PagesPanel = PagesPanel;
