/* global React */
// Showcase — shared plumbing for the 3-page demo (login / register / dashboard).
// Self-contained: no backend. Session lives in localStorage so the whole login→dashboard→logout
// flow works against the real Lattice Design System bundle with nothing but a static file server.
//
// Conventions (match ui_kits/lattice-app): globals not ESM. Top-level `function X(){}` becomes a
// shared global; DS primitives are destructured inside each component from window.LatticeDesignSystem_e801cb.
// NEVER use object-rest destructuring (`const {a, ...b} = o`) — the in-browser Babel emits a top-level
// `const _excluded` that collides across scripts in the shared global scope.

// ---------------------------------------------------------------------------
// Lucide: fill-in-place rescan, debounced to one animation frame. Every <i data-lucide> that
// mounts schedules a single rescan so React keeps owning the <i> (see the Lucide gotcha in memory).
var SC_liTimer = null;
function scheduleLucide() {
  if (SC_liTimer) return;
  SC_liTimer = requestAnimationFrame(function () {
    SC_liTimer = null;
    if (window.renderLucideIcons) window.renderLucideIcons();
  });
}
window.scheduleLucide = scheduleLucide;

function Ic({ n, s = 16, style }) {
  React.useLayoutEffect(() => { scheduleLucide(); });
  return <i data-lucide={n} style={{ width: s, height: s, display: 'inline-flex', flex: 'none', ...style }}></i>;
}
window.Ic = Ic;

// ---------------------------------------------------------------------------
// Session store (external store → useSyncExternalStore for a stable snapshot).
var SC_SESSION_KEY = 'lattice_showcase_user';
function scReadSession() { try { return JSON.parse(localStorage.getItem(SC_SESSION_KEY) || 'null'); } catch (e) { return null; } }
var SC_session = scReadSession();
var SC_sessionSubs = new Set();
function scSetSession(u) {
  SC_session = u || null;
  if (SC_session) localStorage.setItem(SC_SESSION_KEY, JSON.stringify(SC_session));
  else localStorage.removeItem(SC_SESSION_KEY);
  SC_sessionSubs.forEach(function (fn) { fn(); });
}
function useSession() {
  return React.useSyncExternalStore(
    function (fn) { SC_sessionSubs.add(fn); return function () { SC_sessionSubs.delete(fn); }; },
    function () { return SC_session; }
  );
}
window.useSession = useSession;
window.scSetSession = scSetSession;

// ---------------------------------------------------------------------------
// Hash router — routes are bare paths: /login, /register, /dashboard.
function scParseHash() { return (window.location.hash.replace(/^#/, '').split('?')[0]) || '/login'; }
var SC_route = scParseHash();
var SC_routeSubs = new Set();
window.addEventListener('hashchange', function () {
  SC_route = scParseHash();
  SC_routeSubs.forEach(function (fn) { fn(); });
  window.scrollTo(0, 0);
});
function useRoute() {
  return React.useSyncExternalStore(
    function (fn) { SC_routeSubs.add(fn); return function () { SC_routeSubs.delete(fn); }; },
    function () { return SC_route; }
  );
}
function go(path) {
  if (('#' + path) !== window.location.hash) window.location.hash = path;
  else window.dispatchEvent(new HashChangeEvent('hashchange'));
}
window.useRoute = useRoute;
window.go = go;

// ---------------------------------------------------------------------------
// Toasts — reuse the DS Toast, stacked bottom-right, auto-dismiss.
function toast(opts) { window.dispatchEvent(new CustomEvent('sc-toast', { detail: opts || {} })); }
window.toast = toast;

function Toaster() {
  const { Toast } = window.LatticeDesignSystem_e801cb;
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const on = (e) => {
      const id = Math.random().toString(36).slice(2);
      const item = Object.assign({ id, tone: 'neutral' }, e.detail);
      setItems((t) => t.concat([item]));
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), e.detail && e.detail.duration ? e.detail.duration : 3600);
    };
    window.addEventListener('sc-toast', on);
    return () => window.removeEventListener('sc-toast', on);
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 600, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((t) => (
        <div key={t.id} className="sc-toast-in">
          <Toast tone={t.tone} title={t.title} message={t.message}
            onClose={() => setItems((x) => x.filter((y) => y.id !== t.id))} />
        </div>
      ))}
    </div>
  );
}
window.Toaster = Toaster;

