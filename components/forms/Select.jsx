import React from 'react';

/**
 * Select — native select styled to the system, with chevron.
 */
export function Select({ label, options = [], size = 'md', disabled = false, style, wrapStyle, id, ...rest }) {
  const h = { sm: 30, md: 36, lg: 42 }[size] || 36;
  const selId = id || ('sel-' + Math.random().toString(36).slice(2, 7));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapStyle }}>
      {label && <label htmlFor={selId} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{ position: 'relative', height: h, opacity: disabled ? 0.5 : 1 }}>
        <select
          id={selId} disabled={disabled}
          style={{
            appearance: 'none', WebkitAppearance: 'none', width: '100%', height: '100%',
            padding: '0 30px 0 10px', background: 'var(--surface-inset)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-none)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 13,
            cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none', ...style,
          }}
          {...rest}
        >
          {options.map((o, i) => {
            const val = typeof o === 'string' ? o : o.value;
            const lbl = typeof o === 'string' ? o : o.label;
            return <option key={i} value={val}>{lbl}</option>;
          })}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 11 }}>▾</span>
      </div>
    </div>
  );
}
