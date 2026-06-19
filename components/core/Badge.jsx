import React from 'react';

/**
 * Badge — small status label. Tone maps to muted semantic hues.
 */
export function Badge({ tone = 'neutral', children, style, ...rest }) {
  const tones = {
    neutral: { color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: 'var(--border-default)' },
    success: { color: 'var(--status-success-fg)', background: 'var(--status-success-bg)', border: 'var(--green-base)' },
    warning: { color: 'var(--status-warning-fg)', background: 'var(--status-warning-bg)', border: 'var(--amber-base)' },
    danger: { color: 'var(--status-danger-fg)', background: 'var(--status-danger-bg)', border: 'var(--red-base)' },
    info: { color: 'var(--status-info-fg)', background: 'var(--status-info-bg)', border: 'var(--blue-base)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 20, padding: '0 7px', fontSize: 11, fontWeight: 500,
      fontFamily: 'var(--font-sans)', lineHeight: 1, whiteSpace: 'nowrap',
      color: t.color, background: t.background,
      border: '1px solid ' + t.border, borderRadius: 'var(--radius-none)',
      ...style,
    }} {...rest}>{children}</span>
  );
}
