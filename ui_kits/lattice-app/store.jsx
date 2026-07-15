/* global React, api */
// Auth store, hash router, and toast helpers — all attached to window for the no-build setup.

// --- Auth context ---
const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.me().then(r => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const value = {
    user, loading,
    loginWithGitHub: () => { window.location.href = '/api/auth/github'; },
    logout: async () => { try { await api.logout(); } catch (e) {} setUser(null); window.navigate('/'); },
    refresh: async () => { try { const r = await api.me(); setUser(r.user); } catch (e) { setUser(null); } },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
window.AuthContext = AuthContext;
window.AuthProvider = AuthProvider;
window.useAuth = () => React.useContext(AuthContext);

// --- Hash router ---
function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, q] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(q || '') };
}
window.navigate = (to) => { if (('#' + to) !== window.location.hash) window.location.hash = to; else window.dispatchEvent(new HashChangeEvent('hashchange')); };
window.useHashRoute = () => {
  const [route, setRoute] = React.useState(parseHash);
  React.useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
};

// --- Toasts (reuse the DS Toast) ---
window.toast = (opts) => window.dispatchEvent(new CustomEvent('lattice-toast', { detail: opts || {} }));

function Toaster() {
  const { Toast } = window.LatticeDesignSystem_e801cb;
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const on = (e) => {
      const id = Math.random().toString(36).slice(2);
      setItems(t => [...t, { id, tone: 'neutral', ...e.detail }]);
      setTimeout(() => setItems(t => t.filter(x => x.id !== id)), 3600);
    };
    window.addEventListener('lattice-toast', on);
    return () => window.removeEventListener('lattice-toast', on);
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(t => (
        <Toast key={t.id} tone={t.tone} title={t.title} message={t.message}
          onClose={() => setItems(x => x.filter(y => y.id !== t.id))} />
      ))}
    </div>
  );
}
window.Toaster = Toaster;
