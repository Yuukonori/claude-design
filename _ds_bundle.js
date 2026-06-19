/* @ds-bundle: {"format":3,"namespace":"LatticeDesignSystem_e801cb","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Dialog","sourcePath":"components/overlay/Dialog.jsx"},{"name":"Toast","sourcePath":"components/overlay/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/overlay/Tooltip.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"5deab98d5f86","components/core/Badge.jsx":"e8e1dbab9917","components/core/Button.jsx":"86cd590320dc","components/core/Card.jsx":"6e3ae62b999d","components/core/IconButton.jsx":"ab45b5ec792d","components/core/Tag.jsx":"790d75d5af49","components/forms/Checkbox.jsx":"c8385e51ef73","components/forms/Input.jsx":"79e24881cdec","components/forms/Select.jsx":"d7fb8b33b230","components/forms/Switch.jsx":"174850ee05bf","components/navigation/Tabs.jsx":"e346aea6067d","components/overlay/Dialog.jsx":"d82035d23656","components/overlay/Toast.jsx":"686c8555941c","components/overlay/Tooltip.jsx":"c9dc33c0a49e","ui_kits/lattice/App.jsx":"6bbdb3723bb3","ui_kits/lattice/Canvas.jsx":"93de5f418669","ui_kits/lattice/CodePanel.jsx":"253d0a00ddd9","ui_kits/lattice/Inspector.jsx":"50cc63e65f13","ui_kits/lattice/LibraryPanel.jsx":"7f80a14e89d1","ui_kits/lattice/RelationshipsView.jsx":"fe465d321396","ui_kits/lattice/Topbar.jsx":"8c663614cb38"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LatticeDesignSystem_e801cb = window.LatticeDesignSystem_e801cb || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar — circular user/component identity. Initials fallback.
 */
