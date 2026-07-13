/* global window */
// Animation preset library — adaptive, per-track looping motions for the timeline editor.
//
// Flow (see TimelineEditor): the user selects a TRACK, opens Presets (filtered to motions that fit
// that track's value type), picks one, tweaks it in a dialog with a live preview, then applies. Each
// preset is a motion GENERATOR that builds keyframes RELATIVE to the track's current value, so the
// same "Pulse" works on scale, icon size, gap, font size… and "Spin" works on any rotation prop.
// Rotation is special-cased so a looped spin always turns forward (0°→360°), never reversing.

// ── Value categories ─────────────────────────────────────────────────────────────────────────────
// Which family a prop belongs to decides which presets are offered and how values are generated.
const AP_ANGLE = new Set(['rotation', 'iconRotate', 'btnIconRotate']);
const AP_OPACITY = new Set(['opacity', 'iconOpacity', 'btnIconOpacity']);
const AP_POSITION = new Set(['x', 'y']);
const AP_COLOR = new Set(['fillColor', 'textColor', 'borderColor', 'btnIconColor', 'iconColor', 'placeholderColor']);
// Positive-magnitude numbers where grow / shrink reads naturally.
const AP_NUMBER = new Set(['scale', 'w', 'h', 'radius', 'borderWidth', 'fontSize',
  'iconSize', 'btnIconSize', 'iconGap', 'btnIconGap', 'iconStroke', 'gap', 'skewX', 'skewY']);

function apCategory(prop) {
  if (AP_ANGLE.has(prop)) return 'angle';
  if (AP_OPACITY.has(prop)) return 'opacity';
  if (AP_POSITION.has(prop)) return 'position';
  if (AP_COLOR.has(prop)) return 'color';
  if (AP_NUMBER.has(prop)) return 'number';
  return null; // text / icon glyph / enum / bool → no preset motion
}

// Clamp generated values for bounded props so a preset can't drive them out of range.
function apClamp(prop, v) {
  if (typeof v !== 'number') return v; // colours pass through
  if (AP_OPACITY.has(prop)) return Math.max(0, Math.min(100, v));
  if (prop === 'scale' || AP_NUMBER.has(prop)) return Math.max(0, v);
  return v;
}

// ── Preset catalogue ─────────────────────────────────────────────────────────────────────────────
// `cats` gates which tracks may use it. `params` lists the knobs the dialog shows (duration + easing
// are always shown). `amountLabel` names the amount knob for this preset; `unit`/`min`/`max`/`step`
// tune its scrubber. `defaults` seed the dialog.
const ANIM_PRESETS = [
  { id: 'spin',   label: 'Spin',   icon: 'loader-circle',   hint: 'Turn a full circle — loops seamlessly',
    cats: ['angle'], params: ['direction', 'repeats'], defaults: { direction: 1, repeats: 1 } },
  { id: 'wobble', label: 'Wobble', icon: 'move-diagonal-2', hint: 'Rock back and forth',
    cats: ['angle'], params: ['amount', 'repeats'], amountLabel: 'Angle', unit: '°', min: 1, max: 180, step: 1, defaults: { amount: 10, repeats: 2 } },
  { id: 'pulse',  label: 'Pulse',  icon: 'maximize',        hint: 'Grow a little, then settle back',
    cats: ['number'], params: ['amount', 'repeats'], amountLabel: 'Grow', unit: '%', min: 1, max: 200, step: 1, defaults: { amount: 12, repeats: 1 } },
  { id: 'dip',    label: 'Dip',    icon: 'minimize',        hint: 'Shrink, then back',
    cats: ['number'], params: ['amount', 'repeats'], amountLabel: 'Shrink', unit: '%', min: 1, max: 99, step: 1, defaults: { amount: 30, repeats: 1 } },
  { id: 'fade',   label: 'Fade',   icon: 'contrast',        hint: 'Fade down and back up',
    cats: ['opacity'], params: ['amount', 'repeats'], amountLabel: 'Min opacity', unit: '%', min: 0, max: 99, step: 1, defaults: { amount: 40, repeats: 1 } },
  { id: 'bounce', label: 'Bounce', icon: 'arrow-up-down',   hint: 'Hop and drop back',
    cats: ['position'], params: ['direction', 'amount', 'repeats'], amountLabel: 'Distance', unit: 'px', min: 1, max: 400, step: 1, defaults: { direction: -1, amount: 16, repeats: 1 } },
  { id: 'shake',  label: 'Shake',  icon: 'move-horizontal', hint: 'Quick side-to-side wiggle',
    cats: ['position'], params: ['amount', 'repeats'], amountLabel: 'Distance', unit: 'px', min: 1, max: 100, step: 1, defaults: { amount: 6, repeats: 3 } },
  { id: 'flash',  label: 'Flash',  icon: 'zap',             hint: 'Blink toward a highlight and back',
    cats: ['color'], params: ['amount', 'repeats'], amountLabel: 'Intensity', unit: '%', min: 5, max: 100, step: 5, defaults: { amount: 70, repeats: 1 } },
];

