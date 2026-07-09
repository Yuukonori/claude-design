/* global React, navigate, useAuth, api, toast */
// Shared, brand-faithful building blocks for the Lattice product app.
// Each reads DS primitives from window.LatticeDesignSystem_e801cb inside its own scope.

function Ic({ n, s = 16, style }) {
  return <i data-lucide={n} style={{ width: s, height: s, ...style }}></i>;
}
window.Ic = Ic;

function Container({ children, style, wide, full }) {
  return <div style={{ width: '100%', maxWidth: full ? 'none' : (wide ? 1240 : 1120), margin: '0 auto', padding: full ? '0 32px' : '0 24px', ...style }}>{children}</div>;
}
window.Container = Container;

function Eyebrow({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', ...style }}>{children}</div>;
}
window.Eyebrow = Eyebrow;

function FullLoader() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 10 }}>
      <span className="lattice-spin" style={{ width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</span>
      <style>{'@keyframes lspin{to{transform:rotate(360deg)}}.lattice-spin{animation:lspin .7s linear infinite}'}</style>
    </div>
  );
}
window.FullLoader = FullLoader;

// --- Marketing chrome ---
function NavLink({ to, children }) {
  const active = (window.location.hash.replace(/^#/, '') || '/') === to;
  return (
    <a href={'#' + to} style={{
      padding: '7px 12px', fontSize: 13.5, color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontWeight: active ? 600 : 500, borderRadius: 2,
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = active ? 'var(--text-primary)' : 'var(--text-secondary)'}>
      {children}
    </a>
  );
}

function Wordmark({ size = 19 }) {
  return (
    <a href="#/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <img src="../../assets/logo-mark.svg" alt="" style={{ height: size + 3, display: 'block' }} />
      <span style={{ fontFamily: 'var(--font-serif-display)', fontSize: size, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Lattice</span>
    </a>
  );
}
window.Wordmark = Wordmark;

function Navbar({ user }) {
  const { Button, Avatar } = window.LatticeDesignSystem_e801cb;
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,10,12,0.72)', backdropFilter: 'var(--blur-overlay)' }}>
      <Container full style={{ height: 62, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wordmark />
        <nav style={{ display: 'flex', gap: 2, marginLeft: 18 }}>
          <NavLink to="/">Product</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>Dashboard</Button>
              <button type="button" onClick={() => navigate('/account')} title={user.name} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0 }}>
                <Avatar name={user.name} size="sm" />
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
              <Button variant="solid" size="sm" onClick={() => navigate('/register')} iconRight={<Ic n="arrow-right" s={15} />}>Get started</Button>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
window.Navbar = Navbar;

function Footer() {
  const cols = [
    ['Product', ['Overview', 'Pricing', 'Changelog', 'Roadmap']],
    ['Company', ['About', 'Careers', 'Blog', 'Contact']],
    ['Resources', ['Docs', 'Guides', 'Components', 'Status']],
    ['Legal', ['Privacy', 'Terms', 'Security', 'DPA']],
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface)', marginTop: 96 }}>
      <Container full style={{ padding: '56px 32px 40px', display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 32 }}>
        <div>
          <Wordmark />
          <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)', maxWidth: 240, lineHeight: 1.6 }}>
            Design the structure, not just the surface. Place, connect, and generate.
          </p>
        </div>
        {cols.map(([h, links]) => (
          <div key={h}>
            <Eyebrow style={{ marginBottom: 14 }}>{h}</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {links.map(l => <a key={l} href="#/" style={{ fontSize: 13, color: 'var(--text-secondary)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>{l}</a>)}
            </div>
          </div>
        ))}
      </Container>
      <Container full style={{ borderTop: '1px solid var(--border-subtle)', padding: '18px 32px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        <span>© {new Date().getFullYear()} Lattice</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>Made for designers &amp; design-engineers</span>
      </Container>
    </footer>
  );
}
window.Footer = Footer;

// --- Editor preview mock (used on Home) ---
function EditorPreview() {
  const boxes = [
    { x: 24, y: 20, w: 150, h: 44, c: '#9B8AFB', t: 'Section' },
    { x: 210, y: 20, w: 120, h: 44, c: '#FB923C', t: 'Heading' },
    { x: 210, y: 92, w: 120, h: 78, c: '#F472B6', t: 'PricingCard' },
    { x: 24, y: 108, w: 150, h: 62, c: '#34D399', t: 'Grid' },
  ];
  return (
    <div style={{ border: '1px solid var(--border-default)', background: 'var(--bg-void)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
      <div style={{ height: 34, borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
        <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>pricing-page.lattice</span>
      </div>
      <div className="lattice-grid" style={{ position: 'relative', height: 210 }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path d="M174,42 C210,42 190,114 210,131" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <path d="M174,139 C210,139 200,120 210,120" fill="none" stroke="rgba(96,165,250,0.4)" strokeDasharray="4 3" strokeWidth="1" />
        </svg>
        {boxes.map((b, i) => (
          <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: '#13171f', border: `1px solid ${b.c}55`, borderLeft: `2px solid ${b.c}`, display: 'flex', alignItems: 'flex-start', padding: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{b.t}</div>
        ))}
      </div>
    </div>
  );
}
window.EditorPreview = EditorPreview;

function FeatureCard({ icon, title, children }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 20 }}>
      <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', color: 'var(--text-primary)', marginBottom: 14 }}>
        <Ic n={icon} s={17} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{title}</div>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}
window.FeatureCard = FeatureCard;

// --- Pricing ---
function PlanToggle({ cycle, onChange }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 3, gap: 3, background: 'var(--surface)' }}>
      {['monthly', 'annual'].map(c => (
        <button key={c} type="button" onClick={() => onChange(c)} style={{
          border: 0, cursor: 'pointer', padding: '5px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontFamily: 'var(--font-sans)',
          background: cycle === c ? 'var(--action-solid)' : 'transparent',
          color: cycle === c ? 'var(--action-solid-text)' : 'var(--text-secondary)', fontWeight: cycle === c ? 600 : 500,
        }}>{c === 'monthly' ? 'Monthly' : 'Annual'}{c === 'annual' && <span style={{ marginLeft: 6, fontSize: 10.5, color: cycle === c ? 'var(--action-solid-text)' : 'var(--green-base)' }}>−17%</span>}</button>
      ))}
    </div>
  );
}
window.PlanToggle = PlanToggle;

function PricingCard({ plan, cycle, featured, current, onChoose }) {
  const { Button, Badge } = window.LatticeDesignSystem_e801cb;
  const [hover, setHover] = React.useState(false);
  const price = cycle === 'annual' ? Math.round(plan.price_annual / 12) : plan.price_monthly;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        border: '1px solid ' + (hover || featured ? 'var(--border-strong)' : 'var(--border-subtle)'),
        background: hover || featured ? 'var(--surface-raised)' : 'var(--surface-card)',
        padding: 24, display: 'flex', flexDirection: 'column',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? 'var(--shadow-md)' : 'none',
        transition: 'transform var(--dur-base) var(--ease-out), border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      }}>
      {featured && <div style={{ position: 'absolute', top: -1, right: -1 }}><Badge tone="info">Popular</Badge></div>}
      <div style={{ fontSize: 15, fontWeight: 600 }}>{plan.name}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, marginBottom: 16 }}>{plan.tagline}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-serif-display)', fontSize: 40, letterSpacing: '-0.02em' }}>${price}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>/mo</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', marginBottom: 18, minHeight: 15 }}>
        {cycle === 'annual' && plan.price_annual > 0 ? `$${plan.price_annual} billed yearly` : plan.price_monthly === 0 ? 'Free forever' : 'Billed monthly'}
      </div>
      <Button variant={featured ? 'solid' : 'outline'} size="md" fullWidth disabled={current} onClick={() => onChoose(plan)}>
        {current ? 'Current plan' : plan.price_monthly === 0 ? 'Start free' : 'Choose ' + plan.name}
      </Button>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(plan.features || []).map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--green-base)', flex: 'none', marginTop: 1 }}><Ic n="check" s={15} /></span>{f}
          </div>
        ))}
      </div>
    </div>
  );
}
window.PricingCard = PricingCard;

