/* global React, Container, Eyebrow, Ic, EditorPreview, FeatureCard, navigate, useAuth */
function Home() {
  const { Button, Badge } = window.LatticeDesignSystem_e801cb;
  const { user } = useAuth();
  const features = [
    ['layout-grid', 'Structure-first canvas', 'Place component nodes on an infinite lattice grid. Pan, zoom, marquee-select, snap, and align — built for density.'],
    ['git-branch', 'Relationships as data', 'Model parent/child and binding edges between nodes. The graph — not guesswork — drives layout and output.'],
    ['code-2', 'Generate real code', 'Turn the graph into clean React + TypeScript and CSS. Copy or export per page, one file at a time.'],
    ['component', 'A real component library', 'Compose from buttons, inputs, dialogs, tabs and more — every primitive drawn from one monochrome system.'],
    ['smartphone', 'Responsive by intent', 'Mark nodes responsive, clip, or locked. Preview the composed layout as real UI, then keep editing.'],
    ['users', 'Made for teams', 'Share projects, manage members and roles, and keep everyone on the same source of structure.'],
  ];
  const steps = [
    ['Place', 'Drag primitives onto the canvas and arrange the skeleton of your screen.'],
    ['Connect', 'Draw relationships so the system understands nesting and bindings.'],
    ['Generate', 'Export production React from the graph — structure preserved.'],
  ];
  return (
    <div>
      {/* Hero */}
      <Container style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 48, alignItems: 'center' }} className="home-hero">
          <div>
            <div style={{ display: 'inline-flex' }}><Badge tone="info">New · Postgres-backed projects</Badge></div>
            <h1 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1.04, letterSpacing: '-0.03em', margin: '18px 0 0' }}>
              Design the <em style={{ fontStyle: 'italic' }}>structure</em>,<br />not just the surface.
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480, marginTop: 18 }}>
              Lattice is a canvas for designing UI as a graph of components — place nodes, map their
              relationships, and generate clean code from them.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
              <Button variant="solid" size="lg" onClick={() => navigate(user ? '/projects' : '/register')} iconRight={<Ic n="arrow-right" s={17} />}>
                {user ? 'Go to dashboard' : 'Start for free'}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/pricing')}>See pricing</Button>
            </div>
            <div style={{ marginTop: 18, fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No credit card · Free plan forever</div>
          </div>
          <EditorPreview />
        </div>
      </Container>

      {/* Features */}
      <Container style={{ paddingTop: 64 }}>
        <Eyebrow>Why Lattice</Eyebrow>
        <h2 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 34, letterSpacing: '-0.02em', margin: '10px 0 28px', maxWidth: 620 }}>
          A precise instrument for building interface structure.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {features.map(([icon, title, body]) => <FeatureCard key={title} icon={icon} title={title}>{body}</FeatureCard>)}
        </div>
      </Container>

      {/* How it works */}
      <Container style={{ paddingTop: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {steps.map(([t, d], i) => (
            <div key={t}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>0{i + 1}</div>
              <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 24, margin: '8px 0 6px' }}>{t}</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* CTA */}
      <Container style={{ paddingTop: 80 }}>
        <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', padding: '48px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 30, letterSpacing: '-0.02em' }}>Ready to design the structure?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Create a free account and open your first canvas in seconds.</div>
          </div>
          <Button variant="solid" size="lg" onClick={() => navigate(user ? '/projects' : '/register')} iconRight={<Ic n="arrow-right" s={17} />}>
            {user ? 'Open dashboard' : 'Get started'}
          </Button>
        </div>
      </Container>
      <style>{'@media(max-width:820px){.home-hero{grid-template-columns:1fr!important}}'}</style>
    </div>
  );
}
window.Home = Home;
