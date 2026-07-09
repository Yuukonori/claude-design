/* global React, AppShell, EmptyState, Ic, api, navigate, useAuth, toast */
// Marketplace: Market (browse & install), Plugins (design-shortcut packs), Library (owned assets).

function openEditorProject(id) { window.location.href = '/ui_kits/lattice/?project=' + id; }

// Map a market catalog entry to a library_items install payload.
function toInstallPayload(kind, item) {
  if (kind === 'componentStyles') return { type: 'component', name: item.name, source: item.id, data: { base: item.base, props: item.props || {} } };
  if (kind === 'shaders')        return { type: 'shader',    name: item.name, source: item.id, data: { code: item.code } };
  if (kind === 'animations')     return { type: 'animation', name: item.name, source: item.id, data: { states: item.states || {} } };
  if (kind === 'templates')      return { type: 'template',  name: item.name, source: item.id, data: { canvas: item.canvas || {} } };
  if (kind === 'plugins')        return { type: 'plugin',    name: item.name, source: item.id, data: { icon: item.icon, actions: item.actions || [] } };
  return null;
}

const TYPE_META = {
  component: { icon: 'component', label: 'Component' },
  shader:    { icon: 'sparkles',  label: 'Shader' },
  animation: { icon: 'film',      label: 'Animation' },
  template:  { icon: 'layout-template', label: 'Template' },
  plugin:    { icon: 'blocks',    label: 'Plugin' },
};

