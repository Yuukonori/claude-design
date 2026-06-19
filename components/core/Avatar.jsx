import React from 'react';

/**
 * Avatar — circular user/component identity. Initials fallback.
 */
export function Avatar({ src, name = '', size = 'md', style, ...rest }) {
  const dims = { xs: 20, sm: 26, md: 32, lg: 40 }[size] || 32;
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dims, height: dims, borderRadius: 'var(--radius-full)', overflow: 'hidden',
      background: 'var(--surface-hover)', border: '1px solid var(--border-default)',
      color: 'var(--text-secondary)', fontSize: dims * 0.36, fontWeight: 600,
      fontFamily: 'var(--font-sans)', userSelect: 'none', flex: 'none',
      ...style,
    }} {...rest}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (initials || '?')}
    </span>
  );
}