// --- Auth ---
function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ display: 'none', position: 'relative' }} className="auth-brand">
        <div className="lattice-grid" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', padding: 48, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--border-subtle)' }}>
          <Wordmark size={20} />
          <div style={{ margin: 'auto 0' }}>
            <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.02em', fontStyle: 'italic', maxWidth: 420 }}>
              "Design the structure, not just the surface."
            </div>
            <div style={{ marginTop: 18, fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
              Place component nodes on a canvas, connect their relationships, and generate clean React from the graph.
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>lattice.design</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 28, letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>{subtitle}</div>
          </div>
          {children}
          {footer && <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{footer}</div>}
        </div>
      </div>
      <style>{'@media(min-width:900px){.auth-brand{display:block!important}}'}</style>
    </div>
  );
}
window.AuthShell = AuthShell;

// NOTE: intentionally avoids object-rest (`{ ...rest }`) destructuring. The in-browser Babel
// transformer emits a top-level `const _excluded` helper for each file that uses object-rest, and
// those collide across scripts in the shared global scope. The Market previews load the editor's
// PreviewCanvas.jsx (which uses object-rest), so this file must not add a second one.
function Field(props) {
  const { Input } = window.LatticeDesignSystem_e801cb;
  const { label, error, hint, children } = props;
  if (children) return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}{children}{error && <span style={{ fontSize: 11, color: 'var(--status-danger-fg)' }}>{error}</span>}</div>;
  const rest = Object.assign({}, props);
  delete rest.label; delete rest.error; delete rest.hint; delete rest.children;
  return <Input label={label} error={error} hint={hint} {...rest} />;
}
window.Field = Field;

