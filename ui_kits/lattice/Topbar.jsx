/* global React */
// Top bar — logo, breadcrumb, view tabs, collaborators, generate action.

// Track a CSS media query so the toolbar can shed low-priority chrome on small screens.
function useMediaQuery(query) {
  const read = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = React.useState(read);
  React.useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    on();
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on);
    return () => { m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on); };
  }, [query]);
  return matches;
}

const DEVICES = [
  ['desktop', 'monitor', 'Desktop'],
  ['tablet', 'tablet', 'Tablet'],
  ['mobile', 'smartphone', 'Mobile'],
  ['custom', 'ruler', 'Custom'],
];
const dimIn = { width: 46, height: 24, padding: '0 4px', border: '1px solid var(--border-default)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center', outline: 'none', boxSizing: 'border-box', MozAppearance: 'textfield' };

// VS Code-style page tab bar styles
const pageBarStyle = { height: 33, flex: 'none', display: 'flex', alignItems: 'stretch', background: 'var(--surface-inset)', borderBottom: '1px solid var(--border-subtle)' };
const pageTabStyle = (active, hovered) => ({
  position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7,
  height: '100%', padding: '0 6px 0 11px', maxWidth: 190, flex: 'none',
  borderRight: '1px solid var(--border-subtle)',
  background: active ? 'var(--surface)' : hovered ? 'var(--surface-hover)' : 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  boxShadow: active ? 'inset 0 2px 0 var(--blue-base)' : 'none',
  cursor: 'pointer', fontSize: 12.5, whiteSpace: 'nowrap', userSelect: 'none',
});
const pageCloseStyle = (show) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 17, height: 17,
  borderRadius: 4, border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', flex: 'none',
  opacity: show ? 0.8 : 0, pointerEvents: show ? 'auto' : 'none',
});
const pageAddStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 33, flex: 'none', border: 0, borderRight: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' };

