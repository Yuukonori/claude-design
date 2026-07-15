/* global React, AppShell, StatCard, ProjectCard, DataTable, EmptyState, Field, Ic, GitHubMark, api, navigate, useAuth, toast */

function openEditor(id) { window.location.href = '/ui_kits/lattice/?project=' + id; }

function Projects() {
  const { Button, Dialog, Input, Badge } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [projects, setProjects] = React.useState(null);
  const [sub, setSub] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [dlg, setDlg] = React.useState(null); // { mode:'new'|'rename'|'delete', project? }
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    api.projects().then(r => setProjects(r.projects)).catch(() => setProjects([]));
  }, []);
  React.useEffect(() => {
    load();
    api.subscription().then(r => setSub(r.subscription)).catch(() => {});
    api.team().then(r => setMembers(r.members)).catch(() => {});
  }, [load]);

  const editedThisWeek = (projects || []).filter(p => (Date.now() - new Date(p.updated_at)) < 7 * 864e5).length;

  const submit = async () => {
    setBusy(true);
    try {
      if (dlg.mode === 'new') {
        const r = await api.createProject({ name: name.trim() || 'Untitled project' });
        openEditor(r.project.id); return;
      }
      if (dlg.mode === 'rename') {
        await api.updateProject(dlg.project.id, { name: name.trim() || dlg.project.name });
        toast({ tone: 'success', title: 'Renamed' });
      }
      if (dlg.mode === 'delete') {
        await api.deleteProject(dlg.project.id);
        toast({ tone: 'neutral', title: 'Project deleted' });
      }
      setDlg(null); load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setBusy(false); }
  };

  const filtered = (projects || []).filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="/projects" user={user} title="Projects"
      actions={<Button variant="solid" size="sm" onClick={() => { setName(''); setDlg({ mode: 'new' }); }} iconLeft={<Ic n="plus" s={15} />}>New project</Button>}>

      {/* Dashboard analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon="layout-grid" label="Projects" value={projects ? projects.length : '—'} hint="in this workspace" />
        <StatCard icon="activity" label="Edited this week" value={projects ? editedThisWeek : '—'} hint="last 7 days" />
        <StatCard icon="badge-check" label="Plan" value={sub ? sub.name : 'Free'} hint={sub ? sub.billing_cycle : 'active'} />
        <StatCard icon="users" label="Team" value={members.length} hint="members & invites" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ maxWidth: 280, flex: 1 }}>
          <Input size="sm" placeholder="Search projects" iconLeft={<Ic n="search" s={15} />} value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{filtered.length} project{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {projects === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="layout-grid" title={q ? 'No matches' : 'No projects yet'}
          message={q ? 'Try a different search.' : 'Create your first canvas to start designing structure.'}
          action={!q && <Button variant="solid" size="sm" onClick={() => { setName(''); setDlg({ mode: 'new' }); }} iconLeft={<Ic n="plus" s={15} />}>New project</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onOpen={() => openEditor(p.id)}
              onRename={() => { setName(p.name); setDlg({ mode: 'rename', project: p }); }}
              onDelete={() => setDlg({ mode: 'delete', project: p })} />
          ))}
        </div>
      )}

      <Dialog open={!!dlg && dlg.mode !== 'delete'} onClose={() => setDlg(null)}
        title={dlg && dlg.mode === 'new' ? 'New project' : 'Rename project'}
        description={dlg && dlg.mode === 'new' ? 'Give your canvas a name. You can change it later.' : null}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="solid" size="sm" disabled={busy} onClick={submit}>{dlg && dlg.mode === 'new' ? 'Create & open' : 'Save'}</Button></>}>
        <Input label="Project name" placeholder="Pricing page" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </Dialog>

      <Dialog open={!!dlg && dlg.mode === 'delete'} onClose={() => setDlg(null)} title="Delete project?"
        description={dlg && dlg.mode === 'delete' ? `"${dlg.project.name}" and its canvas will be permanently removed.` : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={submit}>Delete</Button></>}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This cannot be undone.</div>
      </Dialog>
    </AppShell>
  );
}
window.Projects = Projects;

function Account() {
  const { Button, Avatar } = window.LatticeDesignSystem_e801cb;
  const { user, refresh } = useAuth();
  const [name, setName] = React.useState(user.name || '');
  const [busy, setBusy] = React.useState(false);

  const saveProfile = async () => {
    setBusy(true);
    try { await api.updateAccount({ name }); await refresh(); toast({ tone: 'success', title: 'Profile saved' }); }
    catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setBusy(false); }
  };

  return (
    <AppShell active="/account" user={user} title="Account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820, width: '100%', margin: '0 auto' }}>
        <Section title="Profile" desc="Your display name across Lattice.">
          <Field label="Display name" value={name} onChange={e => setName(e.target.value)} />
          <div><Button variant="solid" size="sm" disabled={busy} onClick={saveProfile}>Save profile</Button></div>
        </Section>
        <Section title="Connected account" desc="You sign in with GitHub. These details come from your GitHub profile.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user.name || user.github_login || '?'} src={user.avatar_url} size="md" />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                <GitHubMark s={15} />@{user.github_login || '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{user.email || 'No public email'}</div>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
window.Account = Account;

function Section({ title, desc, children }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {desc && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, marginBottom: 16 }}>{desc}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function Billing() {
  const { Button, Badge } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [sub, setSub] = React.useState(undefined);
  const [invoices, setInvoices] = React.useState([]);
  React.useEffect(() => {
    api.subscription().then(r => setSub(r.subscription)).catch(() => setSub(null));
    api.invoices().then(r => setInvoices(r.invoices)).catch(() => {});
  }, []);
  const fmt = (n) => '$' + n;
  return (
    <AppShell active="/billing" user={user} title="Billing">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820, width: '100%', margin: '0 auto' }}>
        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current plan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-serif-display)', fontSize: 26 }}>{sub ? sub.name : 'Free'}</span>
              {sub && <Badge tone="success">{sub.status}</Badge>}
            </div>
            {sub && sub.current_period_end && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Renews {new Date(sub.current_period_end).toLocaleDateString()} · {sub.billing_cycle}</div>}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Managed by Lattice</span>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Invoices</div>
          <DataTable
            columns={[
              { header: 'Date', cell: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{new Date(r.created_at).toLocaleDateString()}</span> },
              { header: 'Plan', cell: r => r.plan_name || r.plan_id },
              { header: 'Period', cell: r => r.period },
              { header: 'Amount', align: 'right', cell: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.amount)}</span> },
              { header: 'Status', align: 'right', cell: r => <Badge tone="success">{r.status}</Badge> },
            ]}
            rows={invoices}
            empty={<EmptyState icon="receipt" title="No invoices yet" message="Choose a paid plan and your invoices will appear here." action={<Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>View plans</Button>} />}
          />
        </div>
      </div>
    </AppShell>
  );
}
window.Billing = Billing;

function Team() {
  const { Button, Select, Badge, Input } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [members, setMembers] = React.useState([]);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('editor');
  const [busy, setBusy] = React.useState(false);
  const load = () => api.team().then(r => setMembers(r.members)).catch(() => {});
  React.useEffect(() => { load(); }, []);

  const invite = async () => {
    setBusy(true);
    try { await api.invite({ email, role }); setEmail(''); toast({ tone: 'success', title: 'Invite sent', message: email }); load(); }
    catch (ex) { toast({ tone: 'warning', title: 'Could not invite', message: ex.message }); } finally { setBusy(false); }
  };
  const remove = async (m) => { try { await api.removeMember(m.id); load(); } catch (ex) {} };

  return (
    <AppShell active="/team" user={user} title="Team">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820, width: '100%', margin: '0 auto' }}>
        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Invite a member</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>They'll get access to this workspace's projects.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}><Input label="Email" placeholder="teammate@studio.com" value={email} onChange={e => setEmail(e.target.value)} iconLeft={<Ic n="mail" s={15} />} /></div>
            <div style={{ width: 140 }}><Select label="Role" size="md" options={['viewer', 'editor', 'admin']} value={role} onChange={e => setRole(e.target.value)} /></div>
            <Button variant="solid" size="md" disabled={busy} onClick={invite} iconLeft={<Ic n="send" s={15} />}>Invite</Button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Members</div>
          <DataTable
            columns={[
              { header: 'Member', cell: m => <span style={{ color: 'var(--text-primary)' }}>{m.email}</span> },
              { header: 'Role', cell: m => <Badge>{m.role}</Badge> },
              { header: 'Status', cell: m => <Badge tone={m.status === 'active' ? 'success' : 'warning'}>{m.status}</Badge> },
              { header: '', align: 'right', cell: m => <button type="button" title="Remove" onClick={() => remove(m)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Ic n="x" s={15} /></button> },
            ]}
            rows={members}
            empty={<EmptyState icon="users" title="No members yet" message="Invite teammates to collaborate on your projects." />}
          />
        </div>
      </div>
    </AppShell>
  );
}
window.Team = Team;
