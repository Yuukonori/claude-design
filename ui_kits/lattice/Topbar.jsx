/* global React */
// Top bar — logo, breadcrumb, view tabs, collaborators, generate action.
function Topbar({ view, setView, onShare, onGenerate, dirty }) {
  const { IconButton, Tabs, Avatar, Button, Tooltip } = window.LatticeDesignSystem_e801cb;
  return (
    <header style={{
      height: 'var(--topbar-h)', flex: 'none', display: 'flex', alignItems: 'center',
      gap: 14, padding: '0 12px', borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ display: 'inline-flex', color: 'var(--text-primary)' }}>
          <img src="../../assets/logo-mark.svg" alt="Lattice" style={{ height: 22, display: 'block' }} />
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-muted)', minWidth: 0 }}>
          <span>Marketing site</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>Pricing page</span>
          {dirty && <span title="Unsaved" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber-base)' }} />}
        </div>
      </div>

      <div style={{ marginLeft: 12 }}>
        <Tabs value={view} onChange={setView} tabs={[
          { value: 'design', label: 'Design' },
          { value: 'code', label: 'Code' },
          { value: 'rel', label: 'Relationships' },
        ]} style={{ borderBottom: 0 }} />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex' }}>
          {['Rin Sato', 'Yuki Mori', 'A K'].map((n, i) => (
            <span key={i} style={{ marginLeft: i ? -6 : 0, outline: '2px solid var(--surface)', borderRadius: '50%', position: 'relative', zIndex: 3 - i }}>
              <Avatar name={n} size="sm" />
            </span>
          ))}
        </div>
        <Tooltip label="Undo"><IconButton title="Undo"><i data-lucide="undo-2"></i></IconButton></Tooltip>
        <Tooltip label="Settings"><IconButton title="Settings"><i data-lucide="settings"></i></IconButton></Tooltip>
        <Button variant="outline" size="sm" onClick={onShare} iconLeft={<i data-lucide="share-2"></i>}>Share</Button>
        <Button variant="solid" size="sm" onClick={onGenerate} iconLeft={<i data-lucide="zap"></i>}>Generate code</Button>
      </div>
    </header>
  );
}
window.Topbar = Topbar;
