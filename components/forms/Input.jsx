import React from 'react';

/**
 * Input — text field with optional label, icon, and error.
 */
export function Input({
  label, hint, error, iconLeft, size = 'md', disabled = false,
  style, wrapStyle, id, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = { sm: 30, md: 36, lg: 42 }[size] || 36;
  const inputId = id || ('inp-' + Math.random().toString(36).slice(2, 7));
  const borderColor = error ? 'var(--status-danger-fg)' : focus ? 'var(--border-focus)' : 'var(--border-default)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapStyle }}>
      {label && <label htmlFor={inputId} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center', height: h, gap: 8, padding: '0 10px',
        background: 'var(--surface-inset)', border: '1px solid ' + borderColor,
        borderRadius: 'var(--radius-none)', opacity: disabled ? 0.5 : 1,
        boxShadow: focus && !error ? '0 0 0 2px var(--ring)' : 'none',
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      }}>
        {iconLeft && <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>{iconLeft}</span>}
        <input
          id={inputId} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, height: '100%', border: 0, outline: 'none',
            background: 'transparent', color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', fontSize: 13, ...style,
          }}
          {...rest}
        />
      </div>
      {(hint || error) && <span style={{ fontSize: 11, color: error ? 'var(--status-danger-fg)' : 'var(--text-muted)' }}>{error || hint}</span>}
    </div>
  );
}