function Avatar({
  src,
  name = '',
  size = 'md',
  style,
  ...rest
}) {
  const dims = {
    xs: 20,
    sm: 26,
    md: 32,
    lg: 40
  }[size] || 32;
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dims,
      height: dims,
      borderRadius: 'var(--radius-full)',
      overflow: 'hidden',
      background: 'var(--surface-hover)',
      border: '1px solid var(--border-default)',
      color: 'var(--text-secondary)',
      fontSize: dims * 0.36,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      userSelect: 'none',
      flex: 'none',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — small status label. Tone maps to muted semantic hues.
 */
function Badge({
  tone = 'neutral',
  children,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      color: 'var(--text-secondary)',
      background: 'var(--surface-hover)',
      border: 'var(--border-default)'
    },
    success: {
      color: 'var(--status-success-fg)',
      background: 'var(--status-success-bg)',
      border: 'var(--green-base)'
    },
    warning: {
      color: 'var(--status-warning-fg)',
      background: 'var(--status-warning-bg)',
      border: 'var(--amber-base)'
    },
    danger: {
      color: 'var(--status-danger-fg)',
      background: 'var(--status-danger-bg)',
      border: 'var(--red-base)'
    },
    info: {
      color: 'var(--status-info-fg)',
      background: 'var(--status-info-bg)',
      border: 'var(--blue-base)'
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 20,
      padding: '0 7px',
      fontSize: 11,
      fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      color: t.color,
      background: t.background,
      border: '1px solid ' + t.border,
      borderRadius: 'var(--radius-none)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — Lattice's primary action control.
 * Monochrome: the solid variant is white-on-near-black. Sharp 0px corners.
 */
function Button({
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
    sm: {
      height: 28,
      padding: '0 10px',
      fontSize: 12,
      gap: 6
    },
    md: {
      height: 34,
      padding: '0 14px',
      fontSize: 13,
      gap: 7
    },
    lg: {
      height: 42,
      padding: '0 20px',
      fontSize: 14,
      gap: 8
    }
  };
  const variants = {
    solid: {
      background: 'var(--action-solid)',
      color: 'var(--action-solid-text)',
      border: '1px solid var(--action-solid)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    danger: {
      background: 'transparent',
      color: 'var(--status-danger-fg)',
      border: '1px solid var(--status-danger-fg)'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.solid;
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? {
    solid: {
      background: 'var(--action-solid-hover)',
      borderColor: 'var(--action-solid-hover)'
    },
    outline: {
      background: 'var(--surface-hover)',
      borderColor: 'var(--border-strong)'
    },
    ghost: {
      background: 'var(--action-ghost-hover)',
      color: 'var(--text-primary)'
    },
    danger: {
      background: 'var(--status-danger-bg)'
    }
  }[variant] || {} : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      fontSize: s.fontSize,
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      lineHeight: 1,
      width: fullWidth ? '100%' : 'auto',
      borderRadius: 'var(--radius-none)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      whiteSpace: 'nowrap',
      userSelect: 'none',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
      ...v,
      ...hoverStyle,
      ...style
    }
  }, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconLeft), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — flat surface container. Border, 0 radius, no shadow.
 */
function Card({
  padding = 'md',
  interactive = false,
  header = null,
  footer = null,
  style,
  children,
  ...rest
}) {
  const pad = {
    none: 0,
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)'
  }[padding];
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid ' + (hover ? 'var(--border-default)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-none)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'border-color var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest), header && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — square, icon-only action. Sharp corners, ghost by default.
 */
function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  active = false,
  title,
  onClick,
  children,
  style,
  ...rest
}) {
  const dims = {
    sm: 26,
    md: 32,
    lg: 38
  }[size] || 32;
  const [hover, setHover] = React.useState(false);
  const base = {
    ghost: {
      background: active ? 'var(--surface-hover)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)'
    },
    solid: {
      background: 'var(--action-solid)',
      color: 'var(--action-solid-text)',
      border: '1px solid var(--action-solid)'
    }
  }[variant];
  const hoverStyle = !disabled && hover ? {
    ghost: {
      background: 'var(--surface-hover)',
      color: 'var(--text-primary)'
    },
    outline: {
      background: 'var(--surface-hover)',
      borderColor: 'var(--border-strong)'
    },
    solid: {
      background: 'var(--action-solid-hover)'
    }
  }[variant] : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    title: title,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dims,
      height: dims,
      padding: 0,
      borderRadius: 'var(--radius-none)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
      ...base,
      ...hoverStyle,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — removable token / chip. Pill or sharp.
 */
function Tag({
  children,
  onRemove,
  shape = 'sharp',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: onRemove ? '0 4px 0 9px' : '0 9px',
      fontSize: 12,
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-secondary)',
      background: 'var(--surface-hover)',
      border: '1px solid var(--border-default)',
      borderRadius: shape === 'pill' ? 'var(--radius-pill)' : 'var(--radius-none)',
      ...style
    }
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 16,
      height: 16,
      padding: 0,
      border: 0,
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: 13,
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox — square, sharp. Controlled or uncontrolled.
 */
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  id,
  style,
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const cbId = id || 'cb-' + Math.random().toString(36).slice(2, 7);
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange && onChange(!on, e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: cbId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 17,
      height: 17,
      flex: 'none',
      background: on ? 'var(--action-solid)' : 'var(--surface-inset)',
      border: '1px solid ' + (on ? 'var(--action-solid)' : 'var(--border-strong)'),
      borderRadius: 'var(--radius-none)',
      color: 'var(--action-solid-text)',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)'
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.2L5 8.5L9.5 3.5",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "square"
  }))), /*#__PURE__*/React.createElement("input", _extends({
    id: cbId,
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field with optional label, icon, and error.
 */
function Input({
  label,
  hint,
  error,
  iconLeft,
  size = 'md',
  disabled = false,
  style,
  wrapStyle,
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = {
    sm: 30,
    md: 36,
    lg: 42
  }[size] || 36;
  const inputId = id || 'inp-' + Math.random().toString(36).slice(2, 7);
  const borderColor = error ? 'var(--status-danger-fg)' : focus ? 'var(--border-focus)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      height: h,
      gap: 8,
      padding: '0 10px',
      background: 'var(--surface-inset)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-none)',
      opacity: disabled ? 0.5 : 1,
      boxShadow: focus && !error ? '0 0 0 2px var(--ring)' : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      border: 0,
      outline: 'none',
      background: 'transparent',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      ...style
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: error ? 'var(--status-danger-fg)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — native select styled to the system, with chevron.
 */
function Select({
  label,
  options = [],
  size = 'md',
  disabled = false,
  style,
  wrapStyle,
  id,
  ...rest
}) {
  const h = {
    sm: 30,
    md: 36,
    lg: 42
  }[size] || 36;
  const selId = id || 'sel-' + Math.random().toString(36).slice(2, 7);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selId,
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: h,
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId,
    disabled: disabled,
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: '100%',
      padding: '0 30px 0 10px',
      background: 'var(--surface-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-none)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none',
      ...style
    }
  }, rest), options.map((o, i) => {
    const val = typeof o === 'string' ? o : o.value;
    const lbl = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: i,
      value: val
    }, lbl);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-muted)',
      fontSize: 11
    }
  }, "\u25BE")));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Switch — pill toggle (one of the few rounded elements).
 */
