/* global React, GlobalFX, Toaster, LoginPage, RegisterPage, DashboardPage, useRoute, useSession, go */
// Root: tiny hash router across the three pages + global FX/toaster. Exposes window.ShowcaseApp.

function ShowcaseApp() {
  const route = useRoute();
  const user = useSession();

  // Redirect rules: unknown → login; /dashboard requires a session; authed at an auth page → dashboard.
  React.useEffect(() => {
    if (route === '/dashboard' && !user) { go('/login'); return; }
    if ((route === '/login' || route === '/register' || route === '/') && user) { go('/dashboard'); return; }
    if (route !== '/login' && route !== '/register' && route !== '/dashboard') { go(user ? '/dashboard' : '/login'); }
  }, [route, user]);

  let page = null;
  if (route === '/register') page = <RegisterPage />;
  else if (route === '/dashboard') page = <DashboardPage />;
  else page = <LoginPage />;

  return (
    <React.Fragment>
      <GlobalFX />
      {page}
      <Toaster />
    </React.Fragment>
  );
}
window.ShowcaseApp = ShowcaseApp;
