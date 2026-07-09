/* global React */
// Searchable Lucide icon picker. Renders a trigger + popover grid built from window.lucide.icons.
// Value/onChange use kebab-case icon names (what data-lucide + renderLucideIcons expect).

function pascalToKebab(s) {
  return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function IconPicker({ value, onChange, placeholder = 'Pick an icon' }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);

  const allKeys = React.useMemo(() => {
    const L = window.lucide;
    return L && L.icons ? Object.keys(L.icons) : [];
  }, []);

  const results = React.useMemo(() => {
    const L = window.lucide;
    if (!L || !L.createElement) return [];
    const needle = q.trim().toLowerCase();
    const keys = (needle ? allKeys.filter(k => pascalToKebab(k).includes(needle)) : allKeys).slice(0, 240);
    return keys.map(k => {
      const kebab = pascalToKebab(k);
      let html = '';
      try { const el = L.createElement(L.icons[k]); el.setAttribute('width', 18); el.setAttribute('height', 18); html = el.outerHTML; } catch (e) {}
      return { kebab, html };
    });
  }, [q, allKeys]);

  React.useEffect(() => {
    if (!open) return;
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === 'Escape') setOpen(false); };
    const t = setTimeout(() => { document.addEventListener('mousedown', on); document.addEventListener('keydown', key); }, 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', on); document.removeEventListener('keydown', key); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} title="Choose icon" style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 30, padding: '0 8px',
        border: '1px solid var(--border-default)', background: 'var(--surface-inset)', color: 'var(--text-primary)',
        cursor: 'pointer', fontSize: 12.5, fontFamily: 'var(--font-mono)',
      }}>
        {value ? <i key={value} data-lucide={value} style={{ width: 15, height: 15 }}></i> : <i data-lucide="image" style={{ width: 15, height: 15, opacity: 0.5 }}></i>}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>{value || placeholder}</span>
        <i data-lucide="chevron-down" style={{ width: 13, height: 13, opacity: 0.6 }}></i>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '104%', left: 0, right: 0, zIndex: 400, background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', padding: 8 }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search icons" title="Search icons"
            style={{ width: '100%', height: 28, boxSizing: 'border-box', padding: '0 8px', marginBottom: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 12.5, outline: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, maxHeight: 220, overflow: 'auto' }}>
            {results.map(r => (
              <button key={r.kebab} type="button" title={r.kebab} onClick={() => { onChange(r.kebab); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30, border: '1px solid ' + (value === r.kebab ? 'var(--border-strong)' : 'transparent'), background: value === r.kebab ? 'var(--surface-hover)' : 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = value === r.kebab ? 'var(--surface-hover)' : 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                dangerouslySetInnerHTML={{ __html: r.html }} />
            ))}
            {results.length === 0 && <div style={{ gridColumn: '1 / -1', padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No icons match.</div>}
          </div>
          {value && <button type="button" onClick={() => { onChange(''); setOpen(false); }} style={{ marginTop: 8, width: '100%', height: 26, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Clear icon</button>}
        </div>
      )}
    </div>
  );
}
window.IconPicker = IconPicker;
window.pascalToKebab = pascalToKebab;
