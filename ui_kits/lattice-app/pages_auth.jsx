/* global React, AuthShell, Field, Ic, navigate, useAuth, toast */
function Login() {
  const { Button } = window.LatticeDesignSystem_e801cb;
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const u = await login({ email, password });
      toast({ tone: 'success', title: 'Welcome back', message: u.name });
      navigate('/projects');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back. Pick up where you left off."
      footer={<span>New to Lattice? <a href="#/register" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Create an account</a></span>}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {err && <div style={{ fontSize: 12.5, color: 'var(--status-danger-fg)', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-fg)', padding: '8px 10px' }}>{err}</div>}
        <Field label="Email" type="email" placeholder="name@studio.com" value={email} onChange={e => setEmail(e.target.value)} iconLeft={<Ic n="mail" s={15} />} />
        <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} iconLeft={<Ic n="lock" s={15} />} />
        <Button type="submit" variant="solid" size="md" fullWidth disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </AuthShell>
  );
}
window.Login = Login;

function Register() {
  const { Button, Checkbox } = window.LatticeDesignSystem_e801cb;
  const { register } = useAuth();
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [agree, setAgree] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!agree) { setErr('Please accept the terms to continue.'); return; }
    if (form.password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setBusy(true);
    try {
      const u = await register(form);
      toast({ tone: 'success', title: 'Account created', message: u.name });
      navigate('/projects');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start designing structure — free, no card required."
      footer={<span>Already have an account? <a href="#/login" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Sign in</a></span>}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {err && <div style={{ fontSize: 12.5, color: 'var(--status-danger-fg)', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-fg)', padding: '8px 10px' }}>{err}</div>}
        <Field label="Full name" placeholder="Rin Sato" value={form.name} onChange={set('name')} iconLeft={<Ic n="user" s={15} />} />
        <Field label="Email" type="email" placeholder="name@studio.com" value={form.email} onChange={set('email')} iconLeft={<Ic n="mail" s={15} />} />
        <Field label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} iconLeft={<Ic n="lock" s={15} />} hint="Use 8 or more characters." />
        <Checkbox label="I agree to the terms and privacy policy" checked={agree} onChange={setAgree} />
        <Button type="submit" variant="solid" size="md" fullWidth disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
window.Register = Register;