function Switch({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  style,
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange && onChange(!on, e);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    style: {
      position: 'relative',
      width: 34,
      height: 19,
      flex: 'none',
      background: on ? 'var(--action-solid)' : 'var(--neutral-400)',
      borderRadius: 'var(--radius-pill)',
      transition: 'background var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: on ? 17 : 2,
      width: 15,
      height: 15,
      background: on ? 'var(--neutral-50)' : 'var(--neutral-800)',
      borderRadius: 'var(--radius-full)',
      transition: 'left var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tabs — underline tab bar. Controlled or uncontrolled.
 */
function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  style,
  ...rest
}) {
  const isControlled = value !== undefined;
  const first = defaultValue ?? (tabs[0] && (typeof tabs[0] === 'string' ? tabs[0] : tabs[0].value));
  const [internal, setInternal] = React.useState(first);
  const active = isControlled ? value : internal;
  const select = v => {
    if (!isControlled) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 2,
      borderBottom: '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), tabs.map((t, i) => {
    const val = typeof t === 'string' ? t : t.value;
    const lbl = typeof t === 'string' ? t : t.label;
    const on = val === active;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      role: "tab",
      onClick: () => select(val),
      style: {
        position: 'relative',
        padding: '9px 12px',
        background: 'transparent',
        border: 0,
        borderBottom: '2px solid ' + (on ? 'var(--text-primary)' : 'transparent'),
        marginBottom: -1,
        color: on ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: on ? 600 : 500,
        cursor: 'pointer',
        transition: 'color var(--dur-fast) var(--ease-out)'
      }
    }, lbl);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Dialog.jsx
try { (() => {
/**
 * Dialog — centered modal over a scrim. Sharp, bordered, shadowed.
 */
function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  width = 440,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'var(--blur-overlay)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '100%',
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-none)',
      boxShadow: 'var(--shadow-overlay)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, (title || onClose) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: 'var(--space-5) var(--space-5) var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontSize: 22,
      color: 'var(--text-primary)',
      lineHeight: 1.15
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      marginTop: 6
    }
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: 0,
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: 18,
      lineHeight: 1,
      padding: 2
    }
  }, "\xD7")), children && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--space-5) var(--space-5)',
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-2)',
      padding: 'var(--space-4) var(--space-5)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Toast.jsx
