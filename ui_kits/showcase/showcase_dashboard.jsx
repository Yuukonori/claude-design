/* global React, Ic, Reveal, Wordmark, Eyebrow, Serif, useCountUp, useSession, scSetSession, go, toast, ComponentsUsed */
// Dashboard — the authed surface + full workflow. Exercises every DS primitive:
// Avatar, Badge, Tag, Card, Button, IconButton, Tabs, Switch, Select, Input, Checkbox, Dialog, Toast, Tooltip.

var DASH_SEED_PROJECTS = [
  { id: 'p1', name: 'Aurora Marketing Site', status: 'Live', tone: 'success', tags: ['Web', 'Marketing'], owners: ['Rin Sato', 'Mei Lin'], nodes: 148, updated: '2h ago' },
  { id: 'p2', name: 'Orbit Mobile App', status: 'In review', tone: 'warning', tags: ['iOS', 'Android'], owners: ['Ada K'], nodes: 92, updated: '5h ago' },
  { id: 'p3', name: 'Ledger Dashboard', status: 'Draft', tone: 'neutral', tags: ['Web', 'Data'], owners: ['Jon P', 'Rin Sato'], nodes: 210, updated: '1d ago' },
  { id: 'p4', name: 'Pulse Design Tokens', status: 'Live', tone: 'success', tags: ['System'], owners: ['Mei Lin'], nodes: 64, updated: '3d ago' },
];

var DASH_SEED_TEAM = [
  { id: 't1', name: 'Rin Sato', email: 'rin@studio.com', role: 'Owner', active: true },
  { id: 't2', name: 'Mei Lin', email: 'mei@studio.com', role: 'Editor', active: true },
  { id: 't3', name: 'Ada Kovac', email: 'ada@studio.com', role: 'Editor', active: false },
  { id: 't4', name: 'Jon Park', email: 'jon@studio.com', role: 'Viewer', active: true },
];

var DASH_ACTIVITY = [
  { icon: 'git-commit', who: 'Mei Lin', what: 'generated React for', target: 'Aurora Marketing Site', when: '12 min ago', tone: 'info' },
  { icon: 'user-plus', who: 'Rin Sato', what: 'invited', target: 'ada@studio.com', when: '1h ago', tone: 'success' },
  { icon: 'pencil', who: 'Jon Park', what: 'edited 14 nodes in', target: 'Ledger Dashboard', when: '3h ago', tone: 'neutral' },
  { icon: 'alert-triangle', who: 'System', what: 'flagged a contrast issue in', target: 'Orbit Mobile App', when: '6h ago', tone: 'warning' },
  { icon: 'rocket', who: 'Mei Lin', what: 'published', target: 'Pulse Design Tokens', when: '1d ago', tone: 'success' },
];

function DashStat({ icon, label, value, suffix, delta, tone }) {
  const { Card, Badge } = window.LatticeDesignSystem_e801cb;
  const n = useCountUp(value, 950);
  const shown = value >= 1000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n).toString();
  return (
    <Card padding="md" interactive className="sc-raise" style={{ background: 'var(--surface-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--surface)' }}><Ic n={icon} s={15} /></span>
        <Badge tone={tone}>{delta}</Badge>
      </div>
      <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 34, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginTop: 14, lineHeight: 1 }}>
        {shown}{suffix || ''}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </Card>
  );
}