// --- App shell (authed) ---
function SidebarLink({ to, icon, label, active }) {
  return (
    <a href={'#' + to} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', fontSize: 13.5,
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      background: active ? 'var(--surface-hover)' : 'transparent',
      borderLeft: '2px solid ' + (active ? 'var(--text-primary)' : 'transparent'),
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-card)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <Ic n={icon} s={16} style={{ opacity: 0.85 }} />{label}
    </a>
  );
}

function AvatarMenu({ user }) {
  const { Avatar } = window.LatticeDesignSystem_e801cb;
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', on), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', on); };
  }, [open]);
  const item = (icon, label, onClick, danger) => (
    <button type="button" onClick={() => { setOpen(false); onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: danger ? 'var(--status-danger-fg)' : 'var(--text-secondary)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; if (!danger) e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? 'var(--status-danger-fg)' : 'var(--text-secondary)'; }}>
      <Ic n={icon} s={15} />{label}
    </button>
  );
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} title={user.name} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <Avatar name={user.name} size="sm" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, minWidth: 200, background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', zIndex: 300, padding: 4 }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
          </div>
          {item('user', 'Account', () => navigate('/account'))}
          {item('credit-card', 'Billing', () => navigate('/billing'))}
          {item('users', 'Team', () => navigate('/team'))}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
          {item('log-out', 'Sign out', () => logout(), true)}
        </div>
      )}
    </div>
  );
}

