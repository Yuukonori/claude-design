/* global React, AppShell, StatCard, DataTable, EmptyState, Ic, api, useAuth, toast */
function AdminPanel() {
  const { Button, Select, Badge, Dialog, Avatar, Input } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const [stats, setStats] = React.useState(null);
  const [users, setUsers] = React.useState(null);
  const [plans, setPlans] = React.useState([]);
  const [del, setDel] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [manage, setManage] = React.useState(null);  // user whose AI tokens are being managed
  const [draftLimit, setDraftLimit] = React.useState('');
  const [savingTok, setSavingTok] = React.useState(false);

  const fmtTok = (n) => { n = Math.max(0, Math.round(n || 0)); return n >= 1000 ? (n % 1000 === 0 || n / 1000 >= 100 ? Math.round(n / 1000) : Math.round(n / 100) / 10) + 'K' : String(n); };

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
  const openManage = (u) => { setManage(u); setDraftLimit(String(u.ai_token_limit != null ? u.ai_token_limit : 500000)); };
  const saveLimit = async () => {
    setSavingTok(true);
    try {
      const n = Math.max(0, Math.round(Number(draftLimit)));
      await api.adminSetAiLimit(manage.id, n);
      toast({ tone: 'success', title: 'Token limit updated', message: '@' + manage.github_login + ' → ' + n.toLocaleString() });
      setManage(null); load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setSavingTok(false); }
  };
  const resetUsage = async () => {
    setSavingTok(true);
    try {
      await api.adminResetAiUsage(manage.id);
      toast({ tone: 'neutral', title: 'Usage reset', message: '@' + manage.github_login + ' → 0 tokens used' });
      setManage(null); load();
    } catch (ex) { toast({ tone: 'warning', title: 'Failed', message: ex.message }); } finally { setSavingTok(false); }
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
      header: 'AI tokens', cell: u => {
        const used = u.ai_token_used || 0, lim = u.ai_token_limit != null ? u.ai_token_limit : 500000;
        const pct = lim > 0 ? Math.min(100, (used / lim) * 100) : 100;
        const color = lim > 0 && (lim - used) / lim <= 0.1 ? 'var(--status-danger-fg)' : lim > 0 && (lim - used) / lim <= 0.25 ? 'var(--amber-base)' : 'var(--action-solid)';
        return (
          <div style={{ width: 168 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>{fmtTok(used)} / {fmtTok(lim)}</span>
              <button type="button" title="Set limit or reset usage" onClick={() => openManage(u)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none', border: '1px solid var(--border-default)', background: 'var(--surface)', color: 'var(--text-secondary)', borderRadius: 5, padding: '2px 6px', fontSize: 11, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
                <Ic n="settings-2" s={12} />Manage
              </button>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-inset)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', background: color }} />
            </div>
          </div>
        );
      }
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

      <Dialog open={!!manage} onClose={() => setManage(null)} title="AI tokens"
        description={manage ? `Set the AI Helper token budget for @${manage.github_login}.` : ''}
        footer={<><Button variant="ghost" size="sm" disabled={savingTok} onClick={resetUsage}>Reset usage</Button>
          <Button variant="ghost" size="sm" onClick={() => setManage(null)}>Cancel</Button>
          <Button variant="solid" size="sm" disabled={savingTok} onClick={saveLimit}>Save limit</Button></>}>
        {manage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Currently used: {(manage.ai_token_used || 0).toLocaleString()} tokens
            </div>
            <Input label="Token limit" type="number" min={0} step={1000} value={draftLimit} onChange={e => setDraftLimit(e.target.value)} hint="Default is 500,000. Raise this to give the user more headroom." />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>“Reset usage” sets their spent tokens back to zero (clears history).</div>
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
window.AdminPanel = AdminPanel;
