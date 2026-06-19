import React from 'react';

/**
 * Button — Lattice's primary action control.
 * Monochrome: the solid variant is white-on-near-black. Sharp 0px corners.
 */
export function Button({
  variant = 'solid',
  size = 'md',
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: { height: 28, padding: '0 10px', fontSize: 12, gap: 6 },
    md: { height: 34, padding: '0 14px', fontSize: 13, gap: 7 },
    lg: { height: 42, padding: '0 20px', fontSize: 14, gap: 8 },
  };
  const variants = {
    solid: {
      background: 'var(--action-solid)',
      color: 'var(--action-solid-text)',
      border: '1px solid var(--action-solid)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'transparent',
      color: 'var(--status-danger-fg)',
      border: '1px solid var(--status-danger-fg)',
    },
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.solid;

  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? ({
    solid: { background: 'var(--action-solid-hover)', borderColor: 'var(--action-solid-hover)' },
    outline: { background: 'var(--surface-hover)', borderColor: 'var(--border-strong)' },
    ghost: { background: 'var(--action-ghost-hover)', color: 'var(--text-primary)' },
    danger: { background: 'var(--status-danger-bg)' },
  }[variant] || {}) : {};

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap, height: s.height, padding: s.padding, fontSize: s.fontSize,
        fontFamily: 'var(--font-sans)', fontWeight: 500, lineHeight: 1,
        width: fullWidth ? '100%' : 'auto',
        borderRadius: 'var(--radius-none)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, whiteSpace: 'nowrap', userSelect: 'none',
        transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
        ...v, ...hoverStyle, ...style,
      }}
      {...rest}
    >
      {iconLeft && <span style={{ display: 'inline-flex' }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex' }}>{iconRight}</span>}
    </button>
  );
}