function AppShell({ active, user, title, actions, children }) {
  const { Button } = window.LatticeDesignSystem_e801cb;
  const workspaceNav = [
    ['/projects', 'layout-grid', 'Projects'],
    ['/team', 'users', 'Team'],
    ['/billing', 'credit-card', 'Billing'],
    ['/account', 'user', 'Account'],
  ];
  const marketNav = [
    ['/market', 'store', 'Market'],
    ['/plugins', 'blocks', 'Plugins'],
    ['/library', 'library', 'Library'],
  ];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }}>
      <aside style={{ width: 232, flex: 'none', borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '16px 16px', borderBottom: '1px solid var(--border-subtle)' }}><Wordmark size={18} /></div>
        <nav style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <Eyebrow style={{ padding: '8px 10px 4px' }}>Workspace</Eyebrow>
          {workspaceNav.map(([to, icon, label]) => <SidebarLink key={to} to={to} icon={icon} label={label} active={active === to} />)}
          <Eyebrow style={{ padding: '14px 10px 4px' }}>Marketplace</Eyebrow>
          {marketNav.map(([to, icon, label]) => <SidebarLink key={to} to={to} icon={icon} label={label} active={active === to} />)}
          <div style={{ marginTop: 'auto', padding: '6px 6px 2px' }}>
            <Button variant="outline" size="sm" fullWidth iconLeft={<Ic n="life-buoy" s={15} />}
              onClick={() => { window.location.href = 'mailto:support@lattice.design?subject=Support%20request'; }}>
              Contact support
            </Button>
          </div>
        </nav>
      </aside>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 60, flex: 'none', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            {actions}
            <AvatarMenu user={user} />
          </div>
        </header>
        <main style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '28px 24px 48px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
window.AppShell = AppShell;

// --- Data display ---
function StatCard({ icon, label, value, hint }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 12 }}>
        <Ic n={icon} s={15} /><span style={{ fontSize: 12 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 30, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
window.StatCard = StatCard;

function ProjectCard({ project, onOpen, onRename, onDelete }) {
  const { Badge } = window.LatticeDesignSystem_e801cb;
  const [menu, setMenu] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!menu) return;
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', on), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', on); };
  }, [menu]);
  const updated = new Date(project.updated_at);
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
      onClick={() => onOpen(project)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
      <div className="lattice-grid" style={{ height: 120, borderBottom: '1px solid var(--border-subtle)', position: 'relative', background: 'var(--bg-void)' }}>
        <div style={{ position: 'absolute', left: 16, top: 18, width: 90, height: 30, background: '#13171f', borderLeft: '2px solid #9B8AFB', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', left: 120, top: 40, width: 70, height: 46, background: '#13171f', borderLeft: '2px solid #F472B6', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>edited {updated.toLocaleDateString()}</div>
        </div>
        <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button type="button" title="More" onClick={() => setMenu(m => !m)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
            <Ic n="more-horizontal" s={16} />
          </button>
          {menu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, minWidth: 150, background: 'var(--surface-raised)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)', zIndex: 30, padding: 4 }}>
              {[['pen-tool', 'Open', () => onOpen(project)], ['pencil', 'Rename', () => onRename(project)], ['trash-2', 'Delete', () => onDelete(project)]].map(([ic, lb, fn], i) => (
                <button key={i} type="button" onClick={() => { setMenu(false); fn(); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 10px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: lb === 'Delete' ? 'var(--status-danger-fg)' : 'var(--text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Ic n={ic} s={14} />{lb}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
window.ProjectCard = ProjectCard;

function DataTable({ columns, rows, empty }) {
  if (!rows.length) return empty || null;
  return (
    <div style={{ border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface)' }}>
            {columns.map((c, i) => <th key={i} style={{ textAlign: c.align || 'left', padding: '10px 14px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? '1px solid var(--border-subtle)' : 0 }}>
              {columns.map((c, ci) => <td key={ci} style={{ padding: '11px 14px', textAlign: c.align || 'left', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>{c.cell ? c.cell(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
window.DataTable = DataTable;

function EmptyState({ icon, title, message, action }) {
  return (
    <div style={{ border: '1px dashed var(--border-default)', padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ color: 'var(--text-disabled)' }}><Ic n={icon || 'inbox'} s={26} /></div>
      <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 20, color: 'var(--text-secondary)' }}>{title}</div>
      {message && <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340 }}>{message}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
window.EmptyState = EmptyState;
