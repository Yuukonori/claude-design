import React from 'react';

/**
 * Card — flat surface container. Border, 0 radius, no shadow.
 */
export function Card({ padding = 'md', interactive = false, header = null, footer = null, style, children, ...rest }) {
  const pad = { none: 0, sm: 'var(--space-3)', md: 'var(--space-4)', lg: 'var(--space-6)' }[padding];
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid ' + (hover ? 'var(--border-default)' : 'var(--border-subtle)'),
        borderRadius: 'var(--radius-none)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color var(--dur-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {header && <div style={{ padding: pad, borderBottom: '1px solid var(--border-subtle)' }}>{header}</div>}
      <div style={{ padding: pad }}>{children}</div>
      {footer && <div style={{ padding: pad, borderTop: '1px solid var(--border-subtle)' }}>{footer}</div>}
    </div>
  );
}
