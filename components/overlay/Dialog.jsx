import React from 'react';

/**
 * Dialog — centered modal over a scrim. Sharp, bordered, shadowed.
 */
export function Dialog({ open, onClose, title, description, footer, width = 440, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'var(--blur-overlay)',
      }}
    >
      <div
        role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '100%', background: 'var(--surface-raised)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-none)',
          boxShadow: 'var(--shadow-overlay)', display: 'flex', flexDirection: 'column',
        }}
      >
        {(title || onClose) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: 'var(--space-5) var(--space-5) var(--space-3)' }}>
            <div>
              {title && <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.15 }}>{title}</div>}
              {description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{description}</div>}
            </div>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close" style={{ border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
            )}
          </div>
        )}
        {children && <div style={{ padding: '0 var(--space-5) var(--space-5)', fontSize: 13, color: 'var(--text-secondary)' }}>{children}</div>}
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>{footer}</div>}
      </div>
    </div>
  );
}