function Topbar({ view, setView, pageName, projectName, saving, onBack, onHelp, previewMode, onTogglePreview, onRun, runState, onStop, onRestart, onPause, device, onSetDevice, responsive = true, desktopPreset, onSetDesktopPreset, artboard, orientation, onToggleOrientation, customSize, onSetCustomSize, onOpenSettings, onShare, onGenerate, dirty, onUndo, onRedo, canUndo, canRedo, aiOpen, onToggleAI }) {
  const DESKTOP_PRESETS = window.DESKTOP_PRESETS || [];
  const { IconButton, Tabs, Button, Tooltip } = window.LatticeDesignSystem_e801cb;
  // Progressive breakpoints — shed breadcrumb/readout chrome so the view tabs never collide.
  const compact = useMediaQuery('(max-width: 1280px)');
  const tight = useMediaQuery('(max-width: 1050px)');
  return (
    <header style={{
      height: 'var(--topbar-h)', flex: 'none', display: 'flex', alignItems: 'center',
      gap: 14, padding: '0 12px', borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '0 1 auto' }}>
        <span style={{ display: 'inline-flex', color: 'var(--text-primary)', flex: 'none' }}>
          <img src="../../assets/logo-mark.svg" alt="Lattice" style={{ height: 22, display: 'block' }} />
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden' }}>
          {onBack ? (
            <>
              <button type="button" onClick={onBack} title="Back to projects" style={{ display: 'inline-flex', alignItems: 'center', border: 0, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2, marginRight: 2, flex: 'none' }}>
                <i data-lucide="arrow-left" style={{ width: 15, height: 15 }}></i>
              </button>
              {!compact && <span onClick={onBack} style={{ cursor: 'pointer', flex: 'none' }}>Projects</span>}
              {!compact && <span style={{ color: 'var(--border-strong)', flex: 'none' }}>/</span>}
              {!tight && <span style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, minWidth: 0 }}>{projectName || 'Untitled project'}</span>}
              {!compact ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: saving ? 'var(--amber-base)' : 'var(--text-disabled)', flex: 'none' }}>{saving ? 'saving…' : 'saved'}</span>
              ) : saving && (
                <span title="Saving…" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber-base)', flex: 'none' }} />
              )}
            </>
          ) : (
            <>
              {!compact && <span style={{ flex: 'none' }}>Marketing site</span>}
              {!compact && <span style={{ color: 'var(--border-strong)', flex: 'none' }}>/</span>}
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{pageName}</span>
              {dirty && <span title="Unsaved changes" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber-base)', flex: 'none' }} />}
            </>
          )}
        </div>
      </div>

      <div style={{ marginLeft: compact ? 6 : 12, flex: 'none' }}>
        <Tabs value={view} onChange={setView} tabs={[
          { value: 'design', label: 'Design' },
          { value: 'code', label: 'Code' },
          { value: 'rel', label: tight ? 'Rel.' : 'Relationships' },
          { value: 'workflow', label: tight ? 'Flow' : 'Workflow' },
        ]} style={{ borderBottom: 0, flexWrap: 'nowrap' }} />
      </div>

      <div style={{ marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: compact ? 8 : 12 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <Tooltip label="Undo (Ctrl+Z)">
            <IconButton title="Undo" disabled={!canUndo} onClick={onUndo}>
              <i data-lucide="undo-2"></i>
            </IconButton>
          </Tooltip>
          <Tooltip label="Redo (Ctrl+Y)">
            <IconButton title="Redo" disabled={!canRedo} onClick={onRedo}>
              <i data-lucide="redo-2"></i>
            </IconButton>
          </Tooltip>
        </div>

        {view === 'design' && onSetDevice && responsive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 4, overflow: 'hidden' }}>
              {DEVICES.map(([id, icon, label]) => (
                <Tooltip key={id} label={label}>
                  <IconButton title={label} size="sm" active={device === id} onClick={() => onSetDevice(id)} style={{ borderRadius: 0 }}>
                    <i data-lucide={icon}></i>
                  </IconButton>
                </Tooltip>
              ))}
            </div>
            <Tooltip label="Rotate">
              <IconButton title="Rotate" size="sm" onClick={onToggleOrientation}><i data-lucide="rotate-cw"></i></IconButton>
            </Tooltip>
            {device === 'desktop' && onSetDesktopPreset && !compact && (
              <select title="Screen type" value={desktopPreset || 'std'} onChange={e => onSetDesktopPreset(e.target.value)}
                style={{ height: 24, maxWidth: 168, border: '1px solid var(--border-default)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', cursor: 'pointer', padding: '0 4px' }}>
                {DESKTOP_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            )}
            {device === 'custom' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                <input type="number" title="Screen width" min={200} value={(customSize && customSize.w) || 1200}
                  onChange={e => onSetCustomSize(e.target.value, (customSize && customSize.h) || 800)} style={dimIn} />
                <span>×</span>
                <input type="number" title="Screen height" min={200} value={(customSize && customSize.h) || 800}
                  onChange={e => onSetCustomSize((customSize && customSize.w) || 1200, e.target.value)} style={dimIn} />
              </div>
            ) : !compact && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{artboard ? `${artboard.w}×${artboard.h}` : ''}</span>
            )}
          </div>
        )}

        {view === 'design' && (
          <Tooltip label={previewMode ? 'Edit' : 'Preview'}>
            <Button variant={previewMode ? 'solid' : 'outline'} size="sm" onClick={onTogglePreview}
              iconLeft={<i key={previewMode ? 'e' : 'p'} data-lucide={previewMode ? 'pencil' : 'play'}></i>}>
              {tight ? '' : (previewMode ? 'Edit' : 'Preview')}
            </Button>
          </Tooltip>
        )}
        {onRun && !(runState && runState.active) && (
          <>
            <Tooltip label="Debug run — opens the app + a console window (logs, network, build errors)">
              <Button variant="outline" size="sm" onClick={() => onRun(true)} iconLeft={<i data-lucide="bug-play"></i>}>{tight ? '' : 'Debug'}</Button>
            </Tooltip>
            <Tooltip label="Run — launches the compiled app in a popup window (release)">
              <Button variant="outline" size="sm" onClick={() => onRun(false)} iconLeft={<i data-lucide="rocket"></i>}>{tight ? '' : 'Run'}</Button>
            </Tooltip>
            <Tooltip label="Web — standalone render: just the page, no device toolbar (follows the window like a real site)">
              <Button variant="outline" size="sm" onClick={() => onRun(false, { standalone: true })} iconLeft={<i data-lucide="globe"></i>}>{tight ? '' : 'Web'}</Button>
            </Tooltip>
          </>
        )}
        {onRun && runState && runState.active && (
          <>
            <Tooltip label="Stop the running app">
              <Button variant="danger" size="sm" onClick={onStop} iconLeft={<i data-lucide="square"></i>}>{tight ? '' : 'Stop'}</Button>
            </Tooltip>
            <Tooltip label="Restart — re-compile and reload the run">
              <IconButton title="Restart" onClick={onRestart}><i data-lucide="rotate-ccw"></i></IconButton>
            </Tooltip>
            <Tooltip label={runState.paused ? 'Resume' : 'Pause (freeze animation)'}>
              <IconButton title={runState.paused ? 'Resume' : 'Pause'} onClick={onPause}><i data-lucide={runState.paused ? 'play' : 'pause'}></i></IconButton>
            </Tooltip>
            {runState.debug && <span style={{ fontSize: 11, color: 'var(--amber-base)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><i data-lucide="bug" style={{ width: 12, height: 12 }}></i>{tight ? '' : 'Debug'}</span>}
          </>
        )}
        {onToggleAI && (
          <Tooltip label="AI Helper — ask the assistant (Pro)">
            <IconButton title="AI Helper" active={aiOpen} onClick={onToggleAI}><i data-lucide="sparkles"></i></IconButton>
          </Tooltip>
        )}
        <Tooltip label="Keyboard shortcuts (?)">
          <IconButton title="Shortcuts" onClick={onHelp}><i data-lucide="keyboard"></i></IconButton>
        </Tooltip>
        <Tooltip label="Settings">
          <IconButton title="Settings" onClick={onOpenSettings}><i data-lucide="settings"></i></IconButton>
        </Tooltip>
        {tight ? (
          <Tooltip label="Share">
            <IconButton title="Share" onClick={onShare}><i data-lucide="share-2"></i></IconButton>
          </Tooltip>
        ) : (
          <Button variant="outline" size="sm" onClick={onShare} iconLeft={<i data-lucide="share-2"></i>}>Share</Button>
        )}
        {tight ? (
          <Tooltip label="Generate code">
            <Button variant="solid" size="sm" onClick={onGenerate} iconLeft={<i data-lucide="zap"></i>} aria-label="Generate code" />
          </Tooltip>
        ) : (
          <Button variant="solid" size="sm" onClick={onGenerate} iconLeft={<i data-lucide="zap"></i>}>{compact ? 'Generate' : 'Generate code'}</Button>
        )}
      </div>
    </header>
  );
}
window.Topbar = Topbar;

// VS Code-style page tabs — rendered above the canvas column only (not across the side panels).
// Also hosts transient "animation editor" tabs (film icon) that open beside the page tabs.
function PageTabs({ pages = [], activePageId, onSelectPage, onAddPage, onRenamePage, onDeletePage, animTabs = [], activeAnimId, onSelectAnim, onCloseAnim }) {
  const { Tooltip } = window.LatticeDesignSystem_e801cb;
  const [editId, setEditId] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  const [hoverId, setHoverId] = React.useState(null);
  // Fill tab icons after structural changes (add/delete/rename/anim tab). Not keyed on hover to avoid per-hover rescans.
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, [pages, activePageId, editId, animTabs, activeAnimId]);
  const commitRename = () => { if (editId && draft.trim() && onRenamePage) onRenamePage(editId, draft.trim()); setEditId(null); };
  if (!pages.length || !onSelectPage) return null;
  return (
    <div style={pageBarStyle}>
      <div className="lt-pagebar-scroll" style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        {pages.map(p => {
          const active = !activeAnimId && p.id === activePageId;
          const hovered = hoverId === p.id;
          const editing = editId === p.id;
          const showClose = pages.length > 1 && (active || hovered) && !editing;
          return (
            <div key={p.id}
              onClick={() => { if (!editing) onSelectPage(p.id); }}
              onDoubleClick={() => { if (onRenamePage) { setEditId(p.id); setDraft(p.name); } }}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId(h => (h === p.id ? null : h))}
              title={p.route || p.name}
              style={pageTabStyle(active, hovered)}>
              <i data-lucide="file" style={{ width: 13, height: 13, flex: 'none', opacity: 0.7 }}></i>
              {editing ? (
                <input autoFocus value={draft} title="Rename page"
                  onChange={e => setDraft(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditId(null); }}
                  style={{ width: 110, minWidth: 60, height: 20, border: '1px solid var(--border-strong)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontSize: 12.5, fontFamily: 'var(--font-sans)', padding: '0 4px', outline: 'none' }} />
              ) : (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              )}
              <button type="button" title="Close page"
                onClick={e => { e.stopPropagation(); if (onDeletePage) onDeletePage(p.id); }}
                className="lt-page-close" style={pageCloseStyle(showClose)}>
                <i data-lucide="x" style={{ width: 12, height: 12 }}></i>
              </button>
            </div>
          );
        })}
        {animTabs.map(t => {
          const active = activeAnimId === t.id;
          const hovered = hoverId === t.id;
          return (
            <div key={t.id}
              onClick={() => onSelectAnim && onSelectAnim(t.id)}
              onMouseEnter={() => setHoverId(t.id)}
              onMouseLeave={() => setHoverId(h => (h === t.id ? null : h))}
              title={`Animation · ${t.label}`}
              style={pageTabStyle(active, hovered)}>
              <i data-lucide="film" style={{ width: 13, height: 13, flex: 'none', opacity: 0.8, color: active ? 'var(--blue-base)' : undefined }}></i>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              <button type="button" title="Close animation editor"
                onClick={e => { e.stopPropagation(); onCloseAnim && onCloseAnim(t.id); }}
                className="lt-page-close" style={pageCloseStyle(active || hovered)}>
                <i data-lucide="x" style={{ width: 12, height: 12 }}></i>
              </button>
            </div>
          );
        })}
      </div>
      {onAddPage && (
        <Tooltip label="New page">
          <button type="button" title="New page" onClick={onAddPage} style={pageAddStyle}>
            <i data-lucide="plus" style={{ width: 14, height: 14 }}></i>
          </button>
        </Tooltip>
      )}
    </div>
  );
}
window.PageTabs = PageTabs;
