/* global React, AppShell, StatCard, DataTable, EmptyState, Ic, api, useAuth, toast */
function AdminPanel() {
  const { Button, Select, Badge, Dialog, Avatar } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [stats, setStats] = React.useState(null);
  const [users, setUsers] = React.useState(null);
  const [plans, setPlans] = React.useState([]);
  const [del, setDel] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    api.adminUsers().then(r => setUsers(r.users)).catch(() => setUsers([]));
    api.adminStats().then(r => setStats(r)).catch(() => {});
  }, []);
  React.useEffect(() => {
    load();
    api.plans().then(r => setPlans(r.plans)).catch(() => {});
  }, [load]);

  const paidCount = stats ? stats.byPlan.filter(b => b.plan_id !== 'free').reduce((a, b) => a + b.n, 0) : '—';
  const planOptions = plans.length ? plans.map(p => p.id) : ['free', 'pro', 'team'];

  const setPlan = async (u, plan_id) => {
    try {
      await api.adminSetPlan(u.id, plan_id);
      toast({ tone: 'success', title: 'Plan updated', message: '@' + u.github_login + ' → ' + plan_id });
      load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); }
  };
  const doDelete = async () => {
    setBusy(true);
    try {
      await api.adminDeleteUser(del.id);
      toast({ tone: 'neutral', title: 'User deleted', message: '@' + del.github_login });
      setDel(null); load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setBusy(false); }
  };

  const columns = [
    {
      header: 'User', cell: u => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={u.name || u.github_login || '?'} src={u.avatar_url} size="sm" />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600 }}>
              {u.name || u.github_login}{u.is_admin && <Badge tone="info">admin</Badge>}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{u.github_login}{u.email ? ' · ' + u.email : ''}
            </div>
          </div>
        </div>
      )
    },
    { header: 'Projects', cell: u => <span style={{ fontFamily: 'var(--font-mono)' }}>{u.project_count}</span> },
    { header: 'Joined', cell: u => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{new Date(u.created_at).toLocaleDateString()}</span> },
    {
      header: 'Plan', cell: u => (
        <div style={{ width: 120 }}>
          <Select size="sm" options={planOptions} value={u.plan_id || 'free'} onChange={e => setPlan(u, e.target.value)} />
        </div>
      )
    },
    {
      header: '', align: 'right', cell: u => (
        (u.id === user.id || u.is_admin)
          ? <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>—</span>
          : <button type="button" title="Delete user" onClick={() => setDel(u)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--status-danger-fg)', padding: 4 }}><Ic n="trash-2" s={15} /></button>
      )
    },
  ];

  return (
    <AppShell active="/admin" user={user} title="Admin">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon="users" label="Users" value={stats ? stats.users : '—'} hint="total accounts" />
        <StatCard icon="layout-grid" label="Projects" value={stats ? stats.projects : '—'} hint="across all users" />
        <StatCard icon="badge-check" label="Paid plans" value={paidCount} hint="pro + team" />
      </div>

      {users === null ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 24 }}>Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          empty={<EmptyState icon="users" title="No users yet" message="Accounts appear here after people sign in with GitHub." />}
        />
      )}

      <Dialog open={!!del} onClose={() => setDel(null)} title="Delete user?"
        description={del ? `@${del.github_login} and all their projects will be permanently removed.` : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDel(null)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={doDelete}>Delete</Button></>}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This cannot be undone.</div>
      </Dialog>
    </AppShell>
  );
}
window.AdminPanel = AdminPanel;
