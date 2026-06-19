/* global React */
// Right panel — inspector for the selected node.
function Inspector({ node, onChange, connections }) {
  const { Input, Select, Switch, Tag, Badge, Button } = window.LatticeDesignSystem_e801cb;
  if (!node) {
    return (
      <aside style={inspAside}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
          <i data-lucide="mouse-pointer-click" style={{ width: 22, height: 22, color: 'var(--text-disabled)' }}></i>
          <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, color: 'var(--text-secondary)' }}>Nothing selected</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 180 }}>Select a node on the canvas to inspect its properties.</div>
        </div>
      </aside>
    );
  }
  const rel = connections.filter(c => c.from === node.id || c.to === node.id).length;
  const set = (k) => (v) => onChange(node.id, { [k]: v });

  return (
    <aside style={inspAside}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i data-lucide={node.icon} style={{ width: 15, height: 15, color: 'var(--text-secondary)' }}></i>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{node.name}</span>
        <Badge tone={node.synced ? 'success' : 'warning'}>{node.synced ? 'Synced' : 'Modified'}</Badge>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Section title="Dimensions">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input label="Width" value={node.w} onChange={e => set('w')(+e.target.value || 0)} size="sm" />
            <Input label="Height" value={node.h} onChange={e => set('h')(+e.target.value || 0)} size="sm" />
            <Input label="X" value={node.x} onChange={e => set('x')(+e.target.value || 0)} size="sm" />
            <Input label="Y" value={node.y} onChange={e => set('y')(+e.target.value || 0)} size="sm" />
          </div>
        </Section>

        <Section title="Layout">
          <Select label="Direction" options={['Flex row', 'Flex column', 'Grid', 'Stack']} size="sm" defaultValue={node.layout} />
          <div style={{ height: 10 }} />
          <Input label="Gap" value={node.gap ?? 16} onChange={e => set('gap')(+e.target.value || 0)} size="sm" />
        </Section>

        <Section title="Behavior">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Switch label="Responsive" defaultChecked />
            <Switch label="Clip content" />
            <Switch label="Lock position" />
          </div>
        </Section>

        <Section title={`Relationships · ${rel}`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Tag>parent: Section</Tag>
            <Tag onRemove={() => {}}>binds: Pricing data</Tag>
          </div>
        </Section>
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <Button variant="outline" size="sm" fullWidth iconLeft={<i data-lucide="unlink"></i>}>Detach</Button>
        <Button variant="danger" size="sm" fullWidth>Delete</Button>
      </div>
    </aside>
  );
}

const inspAside = {
  width: 280, flex: 'none', display: 'flex', flexDirection: 'column',
  borderLeft: '1px solid var(--border-subtle)', background: 'var(--surface)', minHeight: 0,
};

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 9 }}>{title}</div>
      {children}
    </div>
  );
}
window.Inspector = Inspector;