function DashBarChart() {
  const data = [42, 58, 40, 72, 64, 88, 76, 95, 70, 84, 60, 92];
  const max = Math.max.apply(null, data);
  const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
          <div className="sc-bar" title={d + ' projects'} style={{
            width: '100%', height: (d / max) * 100 + '%', animationDelay: (i * 45) + 'ms',
            background: i === data.length - 1 ? 'var(--text-primary)' : 'var(--neutral-400)',
          }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DashHeader({ user, onSettings, onLogout }) {
  const { Input, IconButton, Tooltip, Avatar, Badge } = window.LatticeDesignSystem_e801cb;
  const [menu, setMenu] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!menu) return;
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', on), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', on); };
  }, [menu]);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'color-mix(in srgb, var(--bg-app) 88%, transparent)', backdropFilter: 'var(--blur-overlay)' }}>
      <Wordmark size={19} onClick={() => go('/dashboard')} />
      <div style={{ flex: 1, maxWidth: 420 }}>
        <Input placeholder="Search projects, people, components…" iconLeft={<Ic n="search" s={15} />} size="sm"
          onKeyDown={(e) => { if (e.key === 'Enter') toast({ tone: 'neutral', title: 'Search', message: 'Searched for “' + e.target.value + '”' }); }} />
      </div>
      <div style={{ flex: 1 }} />
      <Tooltip label="Notifications" side="bottom">
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton onClick={() => toast({ tone: 'info', title: '3 notifications', message: 'You are all caught up otherwise.' })}><Ic n="bell" s={17} /></IconButton>
          <span style={{ position: 'absolute', top: -3, right: -3 }}><Badge tone="danger" style={{ height: 15, padding: '0 4px', fontSize: 9.5 }}>3</Badge></span>
        </span>
      </Tooltip>
      <Tooltip label="Settings" side="bottom"><IconButton onClick={onSettings}><Ic n="settings" s={17} /></IconButton></Tooltip>
      <Tooltip label="Help & docs" side="bottom"><IconButton onClick={() => toast({ tone: 'neutral', title: 'Docs', message: 'Opening the help center…' })}><Ic n="help-circle" s={17} /></IconButton></Tooltip>

      <div ref={ref} style={{ position: 'relative' }}>
        <button type="button" onClick={() => setMenu((m) => !m)} title={user.name} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Avatar name={user.name} size="sm" />
        </button>
        {menu && (
          <div className="sc-dialog-in" style={{ position: 'absolute', top: '120%', right: 0, minWidth: 210, background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', zIndex: 300, padding: 4 }}>
            <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
            </div>
            {[['user', 'Account'], ['credit-card', 'Billing'], ['keyboard', 'Shortcuts']].map((it) => (
              <button key={it[1]} type="button" onClick={() => { setMenu(false); toast({ tone: 'neutral', title: it[1], message: 'Not wired in this demo.' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <Ic n={it[0]} s={15} />{it[1]}
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
            <button type="button" onClick={() => { setMenu(false); onLogout(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--status-danger-fg)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <Ic n="log-out" s={15} />Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function DashOverview({ compact }) {
  const { Card, Avatar, Badge, Tag, Button } = window.LatticeDesignSystem_e801cb;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: compact ? 14 : 20 }}>
      <div className="sc-dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: compact ? 12 : 16 }}>
        <Reveal delay={0}><DashStat icon="folder" label="Active projects" value={12} delta="+2" tone="success" /></Reveal>
        <Reveal delay={60}><DashStat icon="box" label="Components placed" value={1284} delta="+18%" tone="success" /></Reveal>
        <Reveal delay={120}><DashStat icon="users" label="Team members" value={8} delta="+1" tone="info" /></Reveal>
        <Reveal delay={180}><DashStat icon="activity" label="Builds this week" value={47} delta="-4%" tone="warning" /></Reveal>
      </div>

      <div className="sc-dash-split" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: compact ? 14 : 20 }}>
        <Reveal delay={220}>
          <Card padding="lg" header={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><Eyebrow>Last 12 months</Eyebrow><div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>Projects created</div></div>
              <Badge tone="success"><Ic n="trending-up" s={12} /> +23%</Badge>
            </div>}>
            <DashBarChart />
          </Card>
        </Reveal>

        <Reveal delay={280}>
          <Card padding="lg" header={<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Recent activity</div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {DASH_ACTIVITY.slice(0, 4).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span style={{ display: 'inline-flex', width: 26, height: 26, flex: 'none', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', color: 'var(--status-' + (a.tone === 'neutral' ? 'info' : a.tone) + '-fg)', background: 'var(--surface)' }}><Ic n={a.icon} s={13} /></span>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <b style={{ color: 'var(--text-primary)' }}>{a.who}</b> {a.what} <b style={{ color: 'var(--text-primary)' }}>{a.target}</b>
                    <div style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function DashProjects({ projects, setProjects }) {
  const { Card, Input, Select, Button, IconButton, Badge, Tag, Avatar, Checkbox, Tooltip } = window.LatticeDesignSystem_e801cb;
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('Recently updated');
  const [sel, setSel] = React.useState({});
  const [confirm, setConfirm] = React.useState(null); // project pending delete
  const selIds = Object.keys(sel).filter((k) => sel[k]);
  const shown = projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const doDelete = (ids) => {
    setProjects((ps) => ps.filter((p) => !ids.includes(p.id)));
    setSel({});
    setConfirm(null);
    toast({ tone: 'success', title: ids.length > 1 ? ids.length + ' projects deleted' : 'Project deleted' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Input placeholder="Filter projects…" value={q} onChange={(e) => setQ(e.target.value)} iconLeft={<Ic n="filter" s={15} />} size="sm" wrapStyle={{ flex: 1, minWidth: 200 }} />
        <Select value={sort} onChange={(e) => setSort(e.target.value)} size="sm" options={['Recently updated', 'Name A–Z', 'Most nodes']} wrapStyle={{ width: 190 }} />
        <Button variant="solid" size="sm" iconLeft={<Ic n="plus" s={14} />} onClick={() => toast({ tone: 'neutral', title: 'New project', message: 'Use the header button — the create dialog lives there.' })}>New</Button>
      </div>

      {selIds.length > 0 && (
        <div className="sc-dialog-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{selIds.length} selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setSel({})}>Clear</Button>
            <Button variant="danger" size="sm" iconLeft={<Ic n="trash-2" s={13} />} onClick={() => setConfirm({ bulk: true, ids: selIds })}>Delete</Button>
          </div>
        </div>
      )}

      <Card padding="none">
        {shown.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
            <Checkbox checked={!!sel[p.id]} onChange={(v) => setSel((s) => Object.assign({}, s, { [p.id]: v }))} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                <Badge tone={p.tone}>{p.status}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {p.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                <span style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>{p.nodes} nodes · {p.updated}</span>
              </div>
            </div>
            <div style={{ display: 'flex', marginRight: 6 }}>
              {p.owners.map((o, k) => <Avatar key={o} name={o} size="xs" style={{ marginLeft: k ? -6 : 0, boxShadow: '0 0 0 2px var(--surface-card)' }} />)}
            </div>
            <Tooltip label="Open in editor" side="left"><IconButton size="sm" onClick={() => toast({ tone: 'neutral', title: 'Open', message: 'Opening ' + p.name })}><Ic n="external-link" s={15} /></IconButton></Tooltip>
            <Tooltip label="Delete project" side="left"><IconButton size="sm" onClick={() => setConfirm({ project: p })}><Ic n="trash-2" s={15} /></IconButton></Tooltip>
          </div>
        ))}
        {shown.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Ic n="folder-open" s={22} /><div style={{ marginTop: 8, fontSize: 13 }}>No projects match “{q}”.</div>
          </div>
        )}
      </Card>

      <DashConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} />
    </div>
  );
}

function DashConfirmDialog({ confirm, onClose, onConfirm }) {
  const { Dialog, Button } = window.LatticeDesignSystem_e801cb;
  if (!confirm) return null;
  const ids = confirm.bulk ? confirm.ids : [confirm.project.id];
  const label = confirm.bulk ? confirm.ids.length + ' projects' : '“' + confirm.project.name + '”';
  return (
    <Dialog open onClose={onClose} title="Delete project?" width={420}
      description={'This permanently removes ' + label + ' and its canvas graph. This cannot be undone.'}
      footer={<React.Fragment>
        <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="danger" size="md" iconLeft={<Ic n="trash-2" s={14} />} onClick={() => onConfirm(ids)}>Delete</Button>
      </React.Fragment>} />
  );
}

function DashTeam({ team, setTeam }) {
  const { Card, Avatar, Badge, Select, Switch, Button, IconButton, Tooltip } = window.LatticeDesignSystem_e801cb;
  const roleTone = { Owner: 'info', Editor: 'neutral', Viewer: 'neutral' };
  return (
    <Card padding="none">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{team.length} members</div>
        <Button variant="outline" size="sm" iconLeft={<Ic n="user-plus" s={14} />} onClick={() => toast({ tone: 'neutral', title: 'Invite', message: 'Use the “Invite” button in the header actions.' })}>Invite</Button>
      </div>
      {team.map((m, i) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
          <Avatar name={m.name} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.email}</div>
          </div>
          <Badge tone={m.active ? 'success' : 'neutral'}>{m.active ? 'Active' : 'Invited'}</Badge>
          <Select value={m.role} size="sm" wrapStyle={{ width: 130 }} disabled={m.role === 'Owner'}
            onChange={(e) => { const v = e.target.value; setTeam((ts) => ts.map((x) => x.id === m.id ? Object.assign({}, x, { role: v }) : x)); toast({ tone: 'neutral', title: 'Role updated', message: m.name + ' → ' + v }); }}
            options={['Owner', 'Editor', 'Viewer']} />
          <Tooltip label={m.active ? 'Deactivate' : 'Activate'} side="left">
            <span><Switch checked={m.active} disabled={m.role === 'Owner'} onChange={(v) => { setTeam((ts) => ts.map((x) => x.id === m.id ? Object.assign({}, x, { active: v }) : x)); toast({ tone: v ? 'success' : 'warning', title: v ? 'Activated' : 'Deactivated', message: m.name }); }} /></span>
          </Tooltip>
        </div>
      ))}
    </Card>
  );
}

function DashActivityTab() {
  const { Card, Badge, Tooltip } = window.LatticeDesignSystem_e801cb;
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {DASH_ACTIVITY.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i === DASH_ACTIVITY.length - 1 ? 0 : 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Tooltip label={a.tone} side="right">
                <span style={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', background: 'var(--surface)', color: 'var(--status-' + (a.tone === 'neutral' ? 'info' : a.tone) + '-fg)' }}><Ic n={a.icon} s={14} /></span>
              </Tooltip>
              {i !== DASH_ACTIVITY.length - 1 && <div style={{ flex: 1, width: 1, background: 'var(--border-subtle)', marginTop: 4 }} />}
            </div>
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><b style={{ color: 'var(--text-primary)' }}>{a.who}</b> {a.what} <b style={{ color: 'var(--text-primary)' }}>{a.target}</b></div>
              <div style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{a.when}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashCreateDialog({ open, onClose, onCreate }) {
  const { Dialog, Button, Input, Select } = window.LatticeDesignSystem_e801cb;
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('Web app');
  const [err, setErr] = React.useState('');
  React.useEffect(() => { if (open) { setName(''); setType('Web app'); setErr(''); } }, [open]);
  const create = () => { if (!name.trim()) { setErr('Give your project a name.'); return; } onCreate(name.trim(), type); };
  return (
    <Dialog open={open} onClose={onClose} title="New project" description="Spin up a fresh canvas." width={440}
      footer={<React.Fragment>
        <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="solid" size="md" iconRight={<Ic n="arrow-right" s={14} />} onClick={create}>Create project</Button>
      </React.Fragment>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Project name" placeholder="e.g. Nimbus Landing Page" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} error={err} iconLeft={<Ic n="folder" s={15} />} />
        <Select label="Template" value={type} onChange={(e) => setType(e.target.value)} options={['Web app', 'Marketing site', 'Mobile app', 'Design tokens', 'Blank canvas']} />
      </div>
    </Dialog>
  );
}

function DashSettingsDialog({ open, onClose }) {
  const { Dialog, Button, Switch, Select } = window.LatticeDesignSystem_e801cb;
  const [s, setS] = React.useState({ email: true, digest: false, motion: true, density: 'Comfortable' });
  const row = (label, hint, node) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <div><div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</div></div>
      {node}
    </div>
  );
  return (
    <Dialog open={open} onClose={onClose} title="Settings" width={480}
      footer={<React.Fragment>
        <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="solid" size="md" onClick={() => { onClose(); toast({ tone: 'success', title: 'Settings saved' }); }}>Save changes</Button>
      </React.Fragment>}>
      <div>
        {row('Email notifications', 'Comments, mentions and invites.', <Switch checked={s.email} onChange={(v) => setS((x) => Object.assign({}, x, { email: v }))} />)}
        {row('Weekly digest', 'A Monday summary of team activity.', <Switch checked={s.digest} onChange={(v) => setS((x) => Object.assign({}, x, { digest: v }))} />)}
        {row('Interface motion', 'Entrance and hover animations.', <Switch checked={s.motion} onChange={(v) => setS((x) => Object.assign({}, x, { motion: v }))} />)}
        {row('Density', 'Spacing of lists and tables.', <Select value={s.density} onChange={(e) => setS((x) => Object.assign({}, x, { density: e.target.value }))} size="sm" wrapStyle={{ width: 150 }} options={['Comfortable', 'Compact']} />)}
      </div>
    </Dialog>
  );
}

function DashboardPage() {
  const { Button, Select, Switch, Tabs, Badge } = window.LatticeDesignSystem_e801cb;
  const user = useSession();
  const [tab, setTab] = React.useState('overview');
  const [compact, setCompact] = React.useState(false);
  const [range, setRange] = React.useState('This month');
  const [projects, setProjects] = React.useState(DASH_SEED_PROJECTS);
  const [team, setTeam] = React.useState(DASH_SEED_TEAM);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => { if (!user) go('/login'); }, [user]);
  if (!user) return null;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = (user.name || 'there').split(' ')[0];

  const onCreate = (name, type) => {
    const id = 'p' + Math.random().toString(36).slice(2, 6);
    setProjects((ps) => [{ id, name, status: 'Draft', tone: 'neutral', tags: [type.split(' ')[0]], owners: [user.name], nodes: 0, updated: 'just now' }].concat(ps));
    setCreateOpen(false);
    setTab('projects');
    toast({ tone: 'success', title: 'Project created', message: name });
  };
  const logout = () => { scSetSession(null); toast({ tone: 'neutral', title: 'Signed out', message: 'See you soon.' }); go('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <DashHeader user={user} onSettings={() => setSettingsOpen(true)} onLogout={logout} />

      <div className="sc-page" style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 24px 64px' }}>
        {/* Greeting + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Reveal delay={0}><Eyebrow>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Eyebrow></Reveal>
            <Reveal delay={60}><Serif size={30} style={{ marginTop: 8 }}>{greet}, {first}.</Serif></Reveal>
          </div>
          <Reveal delay={120}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10, borderRight: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compact</span>
                <Switch checked={compact} onChange={setCompact} />
              </div>
              <Select value={range} onChange={(e) => setRange(e.target.value)} size="sm" wrapStyle={{ width: 150 }} options={['Today', 'This week', 'This month', 'This quarter']} />
              <Button variant="solid" size="md" iconLeft={<Ic n="plus" s={15} />} onClick={() => setCreateOpen(true)}>New project</Button>
            </div>
          </Reveal>
        </div>

        {/* Tabs */}
        <Reveal delay={160}>
          <div style={{ marginTop: 22 }}>
            <Tabs value={tab} onChange={setTab} tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'projects', label: 'Projects' },
              { value: 'team', label: 'Team' },
              { value: 'activity', label: 'Activity' },
            ]} />
          </div>
        </Reveal>

        <div key={tab} className="sc-tabpane" style={{ marginTop: compact ? 16 : 22 }}>
          {tab === 'overview' && <DashOverview compact={compact} />}
          {tab === 'projects' && <DashProjects projects={projects} setProjects={setProjects} />}
          {tab === 'team' && <DashTeam team={team} setTeam={setTeam} />}
          {tab === 'activity' && <DashActivityTab />}
        </div>

        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
          <ComponentsUsed list={['Avatar', 'Badge', 'Tag', 'Card', 'Button', 'IconButton', 'Tabs', 'Switch', 'Select', 'Input', 'Checkbox', 'Dialog', 'Toast', 'Tooltip']} />
        </div>
      </div>

      <DashCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={onCreate} />
      <DashSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <style>{`
        @media (max-width: 780px) {
          .sc-dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .sc-dash-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
window.DashboardPage = DashboardPage;
