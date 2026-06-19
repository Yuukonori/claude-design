import React from 'react';

/**
 * IconButton — square, icon-only action. Sharp corners, ghost by default.
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  active = false,
  title,
  onClick,
  children,
  style,
  ...rest
}) {
  const dims = { sm: 26, md: 32, lg: 38 }[size] || 32;
  const [hover, setHover] = React.useState(false);

  const base = {
    ghost: { background: active ? 'var(--surface-hover)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
    solid: { background: 'var(--action-solid)', color: 'var(--action-solid-text)', border: '1px solid var(--action-solid)' },
  }[variant];

  const hoverStyle = !disabled && hover ? {
    ghost: { background: 'var(--surface-hover)', color: 'var(--text-primary)' },
    outline: { background: 'var(--surface-hover)', borderColor: 'var(--border-strong)' },
    solid: { background: 'var(--action-solid-hover)' },
  }[variant] : {};

  return (
    <button
      type="button" title={title} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: dims, height: dims, padding: 0, borderRadius: 'var(--radius-none)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        ...base, ...hoverStyle, ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
