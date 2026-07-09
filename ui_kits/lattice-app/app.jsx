/* global React, AuthProvider, useAuth, useHashRoute, Toaster, Navbar, Footer, FullLoader, navigate, Home, Login, Register, Subscription, Projects, Account, Billing, Team, Market, Plugins, Library */

const AUTH_PAGES = ['/login', '/register'];
const APP_ROUTES = ['/projects', '/account', '/billing', '/team', '/market', '/plugins', '/library'];

function NotFound() {
  const { Button } = window.LatticeDesignSystem_e801cb;
  return (
    <div style={{ minHeight: '68vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 56, letterSpacing: '-0.02em' }}>404</div>
      <div style={{ color: 'var(--text-muted)' }}>That page doesn't exist.</div>
      <Button variant="outline" size="sm" onClick={() => navigate('/')}>Back home</Button>
    </div>
  );
}

function renderPage(path) {
  switch (path) {
    case '/': return <Home />;
    case '/pricing': return <Subscription />;
    case '/login': return <Login />;
    case '/register': return <Register />;
    case '/projects': return <Projects />;
    case '/account': return <Account />;
    case '/billing': return <Billing />;
    case '/team': return <Team />;
    case '/market': return <Market />;
    case '/plugins': return <Plugins />;
    case '/library': return <Library />;
    default: return <NotFound />;
  }
}

function Shell() {
  const route = useHashRoute();
  const { user, loading } = useAuth();
  const path = route.path;

  // Re-render Lucide glyphs after each route/render (fill-in-place; safe & idempotent).
  React.useEffect(() => {
    const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 40);
    return () => clearTimeout(t);
  });

  // Route guards
  React.useEffect(() => {
    if (loading) return;
    if (APP_ROUTES.includes(path) && !user) navigate('/login');
    else if (AUTH_PAGES.includes(path) && user) navigate('/projects');
  }, [path, user, loading]);

  if (loading) return <FullLoader />;

  const page = renderPage(path);
  if (AUTH_PAGES.includes(path)) return page;                 // full-screen auth
  if (APP_ROUTES.includes(path)) return user ? page : <FullLoader />; // pages include AppShell
  return <><Navbar user={user} />{page}<Footer /></>;         // marketing
}

function ProductApp() {
  return (
    <AuthProvider>
      <Shell />
      <Toaster />
    </AuthProvider>
  );
}
window.ProductApp = ProductApp;