function apPreset(id) { return ANIM_PRESETS.find(p => p.id === id) || null; }
function apPresetsFor(cat) { return cat ? ANIM_PRESETS.filter(p => p.cats.includes(cat)) : []; }
function apEaseDefault(id) { return id === 'spin' ? 'linear' : 'ease-in-out'; }

// ── Keyframe generators ──────────────────────────────────────────────────────────────────────────
// All take the resolved base value and emit keys over [0, D]; they start and end on `base` (except
// spin, which ends a whole number of turns forward) so the loop closes cleanly.
function apOscillate(base, amt, reps, D, ease, clamp) {
  const keys = [], per = D / reps;
  for (let i = 0; i < reps; i++) {
    const s = i * per;
    keys.push({ t: Math.round(s), value: clamp(base), ease });
    keys.push({ t: Math.round(s + per * 0.25), value: clamp(base + amt), ease });
    keys.push({ t: Math.round(s + per * 0.5), value: clamp(base), ease });
    keys.push({ t: Math.round(s + per * 0.75), value: clamp(base - amt), ease });
  }
  keys.push({ t: D, value: clamp(base), ease });
  return keys;
}
function apSwell(base, peak, reps, D, ease, clamp) {
  const keys = [], per = D / reps;
  for (let i = 0; i < reps; i++) {
    const s = i * per;
    keys.push({ t: Math.round(s), value: clamp(base), ease });
    keys.push({ t: Math.round(s + per * 0.5), value: clamp(peak), ease });
  }
  keys.push({ t: D, value: clamp(base), ease });
  return keys;
}
function apHop(base, delta, reps, D, clamp) {
  const keys = [], per = D / reps;
  for (let i = 0; i < reps; i++) {
    const s = i * per;
    keys.push({ t: Math.round(s), value: clamp(base), ease: 'ease-out' });
    keys.push({ t: Math.round(s + per * 0.4), value: clamp(base + delta), ease: 'ease-in' });
  }
  keys.push({ t: D, value: clamp(base), ease: 'ease-out' });
  return keys;
}

// Build the keyframes for `presetId` given ctx { prop, base, direction, amount, repeats, easing } and
// a duration D (ms). Returns [{t, value, ease}]. Pure — the dialog calls it live for the preview.
function buildPresetKeys(presetId, ctx, D) {
  D = Math.max(50, Math.round(+D || 1000));
  const prop = ctx.prop;
  const base = (ctx.base != null && !isNaN(+ctx.base)) ? +ctx.base : ctx.base; // colours stay strings
  const ease = ctx.easing || apEaseDefault(presetId);
  const dir = ctx.direction || 1;
  const reps = Math.max(1, Math.round(ctx.repeats || 1));
  const amt = +ctx.amount || 0;
  const clamp = (v) => apClamp(prop, v);
  const nb = +base || 0;

  switch (presetId) {
    case 'spin':
      // End a whole number of turns forward (or back) of the start → same visual angle, seamless loop.
      return [{ t: 0, value: nb, ease }, { t: D, value: nb + dir * 360 * reps, ease }];
    case 'wobble':
      return apOscillate(nb, amt, reps, D, ease, clamp);
    case 'shake':
      return apOscillate(nb, amt, reps, D, ease, clamp);
    case 'pulse':
      return apSwell(nb, nb * (1 + amt / 100), reps, D, ease, clamp);
    case 'dip':
      return apSwell(nb, nb * (1 - amt / 100), reps, D, ease, clamp);
    case 'fade':
      return apSwell(nb, amt, reps, D, ease, clamp); // amount = the minimum opacity to dip to
    case 'bounce':
      return apHop(nb, dir * amt, reps, D, clamp);
    case 'flash': {
      // Blend the base colour toward a bright highlight by `amt`%, and back, `reps` times.
      const target = '#ffffff';
      const hi = window.lerpVal ? window.lerpVal(prop, base, target, Math.max(0, Math.min(1, amt / 100))) : base;
      const keys = [], per = D / reps;
      for (let i = 0; i < reps; i++) {
        const s = i * per;
        keys.push({ t: Math.round(s), value: base, ease });
        keys.push({ t: Math.round(s + per * 0.5), value: hi, ease });
      }
      keys.push({ t: D, value: base, ease });
      return keys;
    }
    default:
      return [{ t: 0, value: base, ease }, { t: D, value: base, ease }];
  }
}

window.ANIM_PRESETS = ANIM_PRESETS;
window.apCategory = apCategory;
window.apPreset = apPreset;
window.apPresetsFor = apPresetsFor;
window.apEaseDefault = apEaseDefault;
window.buildPresetKeys = buildPresetKeys;
