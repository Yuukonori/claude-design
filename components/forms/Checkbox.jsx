import React from 'react';

/**
 * Checkbox — square, sharp. Controlled or uncontrolled.
 */
export function Checkbox({ label, checked, defaultChecked, disabled = false, onChange, id, style, ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const cbId = id || ('cb-' + Math.random().toString(36).slice(2, 7));
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInternal(!on); onChange && onChange(!on, e); };
  return (
    <label htmlFor={cbId} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span onClick={toggle} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 17, height: 17, flex: 'none',
        background: on ? 'var(--action-solid)' : 'var(--surface-inset)',
        border: '1px solid ' + (on ? 'var(--action-solid)' : 'var(--border-strong)'),
        borderRadius: 'var(--radius-none)', color: 'var(--action-solid-text)',
        transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
      }}>
        {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square"/></svg>}
      </span>
      <input id={cbId} type="checkbox" checked={on} disabled={disabled} onChange={toggle} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
      {label && <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}
