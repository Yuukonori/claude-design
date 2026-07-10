/* global React, Ic, Reveal, Wordmark, Eyebrow, Serif, LatticeBG, PasswordField, ErrorBanner, ComponentsUsed, scorePassword, scSetSession, go, toast */
// Register — a 3-step workflow (Account → Profile → Review) driven by a controlled Tabs stepper.
// Exercises: Input, Select, Checkbox, Switch, Tag, Dialog, Tooltip, Toast, Badge, Avatar, Button, Tabs.

function StrengthMeter({ pw }) {
  const { Badge } = window.LatticeDesignSystem_e801cb;
  const s = scorePassword(pw);
  const barColor = { danger: 'var(--status-danger-fg)', warning: 'var(--status-warning-fg)', info: 'var(--status-info-fg)', success: 'var(--status-success-fg)', neutral: 'var(--border-strong)' }[s.tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--surface-hover)', overflow: 'hidden' }}>
        <div style={{ width: s.pct + '%', height: '100%', background: barColor, transition: 'width var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)' }} />
      </div>
      <Badge tone={s.tone}>{s.label}</Badge>
    </div>
  );
}

function TermsDialog({ open, onClose, onAccept }) {
  const { Dialog, Button } = window.LatticeDesignSystem_e801cb;
  return (
    <Dialog open={open} onClose={onClose} title="Terms of Service" description="Last updated 10 Jul 2026"
      footer={<React.Fragment>
        <Button variant="ghost" size="md" onClick={onClose}>Decline</Button>
        <Button variant="solid" size="md" onClick={onAccept} iconRight={<Ic n="check" s={15} />}>Accept &amp; continue</Button>
      </React.Fragment>}>
      <div style={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.65 }}>
        <p>Welcome to Lattice. By creating an account you agree to design responsibly and to keep your node graphs tidy.</p>
        <p><b style={{ color: 'var(--text-primary)' }}>1. Your content.</b> Projects you create remain yours. We store canvas graphs to render and version them; you can export or delete them at any time.</p>
        <p><b style={{ color: 'var(--text-primary)' }}>2. Fair use.</b> The free plan includes three projects. Automated scraping of the component market is not permitted.</p>
        <p><b style={{ color: 'var(--text-primary)' }}>3. Privacy.</b> We never sell your data. Analytics are aggregate and anonymized.</p>
        <p><b style={{ color: 'var(--text-primary)' }}>4. Changes.</b> We'll email you 30 days before any material change to these terms.</p>
        <p style={{ color: 'var(--text-muted)' }}>This is placeholder copy for a design-system demo.</p>
      </div>
    </Dialog>
  );
}

