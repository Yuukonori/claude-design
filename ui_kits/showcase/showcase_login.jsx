/* global React, Ic, Reveal, Wordmark, LatticeMark, Eyebrow, Serif, LatticeBG, PasswordField, OrDivider, ErrorBanner, ComponentsUsed, useSession, scSetSession, go, toast */
// Login — split-screen editorial auth. Exercises: Input, Button, IconButton, Checkbox, Switch,
// Tabs, Tooltip, Toast, Badge, Card, Avatar.

// Inline monochrome brand marks — Lucide removed brand/logo icons (trademark), so SSO glyphs are drawn here.
function BrandGlyph({ brand, s = 18 }) {
  const paths = {
    github: "M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.37-3.87-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.26 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z",
    google: "M12 11v2.4h3.97c-.16 1.03-1.2 3.02-3.97 3.02-2.39 0-4.34-1.98-4.34-4.42S9.61 7.58 12 7.58c1.36 0 2.27.58 2.79 1.08l1.9-1.83C15.47 5.69 13.89 5 12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.11-1.16H12z",
    apple: "M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.75.85-1.98 1.5-3.02 1.42-.13-1.1.44-2.27 1.1-3 .74-.82 2.02-1.42 3.04-1.41zM20.5 17.02c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.52-4.12 3.53-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1.01-1.73-.01-3.05-1.77-4.04-3.34-2.77-4.29-3.05-9.77-.62-12.69.99-1.2 2.55-1.96 4.02-1.96 1.5 0 2.44 1.02 3.68 1.02 1.2 0 1.93-1.02 3.66-1.02 1.31 0 2.7.72 3.7 1.95-3.25 1.78-2.72 6.42.31 7.5z",
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }} aria-hidden="true"><path d={paths[brand]} /></svg>;
}

