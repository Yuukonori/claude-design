/* global React, Topbar, LibraryPanel, Canvas, Inspector, CodePanel, RelationshipsView */
function LatticeApp() {
  const { Dialog, Toast, Button, Input, Switch } = window.LatticeDesignSystem_e801cb;

  const [nodes, setNodes] = React.useState([
    { id: 'cmp_root', name: 'Section', icon: 'frame', x: 80, y: 70, w: 440, h: 150, label: 'Pricing — grid', layout: 'Grid', gap: 24, synced: true },
    { id: 'cmp_head', name: 'Heading', icon: 'type', x: 110, y: 300, w: 240, h: 80, label: 'Simple pricing', layout: 'Stack', synced: true },
    { id: 'cmp_card', name: 'PricingCard', icon: 'square', x: 600, y: 120, w: 220, h: 240, label: 'Card · ×3', layout: 'Flex column', gap: 12, synced: false },
    { id: 'cmp_cta', name: 'Button', icon: 'square', x: 640, y: 420, w: 140, h: 60, label: 'Choose plan', layout: 'Flex row', synced: true },
  ]);
  const [connections] = React.useState([
    { from: 'cmp_root', to: 'cmp_head', kind: 'child' },
    { from: 'cmp_root', to: 'cmp_card', kind: 'child' },
    { from: 'cmp_card', to: 'cmp_cta', kind: 'binds' },
  ]);

  const [view, setView] = React.useState('design');
  const [selectedId, setSelectedId] = React.useState('cmp_card');
  const [shareOpen, setShareOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [placedCount, setPlacedCount] = React.useState(0);

  const selected = nodes.find(n => n.id === selectedId) || null;
  const layers = nodes.map((n, i) => ({ id: n.id, name: n.name, icon: n.icon, depth: n.id === 'cmp_cta' ? 1 : 0 }));

  const updateNode = (id, patch) => setNodes(ns => ns.map(n => n.id === id ? { ...n, ...patch } : n));

  const placeNode = (c) => {
    const id = 'cmp_' + Math.random().toString(36).slice(2, 6);
    const n = { id, name: c.name, icon: c.icon, x: 180 + placedCount * 28, y: 540 + placedCount * 18, w: 200, h: 120, label: c.name, layout: 'Flex column', gap: 12, synced: false };
    setNodes(ns => [...ns, n]); setSelectedId(id); setPlacedCount(p => p + 1);
    fireToast({ tone: 'neutral', title: c.name + ' placed', message: 'Drag it into position on the canvas.' });
  };

  const fireToast = (t) => { setToast(t); clearTimeout(window.__lt); window.__lt = setTimeout(() => setToast(null), 3200); };

  const generate = () => { setView('code'); fireToast({ tone: 'success', title: 'Code generated', message: nodes.length + ' nodes → React + TypeScript.' }); };

  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <Topbar view={view} setView={setView} onShare={() => setShareOpen(true)} onGenerate={generate} dirty={!nodes.every(n => n.synced)} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {view === 'design' && <LibraryPanel onPlace={placeNode} layers={layers} selectedId={selectedId} onSelect={setSelectedId} />}

        {view === 'design' && <Canvas nodes={nodes} connections={connections} selectedId={selectedId} onSelect={setSelectedId} />}
        {view === 'code' && <CodePanel nodes={nodes} />}
        {view === 'rel' && <RelationshipsView nodes={nodes} connections={connections} onSelect={(id) => { setSelectedId(id); setView('design'); }} />}

        {view === 'design' && <Inspector node={selected} onChange={updateNode} connections={connections} />}
      </div>

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} title="Share project"
        description="Anyone with the link can view this canvas."
        footer={<><Button variant="ghost" onClick={() => setShareOpen(false)}>Close</Button><Button variant="solid" onClick={() => { setShareOpen(false); fireToast({ tone: 'success', title: 'Link copied' }); }} iconLeft={<i data-lucide="link"></i>}>Copy link</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Invite by email" placeholder="name@studio.com" iconLeft={<i data-lucide="mail"></i>} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
            <div><div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Allow editing</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collaborators can change nodes</div></div>
            <Switch defaultChecked />
          </div>
        </div>
      </Dialog>

      {toast && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 200 }}>
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
window.LatticeApp = LatticeApp;
