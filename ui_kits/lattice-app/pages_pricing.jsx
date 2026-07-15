/* global React, Container, Eyebrow, PlanToggle, PricingCard, Ic, api, navigate, useAuth, toast */
function Subscription() {
  const { user, loginWithGitHub } = useAuth();
  const [plans, setPlans] = React.useState([]);
  const [cycle, setCycle] = React.useState('monthly');
  const [current, setCurrent] = React.useState(null);

  React.useEffect(() => {
    api.plans().then(r => setPlans(r.plans)).catch(() => {});
    if (user) api.subscription().then(r => setCurrent(r.subscription)).catch(() => {});
  }, [user]);

  // Plans are view-only. The only actionable case is a logged-out visitor on Free → sign in.
  const choose = (plan) => {
    if (!user) { loginWithGitHub(); return; }
  };

  const faqs = [
    ['Can I change plans?', 'Plans are currently managed by Lattice — every account runs on the Free plan. Reach out if you need more room.'],
    ['Is there a free plan?', 'Yes. Free is the default for every account: one project and two pages, with local export.'],
    ['What does annual billing save?', 'Annual billing is roughly two months free compared with paying monthly.'],
    ['Do you offer team pricing?', 'The Team plan covers up to 20 members with shared components, roles, and SSO.'],
  ];

  return (
    <div>
      <Container style={{ paddingTop: 64, textAlign: 'center' }}>
        <Eyebrow style={{ display: 'inline-block' }}>Pricing</Eyebrow>
        <h1 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 'clamp(34px,4vw,52px)', letterSpacing: '-0.02em', margin: '10px 0 8px' }}>
          Simple, structural pricing.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 26px' }}>
          Start free. Upgrade when your structure grows. Every plan includes the full canvas editor.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 34 }}>
          <PlanToggle cycle={cycle} onChange={setCycle} />
        </div>
      </Container>

      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          {plans.map(p => (
            <PricingCard key={p.id} plan={p} cycle={cycle} featured={p.id === 'pro'}
              current={current && current.plan_id === p.id}
              locked={p.price_monthly > 0} loggedIn={!!user} onChoose={choose} />
          ))}
        </div>
      </Container>

      <Container style={{ paddingTop: 80, maxWidth: 760 }}>
        <h2 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 30, letterSpacing: '-0.02em', marginBottom: 22 }}>Questions</h2>
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {faqs.map(([q, a]) => (
            <div key={q} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '18px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
window.Subscription = Subscription;
