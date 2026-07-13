/* global React, Ic, LatticeBG, Reveal, Eyebrow, Serif, Wordmark, go */
// Menu styles — a click-to-preview gallery of 9 single-active menus (3 sidebar, 3 tab bar, 3 pill
// bar). Each family component owns its own active index + animated indicator, so every menu is live.
// Conventions match showcase_core.jsx: globals not ESM, DS primitives off window.LatticeDesignSystem_e801cb,
// and NEVER object-rest destructuring (`const {a, ...b}`) — the in-browser Babel `_excluded` collides.

var SC_INK = '#3b2f96'; // sidebar indigo
var SC_AC = '#4f46e5';  // accent for tabs / pills

// One <style> per menu page — concave caps, moving indicators, transitions. Rendered once by the
// gallery / preview pages.
function SC_MenuStyles() {
  return (
    <style>{`
      .scm-side { position: relative; background: ${SC_INK}; border-radius: 20px; padding: 12px 0; display: flex; flex-direction: column; }
      .scm-menu { position: relative; }
      .scm-ind { position: absolute; left: 0; right: 0; z-index: 0; transition: transform .32s cubic-bezier(.4,0,.2,1); }
      .scm-pill { position: absolute; right: 0; top: 6px; bottom: 6px; width: 66%; background: #fff; border-radius: 14px 0 0 14px; }
      .scm-cap { position: absolute; right: 0; width: 14px; height: 14px; background: #fff; }
      .scm-cap.t { top: -7px; } .scm-cap.b { bottom: -7px; }
      .scm-cap.t:after, .scm-cap.b:after { content: ''; position: absolute; inset: 0; background: ${SC_INK}; }
      .scm-cap.t:after { border-bottom-right-radius: 14px; } .scm-cap.b:after { border-top-right-radius: 14px; }
      .scm-item { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; width: 100%; background: transparent; border: 0; color: rgba(255,255,255,.82); cursor: pointer; transition: color .2s; }
      .scm-item:hover { color: #fff; }
      .scm-item.on { color: ${SC_INK}; }
      .scm-bar-row { display: flex; align-items: center; gap: 12px; padding: 0 16px; height: 46px; color: rgba(255,255,255,.72); cursor: pointer; border-left: 3px solid transparent; font-size: 13px; transition: background .2s, color .2s, border-color .2s; }
      .scm-bar-row:hover { color: #fff; }
      .scm-bar-row.on { color: #fff; background: rgba(255,255,255,.10); border-left-color: #fff; }
      .scm-tabs { position: relative; display: flex; }
      .scm-tab { flex: 1; text-align: center; padding: 10px 14px; font-size: 13px; color: var(--text-muted); cursor: pointer; background: transparent; border: 0; white-space: nowrap; transition: color .2s; }
      .scm-tab.on { color: var(--text-primary); font-weight: 500; }
      .scm-underline { position: absolute; bottom: 0; height: 2px; background: ${SC_AC}; transition: transform .3s cubic-bezier(.4,0,.2,1); }
      .scm-tabf { flex: 1; text-align: center; padding: 9px 14px; font-size: 13px; color: var(--text-muted); cursor: pointer; background: transparent; border: 0; border-radius: 10px; transition: background .2s, color .2s; }
      .scm-tabf.on { background: ${SC_AC}; color: #fff; }
      .scm-seg { position: relative; display: flex; background: var(--surface-hover); border-radius: 10px; padding: 3px; }
      .scm-seg-knob { position: absolute; top: 3px; bottom: 3px; background: var(--surface); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: left .3s cubic-bezier(.4,0,.2,1); }
      .scm-seg-item { position: relative; z-index: 1; flex: 1; text-align: center; padding: 7px 14px; font-size: 12.5px; color: var(--text-muted); cursor: pointer; background: transparent; border: 0; transition: color .2s; }
      .scm-seg-item.on { color: var(--text-primary); font-weight: 500; }
      .scm-pills { display: flex; flex-wrap: wrap; gap: 8px; }
      .scm-chip { padding: 7px 15px; border-radius: 999px; font-size: 12.5px; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--text-muted); transition: background .2s, color .2s, border-color .2s; }
      .scm-chip:hover { color: var(--text-secondary); }
      .scm-chip.solid.on { background: ${SC_AC}; color: #fff; }
      .scm-chip.outline.on { border-color: ${SC_AC}; color: ${SC_AC}; }
      .scm-chip.soft.on { background: color-mix(in srgb, ${SC_AC} 16%, transparent); color: ${SC_AC}; }
    `}</style>
  );
}
window.SC_MenuStyles = SC_MenuStyles;