// ---------------------------------------------------------------------------
// Entrance reveal — staggered fade-up. Delay in ms.
function Reveal({ delay = 0, children, style, tag = 'div' }) {
  const Tag = tag;
  return <Tag className="sc-reveal" style={{ animationDelay: delay + 'ms', ...style }}>{children}</Tag>;
}
window.Reveal = Reveal;

// Count-up hook for animated stats.
function useCountUp(target, dur = 900) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let raf; const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}
window.useCountUp = useCountUp;

// ---------------------------------------------------------------------------
// Brand chrome.
function LatticeMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.3" opacity="0.32">
        <path d="M5 5h14M5 12h14M5 19h14" />
        <path d="M5 5v14M12 5v14M19 5v14" />
      </g>
      <g fill="currentColor">
        <circle cx="5" cy="5" r="1.5" /><circle cx="19" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="2.1" />
        <circle cx="5" cy="19" r="1.5" /><circle cx="19" cy="19" r="1.5" />
      </g>
    </svg>
  );
}
window.LatticeMark = LatticeMark;

function Wordmark({ size = 20, onClick }) {
  return (
    <a href="#/login" onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
      <LatticeMark size={size + 3} />
      <span style={{ fontFamily: 'var(--font-serif-display)', fontSize: size, letterSpacing: '-0.01em' }}>Lattice</span>
    </a>
  );
}
window.Wordmark = Wordmark;

function Eyebrow({ children, style }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-muted)', ...style }}>
      {children}
    </div>
  );
}
window.Eyebrow = Eyebrow;

function Serif({ children, size = 28, italic = false, style }) {
  return (
    <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: size, lineHeight: 1.1, letterSpacing: '-0.02em', fontStyle: italic ? 'italic' : 'normal', color: 'var(--text-primary)', ...style }}>
      {children}
    </div>
  );
}
window.Serif = Serif;

