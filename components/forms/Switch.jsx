import React from 'react';

/**
 * Switch — pill toggle (one of the few rounded elements).
 */
export function Switch({ label, checked, defaultChecked, disabled = false, onChange, style, ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInternal(!on); onChange && onChange(!on, e); };
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }} {...rest}>
      <span onClick={toggle} style={{
        position: 'relative', width: 34, height: 19, flex: 'none',
        background: on ? 'var(--action-solid)' : 'var(--neutral-400)',
        borderRadius: 'var(--radius-pill)',
        transition: 'background var(--dur-base) var(--ease-out)',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 17 : 2, width: 15, height: 15,
          background: on ? 'var(--neutral-50)' : 'var(--neutral-800)', borderRadius: 'var(--radius-full)',
          transition: 'left var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
        }} />
      </span>
      {label && <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}
