import React from 'react';

/**
 * Tooltip — hover label. Sharp, dark, appears on top.
 */
export function Tooltip({ label, side = 'top', children, style }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  }[side];
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" style={{
          position: 'absolute', zIndex: 50, whiteSpace: 'nowrap',
          padding: '5px 8px', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500,
          color: 'var(--neutral-50)', background: 'var(--neutral-950)',
          border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-none)',
          boxShadow: 'var(--shadow-md)', pointerEvents: 'none', ...pos, ...style,
        }}>{label}</span>
      )}
    </span>
  );
}