function RegisterPage() {
  const { Button, Input, Select, Checkbox, Switch, Tag, Tooltip, Tabs, Badge, Avatar } = window.LatticeDesignSystem_e801cb;
  const STEPS = [{ value: 's1', label: '1 · Account' }, { value: 's2', label: '2 · Profile' }, { value: 's3', label: '3 · Review' }];
  const [step, setStep] = React.useState('s1');
  const [form, setForm] = React.useState({ name: '', email: '', password: '', role: 'Product designer', team: '1 (solo)' });
  const [interests, setInterests] = React.useState(['Design systems', 'Prototyping']);
  const [draftTag, setDraftTag] = React.useState('');
  const [marketing, setMarketing] = React.useState(true);
  const [agree, setAgree] = React.useState(false);
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setForm((f) => Object.assign({}, f, { [k]: e.target.value }));
  const stepIdx = STEPS.findIndex((s) => s.value === step);

  const SUGGESTED = ['Design systems', 'Prototyping', 'Handoff', 'Motion', 'Accessibility', 'Data viz', 'Theming'];
  const addTag = (t) => { const v = (t || '').trim(); if (v && !interests.includes(v)) setInterests((xs) => xs.concat([v])); setDraftTag(''); };
  const removeTag = (t) => setInterests((xs) => xs.filter((x) => x !== t));

  const validateStep = () => {
    if (step === 's1') {
      if (!form.name.trim()) return 'Enter your full name.';
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
    }
    if (step === 's2' && interests.length === 0) return 'Pick at least one focus area.';
    return '';
  };

  const next = () => {
    const v = validateStep();
    if (v) { setErr(v); toast({ tone: 'danger', title: 'Check the form', message: v }); return; }
    setErr('');
    setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)].value);
  };
  const back = () => { setErr(''); setStep(STEPS[Math.max(0, stepIdx - 1)].value); };

  const submit = () => {
    if (!agree) { setErr('Please accept the terms to continue.'); toast({ tone: 'danger', title: 'One more thing', message: 'Accept the terms to finish.' }); return; }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      scSetSession({ name: form.name, email: form.email, plan: 'Free', role: form.role, interests });
      toast({ tone: 'success', title: 'Account created', message: 'Welcome to Lattice, ' + form.name.split(' ')[0] + '!' });
      go('/dashboard');
    }, 800);
  };

  return (
    <LatticeBG>
      <div className="sc-page" style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 64px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={20} onClick={() => go('/login')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Already have an account?</span>
            <Button variant="outline" size="sm" onClick={() => go('/login')}>Sign in</Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28, margin: 'auto 0', maxWidth: 560, width: '100%', marginLeft: 'auto', marginRight: 'auto', paddingTop: 32 }}>
          <div>
            <Reveal delay={20}><Eyebrow>Create your account</Eyebrow></Reveal>
            <Reveal delay={80}><Serif size={34} style={{ marginTop: 10 }}>Start designing structure.</Serif></Reveal>
            <Reveal delay={130}><p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13.5 }}>Free forever for up to three projects — no card required.</p></Reveal>
          </div>

          {/* Stepper */}
          <Reveal delay={180}>
            <div>
              <Tabs value={step} tabs={STEPS} onChange={(v) => {
                const target = STEPS.findIndex((s) => s.value === v);
                if (target <= stepIdx) { setErr(''); setStep(v); } // only allow going back via tabs
                else { const bad = validateStep(); if (bad) { setErr(bad); return; } setErr(''); setStep(v); }
              }} />
              <div style={{ height: 3, background: 'var(--surface-hover)', marginTop: 0 }}>
                <div style={{ width: ((stepIdx + 1) / STEPS.length) * 100 + '%', height: '100%', background: 'var(--text-primary)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
              </div>
            </div>
          </Reveal>

          <div key={step} className="sc-tabpane" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ErrorBanner>{err}</ErrorBanner>

            {step === 's1' && (
              <React.Fragment>
                <Input label="Full name" placeholder="Rin Sato" value={form.name} onChange={set('name')} iconLeft={<Ic n="user" s={15} />} />
                <Input label="Work email" type="email" placeholder="name@studio.com" value={form.email} onChange={set('email')} iconLeft={<Ic n="mail" s={15} />} />
                <div>
                  <PasswordField label="Password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} hint="Mix upper, lower, a number and a symbol." />
                  <StrengthMeter pw={form.password} />
                </div>
              </React.Fragment>
            )}

            {step === 's2' && (
              <React.Fragment>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={form.name || 'New User'} size="lg" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{form.name || 'Your name'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{form.email || 'name@studio.com'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Select label="Your role" value={form.role} onChange={set('role')}
                    options={['Product designer', 'Design engineer', 'Frontend engineer', 'Design lead', 'Founder', 'Student']} />
                  <Select label="Team size" value={form.team} onChange={set('team')}
                    options={['1 (solo)', '2–10', '11–50', '51–200', '200+']} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Focus areas</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
                    {interests.map((t) => <Tag key={t} shape="pill" onRemove={() => removeTag(t)}>{t}</Tag>)}
                    {interests.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>Add at least one below.</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <Input placeholder="Add a focus area…" value={draftTag} onChange={(e) => setDraftTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(draftTag); } }}
                      wrapStyle={{ flex: 1 }} iconLeft={<Ic n="plus" s={14} />} />
                    <Button variant="outline" size="md" onClick={() => addTag(draftTag)}>Add</Button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {SUGGESTED.filter((s) => !interests.includes(s)).map((s) => (
                      <button key={s} type="button" onClick={() => addTag(s)} style={{
                        fontSize: 11.5, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', cursor: 'pointer',
                        background: 'transparent', border: '1px dashed var(--border-default)', padding: '3px 8px',
                      }}>+ {s}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Product emails</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tips, changelog and the occasional template.</div>
                  </div>
                  <Switch checked={marketing} onChange={setMarketing} />
                </div>
              </React.Fragment>
            )}

            {step === 's3' && (
              <React.Fragment>
                <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}>
                  {[
                    ['Name', form.name || '—'],
                    ['Email', form.email || '—'],
                    ['Role', form.role],
                    ['Team size', form.team],
                  ].map((row, i) => (
                    <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{row[0]}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{row[1]}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Focus</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 300 }}>
                      {interests.map((t) => <Tag key={t} shape="pill">{t}</Tag>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Plan</span>
                    <Badge tone="success">Free · 3 projects</Badge>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Checkbox checked={agree} onChange={setAgree} />
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    I agree to the <a href="#/register" onClick={(e) => { e.preventDefault(); setTermsOpen(true); }} className="sc-link">Terms of Service</a> and Privacy Policy.
                    <Tooltip label="Opens the full terms" side="right"><span style={{ marginLeft: 6, display: 'inline-flex', color: 'var(--text-muted)', verticalAlign: 'middle' }}><Ic n="info" s={13} /></span></Tooltip>
                  </div>
                </div>
              </React.Fragment>
            )}

            {/* Step controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Button variant="ghost" size="md" disabled={stepIdx === 0} onClick={back} iconLeft={<Ic n="arrow-left" s={15} />}>Back</Button>
              {step !== 's3'
                ? <Button variant="solid" size="md" onClick={next} iconRight={<Ic n="arrow-right" s={15} />}>Continue</Button>
                : <Button variant="solid" size="md" onClick={submit} disabled={busy} iconRight={busy ? null : <Ic n="sparkles" s={15} />}>{busy ? 'Creating…' : 'Create account'}</Button>}
            </div>
          </div>

          <Reveal delay={240}>
            <ComponentsUsed list={['Input', 'Select', 'Checkbox', 'Switch', 'Tag', 'Dialog', 'Tooltip', 'Toast', 'Badge', 'Avatar', 'Button', 'Tabs']} />
          </Reveal>
        </div>
      </div>

      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} onAccept={() => { setAgree(true); setTermsOpen(false); setErr(''); toast({ tone: 'success', title: 'Terms accepted' }); }} />
    </LatticeBG>
  );
}
window.RegisterPage = RegisterPage;
