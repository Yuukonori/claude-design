/* global React */
// Floating, collapsible run-log console. Shows each workflow run and its per-node steps — the API
// request/response, which condition branch was taken and why, variable writes, toasts and errors —
// so you can see exactly why a run ended the way it did. Rendered in Preview, the Run tab, and the
// Workflow tab. Reads App's `runLog` state; purely presentational.

const TONE = {
  info:    'var(--text-muted)',
  success: 'var(--green-base)',
  warning: 'var(--amber-base)',
  danger:  'var(--red-base)',
};

function ago(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 3) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.round(s / 60);
  return m < 60 ? m + 'm ago' : Math.round(m / 60) + 'h ago';
}

function StepRow({ step }) {
  const [open, setOpen] = React.useState(false);
  const hasData = step.data && Object.keys(step.data).some(k => step.data[k] != null);
  return (
    <div style={{ padding: '5px 10px 5px 12px', borderTop: '1px solid var(--border-subtle)' }}>
      <div onClick={() => hasData && setOpen(o => !o)} style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: hasData ? 'pointer' : 'default' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: TONE[step.tone] || TONE.info, flex: 'none', transform: 'translateY(2px)' }}></span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', flex: 'none', minWidth: 78 }}>{step.label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>{step.text}</span>
        {hasData && <span style={{ fontSize: 9, color: 'var(--text-disabled)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms', flex: 'none' }}>▶</span>}
      </div>
      {open && hasData && <StepData data={step.data} />}
    </div>
  );
}

function StepData({ data }) {
  const box = { margin: '6px 0 2px 15px', padding: 8, background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 180, overflow: 'auto' };
  const asText = (v) => v == null ? '∅' : typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
  if (Array.isArray(data.checks)) {
    return (
      <div style={box}>
        {data.checks.map((c, i) => (
          <div key={i} style={{ color: c.result ? 'var(--green-base)' : 'var(--text-muted)' }}>
            branch {c.branch}: {c.left} {c.op} {c.right} → {String(c.result)}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={box}>
      {Object.keys(data).filter(k => data[k] != null).map(k => (
        <div key={k} style={{ marginBottom: 3 }}><span style={{ color: 'var(--text-muted)' }}>{k}:</span> {asText(data[k])}</div>
      ))}
    </div>
  );
}

function RunBlock({ run, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const failed = run.result === 'error' || (run.steps || []).some(s => s.tone === 'danger');
  const dot = run.result === 'running' ? 'var(--amber-base)' : failed ? 'var(--red-base)' : 'var(--green-base)';
  return (
    <div style={{ borderTop: '1px solid var(--border-default)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', background: 'var(--surface-inset)' }}>
        <span style={{ fontSize: 9, color: 'var(--text-disabled)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>▶</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flex: 'none' }}></span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.name}</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flex: 'none' }}>{(run.steps || []).length} steps · {ago(run.at)}</span>
      </div>
      {open && (run.steps || []).map((s, i) => <StepRow key={i} step={s} />)}
      {open && !(run.steps || []).length && <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-disabled)' }}>Running…</div>}
    </div>
  );
}

function WorkflowRunLog({ runs = [], onClear }) {
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => { if (window.renderLucideIcons) window.renderLucideIcons(); }, [open, runs.length]);
  if (!runs.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, width: 384, maxWidth: 'calc(100vw - 32px)', zIndex: 250,
      background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 8, boxShadow: 'var(--shadow-lg, 0 8px 30px rgba(0,0,0,.4))', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 12px', borderBottom: open ? '1px solid var(--border-default)' : 0 }}>
        <i data-lucide="scroll-text" style={{ width: 14, height: 14, color: 'var(--text-secondary)' }}></i>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Run log · {runs.length}</span>
        <button type="button" title="Clear" onClick={onClear} style={hdrBtn}><i data-lucide="trash-2" style={{ width: 13, height: 13 }}></i></button>
        <button type="button" title={open ? 'Collapse' : 'Expand'} onClick={() => setOpen(o => !o)} style={hdrBtn}>
          <i data-lucide={open ? 'chevron-down' : 'chevron-up'} style={{ width: 14, height: 14 }}></i>
        </button>
      </div>
      {open && (
        <div style={{ maxHeight: '44vh', overflowY: 'auto' }}>
          {runs.map((r, i) => <RunBlock key={r.id} run={r} defaultOpen={i === 0} />)}
        </div>
      )}
    </div>
  );
}

const hdrBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 0, borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flex: 'none' };

window.WorkflowRunLog = WorkflowRunLog;
