import React from 'react';

/**
 * Tag — removable token / chip. Pill or sharp.
 */
export function Tag({ children, onRemove, shape = 'sharp', style, ...rest }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 24, padding: onRemove ? '0 4px 0 9px' : '0 9px',
      fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)',
      background: 'var(--surface-hover)', border: '1px solid var(--border-default)',
      borderRadius: shape === 'pill' ? 'var(--radius-pill)' : 'var(--radius-none)',
      ...style,
    }} {...rest}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, padding: 0, border: 0, background: 'transparent',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1,
        }}>×</button>
      )}
    </span>
  );
}
