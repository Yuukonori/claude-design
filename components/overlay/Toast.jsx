import React from 'react';

/**
 * Toast — transient notification. Sharp, bordered, left status rule.
 */
export function Toast({ tone = 'neutral', title, message, onClose, style }) {
  const accent = {
    neutral: 'var(--border-strong)',
    success: 'var(--green-base)',
    warning: 'var(--amber-base)',
    danger: 'var(--red-base)',
    info: 'var(--blue-base)',
  }[tone];
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 280, maxWidth: 380,
      padding: '12px 14px', background: 'var(--surface-raised)',
      border: '1px solid var(--border-default)', borderLeft: '2px solid ' + accent,
      borderRadius: 'var(--radius-none)', boxShadow: 'var(--shadow-md)', ...style,
    }}>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>}
        {message && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: title ? 3 : 0 }}>{message}</div>}
      </div>
      {onClose && <button type="button" onClick={onClose} aria-label="Dismiss" style={{ border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>}
    </div>
  );
}