// Small live preview for a shader catalog entry (falls back to a swatch if WebGL is unavailable).
function ShaderThumb({ code }) {
  return (
    <div style={{ position: 'relative', height: 90, borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden', background: 'var(--bg-void)' }}>
      {window.ShaderFill ? <window.ShaderFill code={code} speed={1} /> : null}
    </div>
  );
}

// Generic thumbnail for non-shader assets.
function AssetThumb({ icon }) {
  return (
    <div className="lattice-grid" style={{ height: 90, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)' }}>
      <Ic n={icon} s={26} />
    </div>
  );
}

function Card({ children }) {
  return <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column' }}>{children}</div>;
}

function CardBody({ name, description, tag, children }) {
  const { Tag } = window.LatticeDesignSystem_e801cb;
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      {(name || tag) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {tag && <Tag shape="pill">{tag}</Tag>}
        </div>
      )}
      {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{description}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>{children}</div>
    </div>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>{children}</div>;
}

function SectionHead({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '4px 2px 12px' }}>{children}</div>;
}

// --- Market -------------------------------------------------------------------------------------
function Market() {
  const { Button } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [catalog, setCatalog] = React.useState(null);
  const [library, setLibrary] = React.useState([]);
  const [busy, setBusy] = React.useState('');

  const reloadLib = React.useCallback(() => api.library().then(r => setLibrary(r.items)).catch(() => {}), []);
  React.useEffect(() => {
    api.market().then(setCatalog).catch(() => setCatalog({}));
    reloadLib();
  }, [reloadLib]);

  const installedSources = new Set(library.map(i => i.source).filter(Boolean));

  const install = async (kind, item) => {
    setBusy(item.id);
    try { await api.installItem(toInstallPayload(kind, item)); await reloadLib(); toast({ tone: 'success', title: 'Added to library', message: item.name }); }
    catch (ex) { toast({ tone: 'warning', title: 'Install failed', message: ex.message }); } finally { setBusy(''); }
  };

  const useTemplate = async (item) => {
    setBusy(item.id);
    try { const r = await api.createProject({ name: item.name, canvas: item.canvas || {} }); openEditorProject(r.project.id); }
    catch (ex) { toast({ tone: 'warning', title: 'Could not create project', message: ex.message }); setBusy(''); }
  };

  const sections = [
    ['componentStyles', 'Component styles', 'component'],
    ['shaders', 'Shaders', 'shader'],
    ['animations', 'Animations', 'animation'],
    ['templates', 'Templates', 'template'],
  ];

  return (
    <AppShell active="/market" user={user} title="Market">
      <div style={{ marginBottom: 20, maxWidth: 640 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Install styles, shaders, animations and starter templates into your Library, then enable
          them per project from the editor's <strong style={{ color: 'var(--text-secondary)' }}>Settings → Assets &amp; Plugins</strong>.
        </div>
      </div>

      {catalog === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : sections.map(([key, label, type]) => {
        const items = catalog[key] || [];
        if (!items.length) return null;
        return (
          <div key={key} style={{ marginBottom: 28 }}>
            <SectionHead>{label}</SectionHead>
            <Grid>
              {items.map(item => {
                const installed = installedSources.has(item.id);
                return (
                  <Card key={item.id}>
                    {type === 'shader' ? <ShaderThumb code={item.code} /> : <AssetThumb icon={TYPE_META[type].icon} />}
                    <CardBody name={item.name} description={item.description} tag={TYPE_META[type].label}>
                      {type === 'template' && (
                        <Button variant="solid" size="sm" disabled={busy === item.id} onClick={() => useTemplate(item)} iconLeft={<Ic n="rocket" s={14} />}>Use template</Button>
                      )}
                      <Button variant={installed ? 'ghost' : (type === 'template' ? 'outline' : 'solid')} size="sm"
                        disabled={busy === item.id || (installed && type !== 'template')}
                        onClick={() => install(key, item)}
                        iconLeft={<Ic n={installed ? 'check' : 'download'} s={14} />}>
                        {installed ? 'Installed' : 'Install'}
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </Grid>
          </div>
        );
      })}
    </AppShell>
  );
}
window.Market = Market;

// --- Plugins ------------------------------------------------------------------------------------
function Plugins() {
  const { Button, Tag } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [catalog, setCatalog] = React.useState(null);
  const [library, setLibrary] = React.useState([]);
  const [busy, setBusy] = React.useState('');

  const reloadLib = React.useCallback(() => api.library().then(r => setLibrary(r.items)).catch(() => {}), []);
  React.useEffect(() => { api.market().then(setCatalog).catch(() => setCatalog({})); reloadLib(); }, [reloadLib]);

  const installedSources = new Set(library.map(i => i.source).filter(Boolean));
  const install = async (item) => {
    setBusy(item.id);
    try { await api.installItem(toInstallPayload('plugins', item)); await reloadLib(); toast({ tone: 'success', title: 'Plugin installed', message: item.name }); }
    catch (ex) { toast({ tone: 'warning', title: 'Install failed', message: ex.message }); } finally { setBusy(''); }
  };

  const plugins = (catalog && catalog.plugins) || [];

  return (
    <AppShell active="/plugins" user={user} title="Plugins">
      <div style={{ marginBottom: 20, maxWidth: 640, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Plugins add design shortcuts to the editor — quick actions with optional keyboard shortcuts.
        Install here, then enable a plugin per project in the editor's Settings; run its actions from the
        command menu (<strong style={{ color: 'var(--text-secondary)' }}>Ctrl/⌘ K</strong>).
      </div>
      {catalog === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : !plugins.length ? (
        <EmptyState icon="blocks" title="No plugins yet" message="Plugins will appear here." />
      ) : (
        <Grid>
          {plugins.map(p => {
            const installed = installedSources.has(p.id);
            return (
              <Card key={p.id}>
                <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-secondary)' }}><Ic n={p.icon || 'blocks'} s={17} /></div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                </div>
                <CardBody description={p.description} name="">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(p.actions || []).map(a => <Tag key={a.id}>{a.label}{a.shortcut ? ' · ' + a.shortcut.toUpperCase() : ''}</Tag>)}
                    </div>
                    <Button variant={installed ? 'ghost' : 'solid'} size="sm" fullWidth disabled={busy === p.id || installed}
                      onClick={() => install(p)} iconLeft={<Ic n={installed ? 'check' : 'download'} s={14} />}>
                      {installed ? 'Installed' : 'Install'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </Grid>
      )}
    </AppShell>
  );
}
window.Plugins = Plugins;

// --- Library ------------------------------------------------------------------------------------
function Library() {
  const { Button, Dialog, Input } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [items, setItems] = React.useState(null);
  const [dlg, setDlg] = React.useState(null); // { mode:'rename'|'delete', item }
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => api.library().then(r => setItems(r.items)).catch(() => setItems([])), []);
  React.useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      if (dlg.mode === 'rename') { await api.updateItem(dlg.item.id, { name: name.trim() || dlg.item.name }); toast({ tone: 'success', title: 'Renamed' }); }
      if (dlg.mode === 'delete') { await api.deleteItem(dlg.item.id); toast({ tone: 'neutral', title: 'Removed from library' }); }
      setDlg(null); load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setBusy(false); }
  };

  const groups = ['component', 'shader', 'animation', 'template', 'plugin'];
  const byType = (t) => (items || []).filter(i => i.type === t);

  return (
    <AppShell active="/library" user={user} title="Library"
      actions={<Button variant="outline" size="sm" onClick={() => navigate('/market')} iconLeft={<Ic n="store" s={15} />}>Browse market</Button>}>
      {items === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : !items.length ? (
        <EmptyState icon="library" title="Your library is empty"
          message="Install styles, shaders, animations or plugins from the Market to reuse across projects."
          action={<Button variant="solid" size="sm" onClick={() => navigate('/market')} iconLeft={<Ic n="store" s={15} />}>Open Market</Button>} />
      ) : groups.map(t => {
        const list = byType(t);
        if (!list.length) return null;
        return (
          <div key={t} style={{ marginBottom: 26 }}>
            <SectionHead>{(TYPE_META[t].label) + 's'}</SectionHead>
            <Grid>
              {list.map(it => (
                <Card key={it.id}>
                  {it.type === 'shader' && it.data && it.data.code ? <ShaderThumb code={it.data.code} /> : <AssetThumb icon={TYPE_META[t].icon} />}
                  <CardBody name={it.name} description={it.source ? ('from market · ' + it.source) : 'custom'} tag={TYPE_META[t].label}>
                    <Button variant="outline" size="sm" onClick={() => { setName(it.name); setDlg({ mode: 'rename', item: it }); }} iconLeft={<Ic n="pencil" s={14} />}>Rename</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDlg({ mode: 'delete', item: it })} iconLeft={<Ic n="trash-2" s={14} />}>Delete</Button>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </div>
        );
      })}

      <Dialog open={!!dlg && dlg.mode === 'rename'} onClose={() => setDlg(null)} title="Rename item"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="solid" size="sm" disabled={busy} onClick={submit}>Save</Button></>}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </Dialog>
      <Dialog open={!!dlg && dlg.mode === 'delete'} onClose={() => setDlg(null)} title="Remove from library?"
        description={dlg && dlg.mode === 'delete' ? `"${dlg.item.name}" will be removed from your library.` : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={submit}>Remove</Button></>}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Projects that enabled it will no longer see it.</div>
      </Dialog>
    </AppShell>
  );
}
window.Library = Library;
