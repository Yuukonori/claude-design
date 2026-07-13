/* global React, ContextMenu */
// Left panel — nested layers tree derived from `child` connections.
// Expand/collapse, inline rename, visibility & lock toggles, drag reorder/reparent, context menu.
function LayersTree({ nodes, connections, selectedIds = [], onSelect, onSelectMany, onRename, onSetParent, onToggleVisibility, onToggleLock, onReorder, onReorderMany, actions }) {
  const { Badge } = window.LatticeDesignSystem_e801cb;
  const [collapsed, setCollapsed] = React.useState(() => new Set());
  const [editingId, setEditingId] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  const [menu, setMenu] = React.useState(null); // { x, y, id }
  const [drop, setDrop] = React.useState(null); // { id, mode }
  const dragIdRef = React.useRef(null);
  const lastClickRef = React.useRef(null); // anchor for shift-range selection

  // parentOf map + sibling ordering from node array order (so reordering the array reorders layers)
  const parentOf = {};
  connections.filter(c => c.kind === 'child').forEach(c => { parentOf[c.to] = c.from; });
  const roots = nodes.filter(n => !parentOf[n.id] || !nodes.some(m => m.id === parentOf[n.id]));
  const childrenOf = (id) => nodes.filter(m => parentOf[m.id] === id);

  // Flat, top-to-bottom order of the currently VISIBLE rows (skips collapsed subtrees) — used for
  // shift-range selection.
  const flatOrder = [];
  const walk = (n) => { flatOrder.push(n.id); if (!collapsed.has(n.id)) childrenOf(n.id).forEach(walk); };
  roots.forEach(walk);

  const selectRow = (e, n) => {
    if (e.metaKey || e.ctrlKey) {
      const set = new Set(selectedIds);
      set.has(n.id) ? set.delete(n.id) : set.add(n.id);
      (onSelectMany || (() => onSelect(n.id)))([...set]);
      lastClickRef.current = n.id;
    } else if (e.shiftKey && lastClickRef.current && onSelectMany) {
      const a = flatOrder.indexOf(lastClickRef.current), b = flatOrder.indexOf(n.id);
      if (a >= 0 && b >= 0) { const [lo, hi] = a < b ? [a, b] : [b, a]; onSelectMany(flatOrder.slice(lo, hi + 1)); }
      else onSelect(n.id);
    } else {
      onSelect(n.id);
      lastClickRef.current = n.id;
    }
  };

  // Re-scan icons after discrete tree changes (expand/collapse, visibility/lock swaps)
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, [collapsed, nodes, editingId]);

  const toggleCollapse = (id) => setCollapsed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const startRename = (n) => { setEditingId(n.id); setDraft(n.name); };
  const commitRename = () => { if (editingId && draft.trim()) onRename(editingId, draft.trim()); setEditingId(null); };

  const onRowDragOver = (e, n) => {
    e.preventDefault();
    if (dragIdRef.current === n.id) return;
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientY - r.top) / r.height;
    const mode = rel < 0.28 ? 'before' : rel > 0.72 ? 'after' : 'inside';
    setDrop({ id: n.id, mode });
  };
  const onRowDrop = (e, n) => {
    e.preventDefault();
    const dragId = dragIdRef.current;
    if (dragId && drop) {
      // If the grabbed row is part of a multi-selection, move the whole selection together;
      // otherwise fall back to moving just the row that was physically dragged.
      if (onReorderMany && selectedIds.length > 1 && selectedIds.includes(dragId)) {
        onReorderMany(selectedIds, n.id, drop.mode);
      } else {
        onReorder(dragId, n.id, drop.mode);
      }
    }
    dragIdRef.current = null;
    setDrop(null);
  };

  const renderRow = (n, depth) => {
    const kids = nodes.filter(m => parentOf[m.id] === n.id);
    const hasKids = kids.length > 0;
    const isCollapsed = collapsed.has(n.id);
    const sel = selectedIds.includes(n.id);
    const dh = drop && drop.id === n.id ? drop.mode : null;
    return (
      <React.Fragment key={n.id}>
        <div
          draggable={editingId !== n.id}
          onDragStart={() => { dragIdRef.current = n.id; }}
          onDragEnd={() => { dragIdRef.current = null; setDrop(null); }}
          onDragOver={e => onRowDragOver(e, n)}
          onDrop={e => onRowDrop(e, n)}
          onClick={e => selectRow(e, n)}
          onDoubleClick={() => startRename(n)}
          onContextMenu={e => { e.preventDefault(); if (!selectedIds.includes(n.id)) onSelect(n.id); setMenu({ x: e.clientX, y: e.clientY, id: n.id }); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', paddingLeft: 8 + depth * 14,
            background: sel ? 'var(--surface-hover)' : 'transparent',
            borderLeft: '2px solid ' + (sel ? 'var(--text-primary)' : 'transparent'),
            boxShadow: dh === 'before' ? 'inset 0 2px 0 var(--blue-base)' : dh === 'after' ? 'inset 0 -2px 0 var(--blue-base)' : dh === 'inside' ? 'inset 0 0 0 1px var(--blue-base)' : 'none',
            color: sel ? 'var(--text-primary)' : 'var(--text-secondary)',
            opacity: n.hidden ? 0.45 : 1, cursor: 'pointer', fontSize: 12.5, userSelect: 'none',
          }}>
          <span onClick={e => { e.stopPropagation(); if (hasKids) toggleCollapse(n.id); }}
            style={{ width: 12, height: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: hasKids ? 'pointer' : 'default' }}>
            {hasKids && <i key={isCollapsed ? 'r' : 'd'} data-lucide={isCollapsed ? 'chevron-right' : 'chevron-down'} style={{ width: 11, height: 11 }}></i>}
          </span>
          <i data-lucide={n.icon} style={{ width: 13, height: 13, opacity: 0.75, flex: 'none' }}></i>
          {editingId === n.id ? (
            <input autoFocus value={draft} title="Rename layer"
              onChange={e => setDraft(e.target.value)} onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, minWidth: 0, height: 20, border: '1px solid var(--border-strong)', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontSize: 12.5, fontFamily: 'var(--font-sans)', padding: '0 4px', outline: 'none' }} />
          ) : (
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
          )}
          <button type="button" title={n.locked ? 'Unlock' : 'Lock'} onClick={e => { e.stopPropagation(); onToggleLock(n.id); }} style={iconBtn(n.locked)}>
            <i key={n.locked ? 'l' : 'u'} data-lucide={n.locked ? 'lock' : 'lock-open'} style={{ width: 12, height: 12 }}></i>
          </button>
          <button type="button" title={n.hidden ? 'Show' : 'Hide'} onClick={e => { e.stopPropagation(); onToggleVisibility(n.id); }} style={iconBtn(n.hidden)}>
            <i key={n.hidden ? 'h' : 'v'} data-lucide={n.hidden ? 'eye-off' : 'eye'} style={{ width: 12, height: 12 }}></i>
          </button>
        </div>
        {hasKids && !isCollapsed && kids.map(k => renderRow(k, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Layers</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" title={`Group selection into a folder${selectedIds.length ? '' : ' (select layers first)'} · Ctrl+G`}
            disabled={selectedIds.length === 0} onClick={() => actions.group(selectedIds)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: 0, background: 'transparent', cursor: selectedIds.length ? 'pointer' : 'default', color: selectedIds.length ? 'var(--text-secondary)' : 'var(--text-disabled)' }}>
            <i data-lucide="folder-plus" style={{ width: 14, height: 14 }}></i>
          </button>
          <Badge>{nodes.length}</Badge>
        </div>
      </div>
      {nodes.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-disabled)', padding: '8px 6px' }}>No layers yet. Place a component to begin.</div>
      )}
      <div>{roots.map(r => renderRow(r, 0))}</div>

      <ContextMenu open={!!menu} x={menu?.x || 0} y={menu?.y || 0} onClose={() => setMenu(null)}
        items={menu ? [
          { label: selectedIds.length > 1 ? `Group ${selectedIds.length} layers` : 'Group into folder', icon: 'folder-plus', onClick: () => actions.group(selectedIds.length ? selectedIds : [menu.id]) },
          { label: 'Ungroup', icon: 'folder-minus', disabled: childrenOf(menu.id).length === 0, onClick: () => actions.ungroup(menu.id) },
          { separator: true },
          { label: 'Rename', icon: 'pencil', onClick: () => startRename(nodes.find(n => n.id === menu.id)) },
          { label: 'Duplicate', icon: 'copy', onClick: () => actions.duplicate(selectedIds.length > 1 ? selectedIds : [menu.id]) },
          { label: 'Detach from parent', icon: 'unlink', disabled: !parentOf[menu.id], onClick: () => actions.detach(menu.id) },
          { separator: true },
          { label: selectedIds.length > 1 ? `Delete ${selectedIds.length} layers` : 'Delete', icon: 'trash-2', danger: true, onClick: () => actions.remove(selectedIds.length > 1 ? selectedIds : [menu.id]) },
        ] : []} />
    </div>
  );
}

function iconBtn(active) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20,
    border: 0, background: 'transparent', cursor: 'pointer', flex: 'none',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  };
}
window.LayersTree = LayersTree;