// --- Sidebar (vertical): variants pill | notch | bar --------------------------------------------
function SC_Sidebar({ variant, items, interactive }) {
  const [active, setActive] = React.useState(0);
  const pick = (i) => { if (interactive !== false) setActive(i); };
  if (variant === 'bar') {
    return (
      <div className="scm-side" style={{ width: 200 }}>
        <div style={{ padding: '0 16px 12px', color: '#fff', fontWeight: 600, fontSize: 14 }}>CIMac</div>
        <div className="scm-menu">
          {items.map((it, i) => (
            <div key={i} className={'scm-bar-row' + (i === active ? ' on' : '')} onClick={() => pick(i)}>
              <Ic n={it.icon} s={17} /><span>{it.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const H = 52;
  return (
    <div className="scm-side" style={{ width: 84 }}>
      <div style={{ textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>CI</div>
      <div className="scm-menu" style={{ height: items.length * H }}>
        <div className="scm-ind" style={{ height: H, transform: 'translateY(' + active * H + 'px)' }}>
          <span className="scm-pill" />
          {variant === 'notch' && <span className="scm-cap t" />}
          {variant === 'notch' && <span className="scm-cap b" />}
        </div>
        {items.map((it, i) => (
          <button key={i} type="button" aria-label={it.label} className={'scm-item' + (i === active ? ' on' : '')}
            style={{ height: H }} onClick={() => pick(i)}>
            <Ic n={it.icon} s={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
window.SC_Sidebar = SC_Sidebar;

// --- Tab bar (horizontal): variants underline | filled | segmented ------------------------------
function SC_TabBar({ variant, items, interactive }) {
  const [active, setActive] = React.useState(0);
  const n = items.length;
  const pick = (i) => { if (interactive !== false) setActive(i); };
  if (variant === 'filled') {
    return (
      <div className="scm-tabs" style={{ minWidth: 320, gap: 6, background: 'var(--surface-card)', padding: 6, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        {items.map((t, i) => (
          <button key={i} type="button" className={'scm-tabf' + (i === active ? ' on' : '')} onClick={() => pick(i)}>{t}</button>
        ))}
      </div>
    );
  }
  if (variant === 'segmented') {
    return (
      <div className="scm-seg" style={{ minWidth: 340 }}>
        <div className="scm-seg-knob" style={{ width: 'calc((100% - 6px) / ' + n + ')', left: 'calc(3px + ' + active + ' * ((100% - 6px) / ' + n + '))' }} />
        {items.map((t, i) => (
          <button key={i} type="button" className={'scm-seg-item' + (i === active ? ' on' : '')} onClick={() => pick(i)}>{t}</button>
        ))}
      </div>
    );
  }
  // underline
  return (
    <div style={{ minWidth: 340 }}>
      <div className="scm-tabs">
        {items.map((t, i) => (
          <button key={i} type="button" className={'scm-tab' + (i === active ? ' on' : '')} onClick={() => pick(i)}>{t}</button>
        ))}
        <div className="scm-underline" style={{ width: (100 / n) + '%', transform: 'translateX(' + active * 100 + '%)' }} />
      </div>
      <div style={{ height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}
window.SC_TabBar = SC_TabBar;

// --- Pill bar (chips): variants solid | outline | soft ------------------------------------------
function SC_PillBar({ variant, items, interactive }) {
  const [active, setActive] = React.useState(0);
  const pick = (i) => { if (interactive !== false) setActive(i); };
  return (
    <div className="scm-pills" style={{ maxWidth: 380, justifyContent: 'center' }}>
      {items.map((t, i) => (
        <button key={i} type="button" className={'scm-chip ' + variant + (i === active ? ' on' : '')} onClick={() => pick(i)}>{t}</button>
      ))}
    </div>
  );
}
window.SC_PillBar = SC_PillBar;

// --- Catalog + dispatcher -----------------------------------------------------------------------
var SC_SIDEBAR_ITEMS = [
  { icon: 'layout-grid', label: 'Dashboard' },
  { icon: 'folder', label: 'Files' },
  { icon: 'chart-bar', label: 'Reports' },
  { icon: 'settings', label: 'Settings' },
  { icon: 'shield', label: 'Security' },
  { icon: 'mail', label: 'Messages' },
];
var SC_TAB_ITEMS = ['Overview', 'Activity', 'Reports', 'Settings'];
var SC_PILL_ITEMS = ['All', 'Design', 'Code', 'Prototype', 'Handoff'];

var SC_MENU_CATALOG = [
  { id: 'sidebar-pill', family: 'Sidebar', name: 'Pill', desc: 'A white pill slides to the active item.' },
  { id: 'sidebar-notch', family: 'Sidebar', name: 'Notch', desc: 'A concave notch carved into the rail.' },
  { id: 'sidebar-bar', family: 'Sidebar', name: 'Rail', desc: 'Left accent bar with icon + label.' },
  { id: 'tabs-underline', family: 'Tab bar', name: 'Underline', desc: 'A sliding underline tracks the tab.' },
  { id: 'tabs-filled', family: 'Tab bar', name: 'Filled', desc: 'The active tab gets a solid fill.' },
  { id: 'tabs-segmented', family: 'Tab bar', name: 'Segmented', desc: 'An iOS-style segmented control.' },
  { id: 'pills-solid', family: 'Pill bar', name: 'Solid', desc: 'The active chip fills with accent.' },
  { id: 'pills-outline', family: 'Pill bar', name: 'Outline', desc: 'The active chip gains a ring.' },
  { id: 'pills-soft', family: 'Pill bar', name: 'Soft', desc: 'The active chip is softly tinted.' },
];
window.SC_MENU_CATALOG = SC_MENU_CATALOG;

function SC_renderMenu(id, interactive) {
  var parts = id.split('-');
  if (parts[0] === 'sidebar') return <SC_Sidebar variant={parts[1]} items={SC_SIDEBAR_ITEMS} interactive={interactive} />;
  if (parts[0] === 'tabs') return <SC_TabBar variant={parts[1]} items={SC_TAB_ITEMS} interactive={interactive} />;
  return <SC_PillBar variant={parts[1]} items={SC_PILL_ITEMS} interactive={interactive} />;
}

// --- Gallery (grid of cards, click a card → full-screen preview) --------------------------------
function MenusGallery() {
  return (
    <LatticeBG>
      <SC_MenuStyles />
      <div className="sc-page" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={20} />
          <a href="#/login" className="sc-link" style={{ fontSize: 12.5 }} onClick={(e) => { e.preventDefault(); go('/login'); }}>Back to sign in</a>
        </div>
        <div style={{ marginTop: 30, maxWidth: 640 }}>
          <Reveal delay={20}><Eyebrow>Menu styles</Eyebrow></Reveal>
          <Reveal delay={80}><Serif size={34} style={{ marginTop: 10 }}>Nine ways to move the highlight.</Serif></Reveal>
          <Reveal delay={130}><p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>Single-active menus for sidebars, tab bars and pill bars. Click any card to preview it full-size and interactive.</p></Reveal>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 30 }}>
          {SC_MENU_CATALOG.map((m, idx) => {
            const scale = m.family === 'Sidebar' ? 0.46 : 0.94;
            return (
              <Reveal key={m.id} delay={170 + idx * 40}>
                {/* Card is a div (not a button): the live menu previews inside contain their own
                    <button> items, and nesting buttons is invalid HTML. */}
                <div role="button" tabIndex={0} onClick={() => go('/menu/' + m.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('/menu/' + m.id); } }}
                  className="sc-raise"
                  style={{ textAlign: 'left', cursor: 'pointer', width: '100%', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', padding: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ pointerEvents: 'none', transform: 'scale(' + scale + ')' }}>{SC_renderMenu(m.id, false)}</div>
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{m.family} · {m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
                    </div>
                    <Ic n="arrow-right" s={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </LatticeBG>
  );
}
window.MenusGallery = MenusGallery;

// --- Full-screen preview of a single style ------------------------------------------------------
function MenuPreviewPage({ id }) {
  const m = SC_MENU_CATALOG.find((x) => x.id === id);
  React.useEffect(() => { if (!m) go('/menus'); }, [m]);
  if (!m) return null;
  return (
    <LatticeBG>
      <SC_MenuStyles />
      <div className="sc-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px' }}>
          <button type="button" onClick={() => go('/menus')} className="sc-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 0, cursor: 'pointer', fontSize: 13 }}>
            <Ic n="arrow-left" s={16} /> Back to gallery
          </button>
          <Wordmark size={18} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: '0 24px 48px' }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <Reveal delay={20}><Eyebrow>{m.family}</Eyebrow></Reveal>
            <Reveal delay={70}><Serif size={30} style={{ marginTop: 8 }}>{m.name}</Serif></Reveal>
            <Reveal delay={120}><p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>{m.desc} Click the items — one stays active at a time.</p></Reveal>
          </div>
          <Reveal delay={180}>
            <div style={{ transform: m.family === 'Sidebar' ? 'scale(1.15)' : 'scale(1.28)', margin: m.family === 'Sidebar' ? '24px 0' : '8px 0' }}>
              {SC_renderMenu(m.id, true)}
            </div>
          </Reveal>
        </div>
      </div>
    </LatticeBG>
  );
}
window.MenuPreviewPage = MenuPreviewPage;
