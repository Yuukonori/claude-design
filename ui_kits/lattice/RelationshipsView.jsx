/* global React */
// Relationships view — node graph as a dependency list with connection rules.
function RelationshipsView({ nodes, connections, onSelect }) {
  const { Badge, Tag } = window.LatticeDesignSystem_e801cb;
  return (
    <div className="lattice-grid" style={{ flex: 1, minWidth: 0, overflow: 'auto', background: 'var(--bg-app)', padding: 32 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 34, letterSpacing: '-0.02em', marginBottom: 6 }}>Relationships</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 24 }}>How {nodes.length} nodes bind, nest, and depend on one another.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nodes.map(n => {
            const out = connections.filter(c => c.from === n.id);
            return (
              <div key={n.id} onClick={() => onSelect(n.id)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer',
              }}>
                <i data-lucide={n.icon} style={{ width: 16, height: 16, color: 'var(--text-secondary)' }}></i>
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{n.id}</div>
                </div>
                <span style={{ color: 'var(--border-strong)', fontFamily: 'var(--font-mono)' }}>→</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                  {out.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>No outbound links</span>}
                  {out.map((c, i) => {
                    const t = nodes.find(x => x.id === c.to);
                    return <Tag key={i}>{c.kind}: {t ? t.name : c.to}</Tag>;
                  })}
                </div>
                <Badge tone={n.synced ? 'success' : 'warning'}>{n.synced ? 'Synced' : 'Modified'}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
window.RelationshipsView = RelationshipsView;
