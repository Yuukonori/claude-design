/* global React */
// Center canvas — node frames on the lattice grid, with connection lines.
function Canvas({ nodes, connections, selectedId, onSelect }) {
  const W = 1600, H = 1000;
  return (
    <div className="lattice-grid" style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'auto', background: 'var(--bg-app)' }}>
      <div style={{ position: 'relative', width: W, height: H }} onClick={() => onSelect(null)}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {connections.map((c, i) => {
            const a = nodes.find(n => n.id === c.from), b = nodes.find(n => n.id === c.to);
            if (!a || !b) return null;
            const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
            const mx = (x1 + x2) / 2;
            const active = c.from === selectedId || c.to === selectedId;
            return (
              <g key={i}>
                <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none"
                  stroke={active ? 'var(--text-primary)' : 'var(--border-strong)'} strokeWidth={active ? 1.5 : 1} />
                <circle cx={x2} cy={y2} r="3" fill={active ? 'var(--text-primary)' : 'var(--border-strong)'} />
              </g>
            );
          })}
        </svg>

        {nodes.map(n => {
          const sel = n.id === selectedId;
          return (
            <div key={n.id} onClick={(e) => { e.stopPropagation(); onSelect(n.id); }}
              style={{
                position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h,
                background: 'var(--surface-card)',
                border: '1px solid ' + (sel ? 'var(--text-primary)' : 'var(--border-default)'),
                boxShadow: sel ? '0 0 0 1px var(--text-primary)' : 'none',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
              }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: 11, fontFamily: 'var(--font-mono)', color: sel ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                <i data-lucide={n.icon} style={{ width: 12, height: 12 }}></i>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{n.w}×{n.h}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', fontSize: 12 }}>
                {n.label}
              </div>
              {sel && [['nw', -3, -3], ['ne', n.w - 3, -3], ['sw', -3, n.h - 3], ['se', n.w - 3, n.h - 3]].map(([k, x, y]) => (
                <span key={k} style={{ position: 'absolute', left: x, top: y, width: 6, height: 6, background: 'var(--bg-app)', border: '1px solid var(--text-primary)' }} />
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 0, border: '1px solid var(--border-default)', background: 'var(--surface)' }}>
        {[['minus', ''], ['100%', 'pct'], ['plus', '']].map(([ic, t], i) => (
          <button key={i} style={{ width: t ? 48 : 30, height: 30, border: 0, borderRight: i < 2 ? '1px solid var(--border-subtle)' : 0, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {t ? '100%' : <i data-lucide={ic} style={{ width: 13, height: 13 }}></i>}
          </button>
        ))}
      </div>
    </div>
  );
}
window.Canvas = Canvas;