function LoginBrand() {
  const { Avatar, Badge } = window.LatticeDesignSystem_e801cb;
  return (
    <div className="sc-login-brand" style={{ position: 'relative', display: 'none', flexDirection: 'column', padding: 48, borderRight: '1px solid var(--border-subtle)', height: '100%' }}>
      <div className="lattice-grid sc-grid-drift" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Wordmark size={21} onClick={() => go('/login')} />
        <div style={{ margin: 'auto 0', maxWidth: 440 }}>
          <Reveal delay={60}><Eyebrow>Structure-first design</Eyebrow></Reveal>
          <Reveal delay={140}>
            <Serif italic size={44} style={{ marginTop: 18 }}>
              "Design the structure, not just the surface."
            </Serif>
          </Reveal>
          <Reveal delay={240}>
            <p style={{ marginTop: 20, fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-muted)', maxWidth: 400 }}>
              Place component nodes on a canvas, connect their relationships, and generate clean React
              straight from the graph.
            </p>
          </Reveal>
          <Reveal delay={340}>
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {['Rin Sato', 'Mei Lin', 'Ada K', 'Jon P'].map((n, i) => (
                  <Avatar key={n} name={n} size="sm" style={{ marginLeft: i ? -8 : 0, boxShadow: '0 0 0 2px var(--bg-app)' }} />
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                <b style={{ color: 'var(--text-secondary)' }}>12,400+</b> designers building with Lattice
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal delay={420}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-disabled)' }}>lattice.design</span>
            <Badge tone="success"><Ic n="shield-check" s={12} /> SOC 2 Type II</Badge>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function LoginPage() {
  const { Button, Input, Checkbox, Switch, Tabs, Tooltip, IconButton, Badge, Card } = window.LatticeDesignSystem_e801cb;
  const [tab, setTab] = React.useState('password');
  const [email, setEmail] = React.useState('rin@studio.com');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [staySignedIn, setStaySignedIn] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [shake, setShake] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const fail = (m) => { setErr(m); setShake(true); setTimeout(() => setShake(false), 400); };

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (!email.trim()) return fail('Enter your email address.');
    if (tab === 'password' && password.length < 1) return fail('Enter your password.');
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (tab === 'magic') {
        toast({ tone: 'info', title: 'Magic link sent', message: 'Check ' + email + ' to finish signing in.' });
        return;
      }
      const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      scSetSession({ name: name || 'Rin Sato', email, plan: 'Pro', remember, staySignedIn });
      toast({ tone: 'success', title: 'Welcome back', message: name });
      go('/dashboard');
    }, 720);
  };

  const social = (brand, label) => (
    <Tooltip label={'Continue with ' + label} side="top">
      <IconButton className="sc-social" variant="outline" size="lg" title={label}
        onClick={() => toast({ tone: 'neutral', title: label + ' sign-in', message: 'SSO is stubbed in this demo.' })}>
        <BrandGlyph brand={brand} s={18} />
      </IconButton>
    </Tooltip>
  );

  return (
    <div className="sc-page" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr', background: 'var(--bg-app)' }}>
      <LoginBrand />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Top-right utility row */}
        <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="sc-hide-mobile" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>New to Lattice?</span>
          <Button variant="ghost" size="sm" onClick={() => go('/register')} iconRight={<Ic n="arrow-right" s={14} />}>Create account</Button>
          <span className="sc-hide-mobile">
            <Tooltip label="Keyboard shortcuts" side="left">
              <IconButton size="sm" onClick={() => toast({ tone: 'neutral', title: 'Tip', message: 'Press ⏎ to submit the form.' })}><Ic n="help-circle" s={16} /></IconButton>
            </Tooltip>
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 384 }}>
          <Reveal delay={20}>
            <div className="sc-login-mark" style={{ display: 'none', marginBottom: 28 }}><Wordmark size={20} onClick={() => go('/login')} /></div>
          </Reveal>
          <Reveal delay={40}><Eyebrow>Account access</Eyebrow></Reveal>
          <Reveal delay={90}><Serif size={30} style={{ marginTop: 10 }}>Welcome back.</Serif></Reveal>
          <Reveal delay={140}>
            <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--text-muted)' }}>Pick up right where you left off.</p>
          </Reveal>

          {/* Social row */}
          <Reveal delay={200}>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {social('github', 'GitHub')}
              {social('google', 'Google')}
              {social('apple', 'Apple')}
            </div>
          </Reveal>

          <Reveal delay={250}><div style={{ marginTop: 18 }}><OrDivider>or continue with email</OrDivider></div></Reveal>

          <Reveal delay={300}>
            <div style={{ marginTop: 14 }}>
              <Tabs value={tab} onChange={setTab} tabs={[{ value: 'password', label: 'Password' }, { value: 'magic', label: 'Magic link' }]} />
            </div>
          </Reveal>

          <Reveal delay={340}>
            <form onSubmit={submit} className="sc-tabpane" key={tab} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              <ErrorBanner shake={shake}>{err}</ErrorBanner>
              <Input label="Email" type="email" placeholder="name@studio.com" value={email}
                onChange={(e) => setEmail(e.target.value)} iconLeft={<Ic n="mail" s={15} />} />

              {tab === 'password' ? (
                <React.Fragment>
                  <div>
                    <PasswordField label="Password" placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <Checkbox label="Remember this device" checked={remember} onChange={setRemember} />
                      <a href="#/login" onClick={(e) => { e.preventDefault(); toast({ tone: 'info', title: 'Reset link sent', message: 'Password reset emailed to ' + (email || 'your inbox') }); }} className="sc-link" style={{ fontSize: 12.5 }}>Forgot?</a>
                    </div>
                  </div>
                  <Button type="submit" variant="solid" size="lg" fullWidth disabled={busy}
                    iconRight={busy ? null : <Ic n="arrow-right" s={16} />}>
                    {busy ? 'Signing in…' : 'Sign in'}
                  </Button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                    <Switch label="Stay signed in for 30 days" checked={staySignedIn} onChange={setStaySignedIn} />
                    <Tooltip label="Recommended only on personal devices" side="left"><span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}><Ic n="info" s={14} /></span></Tooltip>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0' }}>We'll email you a one-time link — no password needed.</p>
                  <Button type="submit" variant="solid" size="lg" fullWidth disabled={busy}
                    iconLeft={busy ? null : <Ic n="wand-2" s={16} />}>
                    {busy ? 'Sending…' : 'Email me a magic link'}
                  </Button>
                </React.Fragment>
              )}
            </form>
          </Reveal>

          <Reveal delay={400}>
            <Card padding="sm" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)' }}>
              <Badge tone="info">Demo</Badge>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Any email + password works. Try <b style={{ color: 'var(--text-secondary)' }}>rin@studio.com</b>.</span>
            </Card>
          </Reveal>

          <Reveal delay={460}>
            <div style={{ marginTop: 22 }}>
              <ComponentsUsed list={['Input', 'Button', 'IconButton', 'Checkbox', 'Switch', 'Tabs', 'Tooltip', 'Toast', 'Badge', 'Card', 'Avatar']} />
            </div>
          </Reveal>

          <Reveal delay={520}>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <Ic n="layout-grid" s={14} />
              <span>Just browsing?</span>
              <a href="#/menus" className="sc-link" onClick={(e) => { e.preventDefault(); go('/menus'); }}>Explore 9 menu styles</a>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .sc-login-brand { display: flex !important; } }
        @media (max-width: 899px) {
          .sc-page { grid-template-columns: 1fr !important; }
          .sc-login-mark { display: block !important; }
          .sc-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
window.LoginPage = LoginPage;
