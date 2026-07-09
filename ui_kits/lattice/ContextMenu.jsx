/* global React */
// Reusable floating context menu. Controlled: parent owns open/position/items.
// items: [{ label, icon?, danger?, disabled?, onClick } | { separator: true }]
function ContextMenu({ open, x, y, items = [], onClose }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    // Defer so the opening click doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      if (window.renderLucideIcons) window.renderLucideIcons();
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Keep on-screen
  const MW = 208;
  const left = Math.min(x, window.innerWidth - MW - 8);
  const top = Math.min(y, window.innerHeight - (items.length * 32 + 12));

  return (
    <div ref={ref} role="menu" style={{
      position: 'fixed', left, top, zIndex: 400, minWidth: MW,
      background: 'var(--surface-raised)', border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-overlay)', padding: 4, userSelect: 'none',
    }}>
      {items.map((it, i) => it.separator ? (
        <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
      ) : (
        <button key={i} type="button" role="menuitem" disabled={it.disabled}
          onClick={() => { if (it.disabled) return; onClose(); it.onClick && it.onClick(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '7px 10px', background: 'transparent', border: 0, textAlign: 'left',
            color: it.disabled ? 'var(--text-disabled)' : it.danger ? 'var(--status-danger-fg)' : 'var(--text-secondary)',
            cursor: it.disabled ? 'not-allowed' : 'pointer', fontSize: 12.5, fontFamily: 'var(--font-sans)',
            transition: 'background var(--dur-fast), color var(--dur-fast)',
          }}
          onMouseEnter={e => { if (!it.disabled) { e.currentTarget.style.background = 'var(--surface-hover)'; if (!it.danger) e.currentTarget.style.color = 'var(--text-primary)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = it.danger ? 'var(--status-danger-fg)' : 'var(--text-secondary)'; }}>
          {it.icon && <i data-lucide={it.icon} style={{ width: 14, height: 14, opacity: 0.85 }}></i>}
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.shortcut && <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>{it.shortcut}</span>}
        </button>
      ))}
    </div>
  );
}
window.ContextMenu = ContextMenu;
