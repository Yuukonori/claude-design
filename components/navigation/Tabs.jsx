import React from 'react';

/**
 * Tabs — underline tab bar. Controlled or uncontrolled.
 */
export function Tabs({ tabs = [], value, defaultValue, onChange, style, ...rest }) {
  const isControlled = value !== undefined;
  const first = defaultValue ?? (tabs[0] && (typeof tabs[0] === 'string' ? tabs[0] : tabs[0].value));
  const [internal, setInternal] = React.useState(first);
  const active = isControlled ? value : internal;
  const select = (v) => { if (!isControlled) setInternal(v); onChange && onChange(v); };
  return (
    <div role="tablist" style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', ...style }} {...rest}>
      {tabs.map((t, i) => {
        const val = typeof t === 'string' ? t : t.value;
        const lbl = typeof t === 'string' ? t : t.label;
        const on = val === active;
        return (
          <button key={i} role="tab" onClick={() => select(val)} style={{
            position: 'relative', padding: '9px 12px', background: 'transparent', border: 0,
            borderBottom: '2px solid ' + (on ? 'var(--text-primary)' : 'transparent'),
            marginBottom: -1, color: on ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: on ? 600 : 500,
            cursor: 'pointer', transition: 'color var(--dur-fast) var(--ease-out)',
          }}>{lbl}</button>
        );
      })}
    </div>
  );
}
