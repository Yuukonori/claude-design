/* global React, AuthShell, GitHubMark, useAuth, useHashRoute */
// GitHub is the only way in. Both /login and /register render this screen.
function GitHubAuth({ mode }) {
  const { Button } = window.LatticeDesignSystem_e801cb;
  const { loginWithGitHub } = useAuth();
  const route = useHashRoute();
  const error = route.query.get('error');
  const isRegister = mode === 'register';

  return (
    <AuthShell
      title={isRegister ? 'Create your account' : 'Sign in'}
      subtitle={isRegister
        ? 'Start designing structure — sign up with GitHub in one click.'
        : 'Welcome back. Continue with your GitHub account.'}
      footer={<span>Lattice uses GitHub for sign-in. New accounts start on the <strong style={{ color: 'var(--text-primary)' }}>Free</strong> plan.</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--status-danger-fg)', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-fg)', padding: '8px 10px' }}>
            {error}
          </div>
        )}
        <Button type="button" variant="solid" size="md" fullWidth onClick={loginWithGitHub} iconLeft={<GitHubMark s={16} />}>
          Continue with GitHub
        </Button>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          We only read your public profile and email to create your account.
        </div>
      </div>
    </AuthShell>
  );
}

function Login() { return <GitHubAuth mode="login" />; }
function Register() { return <GitHubAuth mode="register" />; }
window.Login = Login;
window.Register = Register;