// A soft full-bleed lattice-grid backdrop with a slow radial glow — atmosphere behind every page.
function LatticeBG({ children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-app)', overflow: 'hidden' }}>
      <div className="lattice-grid sc-grid-drift" style={{ position: 'absolute', inset: '-40px', opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: '-20%', left: '50%', width: 900, height: 900, transform: 'translateX(-50%)', background: 'radial-gradient(closest-side, rgba(108,147,214,0.06), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
window.LatticeBG = LatticeBG;

// Password field: DS Input + an overlaid show/hide IconButton (also exercises Tooltip).
function PasswordField(props) {
  const { Input, IconButton, Tooltip } = window.LatticeDesignSystem_e801cb;
  const [show, setShow] = React.useState(false);
  const p = Object.assign({}, props);
  delete p.onChange; delete p.value; delete p.label; delete p.hint; delete p.error; delete p.placeholder;
  return (
    <div style={{ position: 'relative' }}>
      <Input
        label={props.label} hint={props.hint} error={props.error} placeholder={props.placeholder}
        type={show ? 'text' : 'password'} value={props.value} onChange={props.onChange}
        iconLeft={<Ic n="lock" s={15} />} style={{ paddingRight: 30 }} {...p}
      />
      <div style={{ position: 'absolute', right: 4, bottom: props.error || props.hint ? 27 : 5 }}>
        <Tooltip label={show ? 'Hide password' : 'Show password'} side="left">
          <IconButton size="sm" title="" onClick={() => setShow((s) => !s)}>
            <Ic n={show ? 'eye-off' : 'eye'} s={15} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
window.PasswordField = PasswordField;

// Password strength (0..4) + label/tone for a Badge.
function scorePassword(pw) {
  if (!pw) return { score: 0, label: 'Empty', tone: 'neutral', pct: 0 };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: 'Too short', tone: 'danger' },
    { label: 'Weak', tone: 'danger' },
    { label: 'Fair', tone: 'warning' },
    { label: 'Good', tone: 'info' },
    { label: 'Strong', tone: 'success' },
  ];
  return Object.assign({ score: s, pct: (s / 4) * 100 }, map[s]);
}
window.scorePassword = scorePassword;

// Small labelled divider — "or continue with".
function OrDivider({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}
window.OrDivider = OrDivider;

// Inline error banner using the danger tokens.
function ErrorBanner({ children, shake }) {
  if (!children) return null;
  return (
    <div className={shake ? 'sc-shake' : ''} style={{
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
      color: 'var(--status-danger-fg)', background: 'var(--status-danger-bg)',
      border: '1px solid var(--status-danger-fg)', padding: '9px 11px',
    }}>
      <Ic n="alert-triangle" s={15} /> <span>{children}</span>
    </div>
  );
}
window.ErrorBanner = ErrorBanner;

// The chip row at the foot of each page that documents which DS components are live here — doubles
// as a Tag/Badge exercise and as a manifest of coverage for the "make sure everything works" goal.
function ComponentsUsed({ list }) {
  const { Badge } = window.LatticeDesignSystem_e801cb;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
      <Badge tone="info">{list.length} components live</Badge>
      {list.map((c) => (
        <span key={c} style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em', color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)', padding: '2px 6px', background: 'var(--surface)',
        }}>{c}</span>
      ))}
    </div>
  );
}
window.ComponentsUsed = ComponentsUsed;

// Global keyframes + a few utility classes, injected once at the app root.
function GlobalFX() {
  return (
    <style>{`
      .sc-reveal { animation: scRevUp var(--dur-slow) var(--ease-out) both; }
      @keyframes scRevUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      .sc-page { animation: scPageIn 320ms var(--ease-out) both; }
      @keyframes scPageIn { from { opacity: 0; } to { opacity: 1; } }
      .sc-toast-in { animation: scToastIn var(--dur-base) var(--ease-out) both; }
      @keyframes scToastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
      .sc-shake { animation: scShake 360ms cubic-bezier(.36,.07,.19,.97) both; }
      @keyframes scShake { 10%,90%{transform:translateX(-1px)} 20%,80%{transform:translateX(2px)} 30%,50%,70%{transform:translateX(-4px)} 40%,60%{transform:translateX(4px)} }
      .sc-dialog-in { animation: scDialogIn var(--dur-base) var(--ease-out) both; }
      @keyframes scDialogIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
      .sc-grid-drift { animation: scDrift 40s linear infinite; }
      @keyframes scDrift { from { background-position: 0 0; } to { background-position: 48px 48px; } }
      .sc-raise { transition: transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out); }
      .sc-raise:hover { transform: translateY(-3px); border-color: var(--border-default) !important; }
      .sc-social { transition: transform var(--dur-fast) var(--ease-out); }
      .sc-social:hover { transform: translateY(-2px); }
      .sc-bar { transform-origin: bottom; animation: scBar 700ms var(--ease-out) both; }
      @keyframes scBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      .sc-link { color: var(--text-primary); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--border-strong); transition: border-color var(--dur-fast) var(--ease-out); }
      .sc-link:hover { border-color: var(--text-primary); }
      .sc-underline { position: relative; }
      .sc-tabpane { animation: scRevUp 260ms var(--ease-out) both; }
      .sc-pulse { animation: scPulse 2.4s ease-in-out infinite; }
      @keyframes scPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
      @media (prefers-reduced-motion: reduce) {
        .sc-reveal, .sc-page, .sc-toast-in, .sc-shake, .sc-dialog-in, .sc-grid-drift, .sc-bar, .sc-tabpane, .sc-pulse { animation: none !important; }
      }
    `}</style>
  );
}
window.GlobalFX = GlobalFX;
