/* global React, GlobalFX, Toaster, LoginPage, RegisterPage, DashboardPage, MenusGallery, MenuPreviewPage, useRoute, useSession, go */
// Root: tiny hash router across the pages + global FX/toaster. Exposes window.ShowcaseApp.

function ShowcaseApp() {
  const route = useRoute();
  const user = useSession();

  // The menu-style gallery + previews are public (no session needed), so they bypass the auth guard.
  const isMenus = route === '/menus' || route.indexOf('/menu/') === 0;

  // Redirect rules: unknown → login; /dashboard requires a session; authed at an auth page → dashboard.
  React.useEffect(() => {
    if (isMenus) return;
    if (route === '/dashboard' && !user) { go('/login'); return; }
    if ((route === '/login' || route === '/register' || route === '/') && user) { go('/dashboard'); return; }
    if (route !== '/login' && route !== '/register' && route !== '/dashboard') { go(user ? '/dashboard' : '/login'); }
  }, [route, user, isMenus]);

  let page = null;
  if (route === '/menus') page = <MenusGallery />;
  else if (route.indexOf('/menu/') === 0) page = <MenuPreviewPage id={route.slice('/menu/'.length)} />;
  else if (route === '/register') page = <RegisterPage />;
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