try { (() => {
/**
 * Toast — transient notification. Sharp, bordered, left status rule.
 */
function Toast({
  tone = 'neutral',
  title,
  message,
  onClose,
  style
}) {
  const accent = {
    neutral: 'var(--border-strong)',
    success: 'var(--green-base)',
    warning: 'var(--amber-base)',
    danger: 'var(--red-base)',
    info: 'var(--blue-base)'
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      minWidth: 280,
      maxWidth: 380,
      padding: '12px 14px',
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-default)',
      borderLeft: '2px solid ' + accent,
      borderRadius: 'var(--radius-none)',
      boxShadow: 'var(--shadow-md)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title), message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)',
      marginTop: title ? 3 : 0
    }
  }, message)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      border: 0,
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: 15,
      lineHeight: 1,
      padding: 0
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Toast.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Tooltip.jsx
try { (() => {
/**
 * Tooltip — hover label. Sharp, dark, appears on top.
 */
function Tooltip({
  label,
  side = 'top',
  children,
  style
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 6
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 6
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 6
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 6
    }
  }[side];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      zIndex: 50,
      whiteSpace: 'nowrap',
      padding: '5px 8px',
      fontSize: 11,
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      color: 'var(--neutral-50)',
      background: 'var(--neutral-950)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-none)',
      boxShadow: 'var(--shadow-md)',
      pointerEvents: 'none',
      ...pos,
      ...style
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Tooltip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/App.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React, Topbar, LibraryPanel, Canvas, Inspector, CodePanel, RelationshipsView */
function LatticeApp() {
  const {
    Dialog,
    Toast,
    Button,
    Input,
    Switch
  } = window.LatticeDesignSystem_e801cb;
  const [nodes, setNodes] = React.useState([{
    id: 'cmp_root',
    name: 'Section',
    icon: 'frame',
    x: 80,
    y: 70,
    w: 440,
    h: 150,
    label: 'Pricing — grid',
    layout: 'Grid',
    gap: 24,
    synced: true
  }, {
    id: 'cmp_head',
    name: 'Heading',
    icon: 'type',
    x: 110,
    y: 300,
    w: 240,
    h: 80,
    label: 'Simple pricing',
    layout: 'Stack',
    synced: true
  }, {
    id: 'cmp_card',
    name: 'PricingCard',
    icon: 'square',
    x: 600,
    y: 120,
    w: 220,
    h: 240,
    label: 'Card · ×3',
    layout: 'Flex column',
    gap: 12,
    synced: false
  }, {
    id: 'cmp_cta',
    name: 'Button',
    icon: 'square',
    x: 640,
    y: 420,
    w: 140,
    h: 60,
    label: 'Choose plan',
    layout: 'Flex row',
    synced: true
  }]);
  const [connections] = React.useState([{
    from: 'cmp_root',
    to: 'cmp_head',
    kind: 'child'
  }, {
    from: 'cmp_root',
    to: 'cmp_card',
    kind: 'child'
  }, {
    from: 'cmp_card',
    to: 'cmp_cta',
    kind: 'binds'
  }]);
  const [view, setView] = React.useState('design');
  const [selectedId, setSelectedId] = React.useState('cmp_card');
  const [shareOpen, setShareOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [placedCount, setPlacedCount] = React.useState(0);
  const selected = nodes.find(n => n.id === selectedId) || null;
  const layers = nodes.map((n, i) => ({
    id: n.id,
    name: n.name,
    icon: n.icon,
    depth: n.id === 'cmp_cta' ? 1 : 0
  }));
  const updateNode = (id, patch) => setNodes(ns => ns.map(n => n.id === id ? {
    ...n,
    ...patch
  } : n));
  const placeNode = c => {
    const id = 'cmp_' + Math.random().toString(36).slice(2, 6);
    const n = {
      id,
      name: c.name,
      icon: c.icon,
      x: 180 + placedCount * 28,
      y: 540 + placedCount * 18,
      w: 200,
      h: 120,
      label: c.name,
      layout: 'Flex column',
      gap: 12,
      synced: false
    };
    setNodes(ns => [...ns, n]);
    setSelectedId(id);
    setPlacedCount(p => p + 1);
    fireToast({
      tone: 'neutral',
      title: c.name + ' placed',
      message: 'Drag it into position on the canvas.'
    });
  };
  const fireToast = t => {
    setToast(t);
    clearTimeout(window.__lt);
    window.__lt = setTimeout(() => setToast(null), 3200);
  };
  const generate = () => {
    setView('code');
    fireToast({
      tone: 'success',
      title: 'Code generated',
      message: nodes.length + ' nodes → React + TypeScript.'
    });
  };
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    view: view,
    setView: setView,
    onShare: () => setShareOpen(true),
    onGenerate: generate,
    dirty: !nodes.every(n => n.synced)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      minHeight: 0
    }
  }, view === 'design' && /*#__PURE__*/React.createElement(LibraryPanel, {
    onPlace: placeNode,
    layers: layers,
    selectedId: selectedId,
    onSelect: setSelectedId
  }), view === 'design' && /*#__PURE__*/React.createElement(Canvas, {
    nodes: nodes,
    connections: connections,
    selectedId: selectedId,
    onSelect: setSelectedId
  }), view === 'code' && /*#__PURE__*/React.createElement(CodePanel, {
    nodes: nodes
  }), view === 'rel' && /*#__PURE__*/React.createElement(RelationshipsView, {
    nodes: nodes,
    connections: connections,
    onSelect: id => {
      setSelectedId(id);
      setView('design');
    }
  }), view === 'design' && /*#__PURE__*/React.createElement(Inspector, {
    node: selected,
    onChange: updateNode,
    connections: connections
  })), /*#__PURE__*/React.createElement(Dialog, {
    open: shareOpen,
    onClose: () => setShareOpen(false),
    title: "Share project",
    description: "Anyone with the link can view this canvas.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setShareOpen(false)
    }, "Close"), /*#__PURE__*/React.createElement(Button, {
      variant: "solid",
      onClick: () => {
        setShareOpen(false);
        fireToast({
          tone: 'success',
          title: 'Link copied'
        });
      },
      iconLeft: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "link"
      })
    }, "Copy link"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Invite by email",
    placeholder: "name@studio.com",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "mail"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-primary)'
    }
  }, "Allow editing"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "Collaborators can change nodes")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 18,
      right: 18,
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement(Toast, _extends({}, toast, {
    onClose: () => setToast(null)
  }))));
}
window.LatticeApp = LatticeApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/Canvas.jsx
try { (() => {
/* global React */
// Center canvas — node frames on the lattice grid, with connection lines.
function Canvas({
  nodes,
  connections,
  selectedId,
  onSelect
}) {
  const W = 1600,
    H = 1000;
  return /*#__PURE__*/React.createElement("div", {
    className: "lattice-grid",
    style: {
      flex: 1,
      minWidth: 0,
      position: 'relative',
      overflow: 'auto',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: W,
      height: H
    },
    onClick: () => onSelect(null)
  }, /*#__PURE__*/React.createElement("svg", {
    width: W,
    height: H,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, connections.map((c, i) => {
    const a = nodes.find(n => n.id === c.from),
      b = nodes.find(n => n.id === c.to);
    if (!a || !b) return null;
    const x1 = a.x + a.w,
      y1 = a.y + a.h / 2,
      x2 = b.x,
      y2 = b.y + b.h / 2;
    const mx = (x1 + x2) / 2;
    const active = c.from === selectedId || c.to === selectedId;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("path", {
      d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`,
      fill: "none",
      stroke: active ? 'var(--text-primary)' : 'var(--border-strong)',
      strokeWidth: active ? 1.5 : 1
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x2,
      cy: y2,
      r: "3",
      fill: active ? 'var(--text-primary)' : 'var(--border-strong)'
    }));
  })), nodes.map(n => {
    const sel = n.id === selectedId;
    return /*#__PURE__*/React.createElement("div", {
      key: n.id,
      onClick: e => {
        e.stopPropagation();
        onSelect(n.id);
      },
      style: {
        position: 'absolute',
        left: n.x,
        top: n.y,
        width: n.w,
        height: n.h,
        background: 'var(--surface-card)',
        border: '1px solid ' + (sel ? 'var(--text-primary)' : 'var(--border-default)'),
        boxShadow: sel ? '0 0 0 1px var(--text-primary)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: sel ? 'var(--text-primary)' : 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": n.icon,
      style: {
        width: 12,
        height: 12
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, n.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)'
      }
    }, n.w, "\xD7", n.h)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-disabled)',
        fontSize: 12
      }
    }, n.label), sel && [['nw', -3, -3], ['ne', n.w - 3, -3], ['sw', -3, n.h - 3], ['se', n.w - 3, n.h - 3]].map(([k, x, y]) => /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        position: 'absolute',
        left: x,
        top: y,
        width: 6,
        height: 6,
        background: 'var(--bg-app)',
        border: '1px solid var(--text-primary)'
      }
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 14,
      left: 14,
      display: 'flex',
      gap: 0,
      border: '1px solid var(--border-default)',
      background: 'var(--surface)'
    }
  }, [['minus', ''], ['100%', 'pct'], ['plus', '']].map(([ic, t], i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    style: {
      width: t ? 48 : 30,
      height: 30,
      border: 0,
      borderRight: i < 2 ? '1px solid var(--border-subtle)' : 0,
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: 'var(--font-mono)'
    }
  }, t ? '100%' : /*#__PURE__*/React.createElement("i", {
    "data-lucide": ic,
    style: {
      width: 13,
      height: 13
    }
  })))));
}
window.Canvas = Canvas;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/Canvas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/CodePanel.jsx
try { (() => {
/* global React */
// Code view — generated code with a file rail and mono editor.
function CodePanel({
  nodes
}) {
  const {
    Tag,
    Button
  } = window.LatticeDesignSystem_e801cb;
  const [file, setFile] = React.useState('PricingPage.tsx');
  const files = ['PricingPage.tsx', 'PricingCard.tsx', 'styles.css'];
  const code = [{
    t: 'export function ',
    c: 'var(--text-secondary)'
  }, {
    t: 'PricingPage',
    c: 'var(--blue-base)'
  }, {
    t: '() {\n',
    c: 'var(--text-secondary)'
  }, {
    t: '  return (\n',
    c: 'var(--text-muted)'
  }, {
    t: '    <Section',
    c: 'var(--green-base)'
  }, {
    t: ' layout=',
    c: 'var(--text-secondary)'
  }, {
    t: '"grid"',
    c: 'var(--amber-base)'
  }, {
    t: ' gap=',
    c: 'var(--text-secondary)'
  }, {
    t: '{24}',
    c: 'var(--amber-base)'
  }, {
    t: '>\n',
    c: 'var(--green-base)'
  }, {
    t: '      <Heading',
    c: 'var(--green-base)'
  }, {
    t: '>Simple pricing</Heading>\n',
    c: 'var(--text-primary)'
  }, {
    t: '      {plans.map(',
    c: 'var(--text-muted)'
  }, {
    t: 'plan',
    c: 'var(--text-primary)'
  }, {
    t: ' => (\n',
    c: 'var(--text-muted)'
  }, {
    t: '        <PricingCard',
    c: 'var(--green-base)'
  }, {
    t: ' key=',
    c: 'var(--text-secondary)'
  }, {
    t: '{plan.id}',
    c: 'var(--amber-base)'
  }, {
    t: ' {...plan} />\n',
    c: 'var(--text-secondary)'
  }, {
    t: '      ))}\n',
    c: 'var(--text-muted)'
  }, {
    t: '    </Section>\n',
    c: 'var(--green-base)'
  }, {
    t: '  );\n}',
    c: 'var(--text-muted)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200,
      flex: 'none',
      borderRight: '1px solid var(--border-subtle)',
      padding: 10,
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: 'var(--text-muted)',
      margin: '4px 6px 10px'
    }
  }, "Generated"), files.map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setFile(f),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '7px 8px',
      background: f === file ? 'var(--surface-hover)' : 'transparent',
      border: 0,
      color: f === file ? 'var(--text-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: 12.5,
      fontFamily: 'var(--font-mono)',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "file-code",
    style: {
      width: 13,
      height: 13,
      opacity: 0.7
    }
  }), f))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, file), /*#__PURE__*/React.createElement(Tag, {
    shape: "pill"
  }, "React + TS"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "copy"
    })
  }, "Copy"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "download"
    })
  }, "Export"))), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: '18px 20px',
      flex: 1,
      overflow: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      lineHeight: 1.7,
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      whiteSpace: 'pre-wrap'
    }
  }, code.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      color: s.c
    }
  }, s.t))))));
}
window.CodePanel = CodePanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/CodePanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/Inspector.jsx
try { (() => {
/* global React */
// Right panel — inspector for the selected node.
function Inspector({
  node,
  onChange,
  connections
}) {
  const {
    Input,
    Select,
    Switch,
    Tag,
    Badge,
    Button
  } = window.LatticeDesignSystem_e801cb;
  if (!node) {
    return /*#__PURE__*/React.createElement("aside", {
      style: inspAside
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 24,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "mouse-pointer-click",
      style: {
        width: 22,
        height: 22,
        color: 'var(--text-disabled)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-serif-display)',
        fontSize: 20,
        color: 'var(--text-secondary)'
      }
    }, "Nothing selected"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--text-muted)',
        maxWidth: 180
      }
    }, "Select a node on the canvas to inspect its properties.")));
  }
  const rel = connections.filter(c => c.from === node.id || c.to === node.id).length;
  const set = k => v => onChange(node.id, {
    [k]: v
  });
  return /*#__PURE__*/React.createElement("aside", {
    style: inspAside
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": node.icon,
    style: {
      width: 15,
      height: 15,
      color: 'var(--text-secondary)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13,
      fontWeight: 600
    }
  }, node.name), /*#__PURE__*/React.createElement(Badge, {
    tone: node.synced ? 'success' : 'warning'
  }, node.synced ? 'Synced' : 'Modified')), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      overflow: 'auto',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Section, {
    title: "Dimensions"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Width",
    value: node.w,
    onChange: e => set('w')(+e.target.value || 0),
    size: "sm"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Height",
    value: node.h,
    onChange: e => set('h')(+e.target.value || 0),
    size: "sm"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "X",
    value: node.x,
    onChange: e => set('x')(+e.target.value || 0),
    size: "sm"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Y",
    value: node.y,
    onChange: e => set('y')(+e.target.value || 0),
    size: "sm"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Layout"
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Direction",
    options: ['Flex row', 'Flex column', 'Grid', 'Stack'],
    size: "sm",
    defaultValue: node.layout
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10
    }
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Gap",
    value: node.gap ?? 16,
    onChange: e => set('gap')(+e.target.value || 0),
    size: "sm"
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Behavior"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Responsive",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Clip content"
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Lock position"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: `Relationships · ${rel}`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "parent: Section"), /*#__PURE__*/React.createElement(Tag, {
    onRemove: () => {}
  }, "binds: Pricing data")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    fullWidth: true,
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "unlink"
    })
  }, "Detach"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    fullWidth: true
  }, "Delete")));
}
const inspAside = {
  width: 280,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: '1px solid var(--border-subtle)',
  background: 'var(--surface)',
  minHeight: 0
};
function Section({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: 'var(--text-muted)',
      marginBottom: 9
    }
  }, title), children);
}
window.Inspector = Inspector;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/Inspector.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/LibraryPanel.jsx
try { (() => {
/* global React */
// Left panel — component library (searchable) over a layers tree.
function LibraryPanel({
  onPlace,
  layers,
  selectedId,
  onSelect
}) {
  const {
    Input,
    Badge
  } = window.LatticeDesignSystem_e801cb;
  const [q, setQ] = React.useState('');
  const library = [{
    name: 'Frame',
    icon: 'frame'
  }, {
    name: 'Stack',
    icon: 'rows-3'
  }, {
    name: 'Grid',
    icon: 'layout-grid'
  }, {
    name: 'Text',
    icon: 'type'
  }, {
    name: 'Button',
    icon: 'square'
  }, {
    name: 'Input',
    icon: 'text-cursor-input'
  }, {
    name: 'Image',
    icon: 'image'
  }, {
    name: 'Divider',
    icon: 'minus'
  }];
  const filtered = library.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--sidebar-w)',
      flex: 'none',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-subtle)',
      background: 'var(--surface)',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: 'var(--text-muted)',
      marginBottom: 10
    }
  }, "Library"), /*#__PURE__*/React.createElement(Input, {
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "search"
    }),
    placeholder: "Search components",
    size: "sm",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6,
      marginTop: 10
    }
  }, filtered.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.name,
    onClick: () => onPlace(c),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 9px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: 12,
      fontFamily: 'var(--font-sans)',
      transition: 'border-color var(--dur-fast), color var(--dur-fast)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--border-strong)';
      e.currentTarget.style.color = 'var(--text-primary)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
      e.currentTarget.style.color = 'var(--text-secondary)';
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": c.icon,
    style: {
      width: 14,
      height: 14
    }
  }), c.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      flex: 1,
      minHeight: 0,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: 'var(--text-muted)'
    }
  }, "Layers"), /*#__PURE__*/React.createElement(Badge, null, layers.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, layers.map(l => /*#__PURE__*/React.createElement("button", {
    key: l.id,
    onClick: () => onSelect(l.id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 8px',
      paddingLeft: 8 + l.depth * 16,
      background: l.id === selectedId ? 'var(--surface-hover)' : 'transparent',
      border: 0,
      borderLeft: '2px solid ' + (l.id === selectedId ? 'var(--text-primary)' : 'transparent'),
      color: l.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: 12.5,
      fontFamily: 'var(--font-sans)',
      textAlign: 'left',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": l.icon,
    style: {
      width: 13,
      height: 13,
      opacity: 0.7
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, l.name))))));
}
window.LibraryPanel = LibraryPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/LibraryPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/RelationshipsView.jsx
try { (() => {
/* global React */
// Relationships view — node graph as a dependency list with connection rules.
function RelationshipsView({
  nodes,
  connections,
  onSelect
}) {
  const {
    Badge,
    Tag
  } = window.LatticeDesignSystem_e801cb;
  return /*#__PURE__*/React.createElement("div", {
    className: "lattice-grid",
    style: {
      flex: 1,
      minWidth: 0,
      overflow: 'auto',
      background: 'var(--bg-app)',
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontSize: 34,
      letterSpacing: '-0.02em',
      marginBottom: 6
    }
  }, "Relationships"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-secondary)',
      marginBottom: 24
    }
  }, "How ", nodes.length, " nodes bind, nest, and depend on one another."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, nodes.map(n => {
    const out = connections.filter(c => c.from === n.id);
    return /*#__PURE__*/React.createElement("div", {
      key: n.id,
      onClick: () => onSelect(n.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": n.icon,
      style: {
        width: 16,
        height: 16,
        color: 'var(--text-secondary)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 150
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, n.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)'
      }
    }, n.id)), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--border-strong)',
        fontFamily: 'var(--font-mono)'
      }
    }, "\u2192"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        flex: 1
      }
    }, out.length === 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-disabled)'
      }
    }, "No outbound links"), out.map((c, i) => {
      const t = nodes.find(x => x.id === c.to);
      return /*#__PURE__*/React.createElement(Tag, {
        key: i
      }, c.kind, ": ", t ? t.name : c.to);
    })), /*#__PURE__*/React.createElement(Badge, {
      tone: n.synced ? 'success' : 'warning'
    }, n.synced ? 'Synced' : 'Modified'));
  }))));
}
window.RelationshipsView = RelationshipsView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/RelationshipsView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lattice/Topbar.jsx
try { (() => {
/* global React */
// Top bar — logo, breadcrumb, view tabs, collaborators, generate action.
function Topbar({
  view,
  setView,
  onShare,
  onGenerate,
  dirty
}) {
  const {
    IconButton,
    Tabs,
    Avatar,
    Button,
    Tooltip
  } = window.LatticeDesignSystem_e801cb;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 'var(--topbar-h)',
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 12px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: "Lattice",
    style: {
      height: 22,
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
      color: 'var(--text-muted)',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", null, "Marketing site"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--border-strong)'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)',
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }
  }, "Pricing page"), dirty && /*#__PURE__*/React.createElement("span", {
    title: "Unsaved",
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'var(--amber-base)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 12
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: view,
    onChange: setView,
    tabs: [{
      value: 'design',
      label: 'Design'
    }, {
      value: 'code',
      label: 'Code'
    }, {
      value: 'rel',
      label: 'Relationships'
    }],
    style: {
      borderBottom: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, ['Rin Sato', 'Yuki Mori', 'A K'].map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i ? -6 : 0,
      outline: '2px solid var(--surface)',
      borderRadius: '50%',
      position: 'relative',
      zIndex: 3 - i
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: "sm"
  })))), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Undo"
  }, /*#__PURE__*/React.createElement(IconButton, {
    title: "Undo"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "undo-2"
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Settings"
  }, /*#__PURE__*/React.createElement(IconButton, {
    title: "Settings"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "settings"
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    onClick: onShare,
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "share-2"
    })
  }, "Share"), /*#__PURE__*/React.createElement(Button, {
    variant: "solid",
    size: "sm",
    onClick: onGenerate,
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "zap"
    })
  }, "Generate code")));
}
window.Topbar = Topbar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lattice/Topbar.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

})();
