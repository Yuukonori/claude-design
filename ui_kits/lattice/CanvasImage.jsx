/* global React */
// Renders the current page to a PNG so the AI can SEE the design instead of only reading its
// coordinates. The agent kept shipping layouts that overflowed the artboard or left dead bands —
// failures that are obvious in a picture and nearly invisible in 40 rows of {x,y,w,h} JSON.
//
// WHY DRAW, RATHER THAN CAPTURE THE REAL DOM:
// PreviewCanvas renders through the design system (DS.Switch, Lucide SVGs, WebGL shader fills, CSS
// vars, custom fonts). Rasterizing THAT needs a DOM-capture lib vendored in, and only works while the
// preview is actually mounted — the agent runs from the design view, or with no preview at all. This
// draws straight from node data instead: a pure function of the same state we already serialize, so it
// always works, needs no dependency, and is deterministic (same nodes -> same bytes -> cacheable).
//
// It is a SCHEMATIC, not a screenshot. It is faithful about the things the agent gets wrong — geometry,
// bounds, fills, type scale, hierarchy — and approximate about the things it doesn't (exact glyphs,
// icon art, shader fills). The audit prompt says so explicitly, so the model never reports on the
// drawing's own limitations as if they were design faults.

// Everything outside the artboard is painted in this margin so the model can SEE overflow as overflow
// rather than having to compare numbers. Without a visible frame, a node at y=1200 on a 1024 artboard
// looks exactly like a node at y=200.
const CI_MARGIN = 48;
// THE TWO AXES ARE NOT THE SAME, and conflating them is a real bug this file already shipped once.
// Horizontal: past the left/right artboard edge is genuinely OFF-CANVAS — nothing scrolls sideways, the
// user can never see it, and it is always a fault.
// Vertical: past the bottom is the SCROLL REGION. A landing page is meant to run several screens deep;
// the artboard's bottom is just the fold. Labelling that "off-canvas" told the model a good long page
// was broken and invited the critic to cut it down. So: mark the folds, don't condemn them.
const CI_FOLD_LIMIT = 12;   // stop drawing fold lines eventually; a 12-screen page is its own problem
// Cap the long edge: image tokens scale with pixels, and detail beyond this buys the model nothing for
// layout judgment. 1024 keeps a 1448-wide artboard legible at ~0.7 scale.
const CI_MAX_EDGE = 1024;

const CI_WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const CI_FONT = {
  'Grotesk (UI)': 'system-ui, sans-serif',
  'Serif display': 'Georgia, "Times New Roman", serif',
  'Mono': 'ui-monospace, Menlo, monospace',
  'System': 'system-ui, sans-serif',
};
// Fallbacks for the theme tokens node styles lean on. Resolved from the live document when we can, so
// the drawing matches the user's actual theme rather than a guess.
const CI_FALLBACK = {
  bg: '#0B0F14', surface: '#12161D', border: '#262B36',
  text: '#E6EAF2', muted: '#8B93A7', accent: '#3B82F6',
};
function ciToken(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    const t = String(v || '').trim();
    return t || fallback;
  } catch (e) { return fallback; }
}

// A node's colour props may be a hex, a var() token, or empty. Canvas2D understands neither var() nor
// an empty string, and silently ignores an invalid fillStyle — which would draw the PREVIOUS colour
// and quietly lie to the model about the palette.
function ciColor(v, fallback) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return fallback;
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(s);
  if (m) return ciToken(m[1], (m[2] || '').trim() || fallback);
  if (/^(#|rgb|hsl)/i.test(s)) return s;
  return fallback;
}

function ciKind(n) {
  if (n.kind) return n.kind;
  const byIcon = { frame: 'frame', 'rows-3': 'stack', 'layout-grid': 'grid', type: 'heading', square: 'button', 'text-cursor-input': 'input', image: 'image', minus: 'divider' };
  return byIcon[n.icon] || 'frame';
}

const CI_CONTAINER = { frame: 1, stack: 1, grid: 1, card: 1 };
// Kinds whose label IS the component's visible text, centred in the box rather than set as body copy.
const CI_CHIP = { button: 1, badge: 1 };

function ciRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r || 0, Math.min(Math.abs(w), Math.abs(h)) / 2));
  ctx.beginPath();
  if (!rr) { ctx.rect(x, y, w, h); return; }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Word-wrap inside the box and clip to it. Text that would spill is truncated with an ellipsis rather
// than painted past the edge — overflowing GLYPHS would read as a layout bug that isn't there (the
// editor wraps text), and we only want real geometry faults to show up.
function ciWrapText(ctx, text, x, y, maxW, maxH, lineH) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const next = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(next).width <= maxW || !line) line = next;
    else { lines.push(line); line = words[i]; }
  }
  if (line) lines.push(line);
  const max = Math.max(1, Math.floor(maxH / lineH));
  for (let i = 0; i < Math.min(lines.length, max); i++) {
    let t = lines[i];
    if (i === max - 1 && lines.length > max) {
      while (t && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      t += '…';
    }
    ctx.fillText(t, x, y + i * lineH);
  }
}

// Kind-specific hints. The point is that the model can tell a button from an input from a chart at a
// glance — the same way you can squint at a wireframe and read it — not pixel fidelity.
function ciDrawKindHint(ctx, n, kind, x, y, w, h, tokens) {
  const muted = ciColor(n.textColor, tokens.muted);
  if (kind === 'chart') {
    const data = Array.isArray(n.chartData) ? n.chartData : [40, 65, 45, 80, 60];
    const type = n.chartType || 'bar';
    const pad = 10, cw = w - pad * 2, ch = h - pad * 2;
    if (!data.length || cw <= 0 || ch <= 0) return;
    const max = Math.max.apply(null, data) || 1;
    ctx.save();
    ctx.strokeStyle = tokens.accent; ctx.fillStyle = tokens.accent;
    if (type === 'line' || type === 'area') {
      ctx.beginPath();
      data.forEach((v, i) => {
        const px = x + pad + (cw * i) / Math.max(1, data.length - 1);
        const py = y + pad + ch - (ch * v) / max;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.lineWidth = 2; ctx.stroke();
    } else if (type === 'pie') {
      const r = Math.min(cw, ch) / 2, cx = x + w / 2, cy = y + h / 2;
      let a = -Math.PI / 2;
      const total = data.reduce((s, v) => s + v, 0) || 1;
      data.forEach((v, i) => {
        const slice = (v / total) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + slice); ctx.closePath();
        ctx.globalAlpha = 1 - (i / data.length) * 0.6; ctx.fill();
        a += slice;
      });
    } else {
      const bw = cw / (data.length * 1.6);
      data.forEach((v, i) => {
        const bh = (ch * v) / max;
        ctx.fillRect(x + pad + i * (cw / data.length), y + pad + ch - bh, bw, bh);
      });
    }
    ctx.restore();
    return;
  }
  if (kind === 'image' || kind === 'avatar') {
    // Cross-box: the universal "image goes here" mark, so an unfilled slot is obvious.
    ctx.save();
    ctx.strokeStyle = tokens.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'icon') {
    ctx.save();
    ctx.strokeStyle = muted; ctx.lineWidth = 1.5;
    const r = Math.min(w, h) * 0.3;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'switch' || kind === 'checkbox' || kind === 'radio') {
    ctx.save();
    ctx.strokeStyle = muted; ctx.lineWidth = 1.5;
    const s = 14, cy = y + h / 2 - s / 2;
    if (kind === 'radio') { ctx.beginPath(); ctx.arc(x + 4 + s / 2, y + h / 2, s / 2, 0, Math.PI * 2); ctx.stroke(); }
    else { ciRoundRect(ctx, x + 4, cy, s, s, kind === 'switch' ? 7 : 3); ctx.stroke(); }
    ctx.restore();
    return;
  }
  if (kind === 'divider' || kind === 'line') {
    ctx.save();
    ctx.strokeStyle = ciColor(n.fillColor || n.borderColor, tokens.border); ctx.lineWidth = Math.max(1, n.borderWidth || 1);
    ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'table') {
    const cols = String(n.tableCols || 'A, B, C').split(',').length;
    const rows = Math.min(5, String(n.tableRows || '').split('\n').filter(Boolean).length || 3);
    ctx.save();
    ctx.strokeStyle = tokens.border; ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) { const px = x + (w * i) / cols; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const py = y + (h * i) / rows; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke(); }
    ctx.restore();
    return;
  }
}

// Draw one node. Nodes are flat and absolutely positioned (parent/child is a hierarchy edge, not DOM
// nesting), so painting them in tree order — parents before children — reproduces the real stacking.
function ciDrawNode(ctx, n, tokens) {
  const kind = ciKind(n);
  const x = n.x, y = n.y, w = Math.max(1, n.w), h = Math.max(1, n.h);
  const radius = n.radius || 0;

  const fill = String(n.fillColor || '').trim();
  const hasFill = !!fill;
  const bw = n.borderWidth || 0;

  ctx.save();
  if (hasFill) { ctx.fillStyle = ciColor(fill, tokens.surface); ciRoundRect(ctx, x, y, w, h, radius); ctx.fill(); }
  // A container with no fill still gets a hairline so the model can read the layout structure — an
  // invisible frame is exactly the thing whose bounds we need it to judge.
  if (bw > 0) {
    ctx.strokeStyle = ciColor(n.borderColor, tokens.border); ctx.lineWidth = bw;
    ciRoundRect(ctx, x + bw / 2, y + bw / 2, w - bw, h - bw, radius); ctx.stroke();
  } else if (CI_CONTAINER[kind] && !hasFill) {
    ctx.strokeStyle = tokens.border; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ciRoundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, radius); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();

  ctx.save();
  ciRoundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ciDrawKindHint(ctx, n, kind, x, y, w, h, tokens);

  const label = n.label != null && n.label !== '' ? String(n.label) : (kind === 'input' || kind === 'textarea' ? String(n.placeholder || '') : '');
  if (label) {
    const fs = n.fontSize || (kind === 'heading' ? 28 : kind === 'button' ? 13 : 14);
    const weight = CI_WEIGHT[n.fontWeight] || (kind === 'heading' ? 600 : 400);
    const family = CI_FONT[n.fontFamily] || (kind === 'heading' ? CI_FONT['Serif display'] : CI_FONT['Grotesk (UI)']);
    // Match PreviewCanvas: a node with a fill and no explicit textColor gets dark text on it.
    ctx.fillStyle = ciColor(n.textColor, hasFill && !n.textColor ? '#000000' : tokens.text);
    ctx.font = weight + ' ' + fs + 'px ' + family;
    ctx.textBaseline = 'top';
    const pad = n.padding != null ? Math.min(n.padding, 24) : (CI_CHIP[kind] ? 0 : 8);
    if (CI_CHIP[kind]) {
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h / 2 - fs * 0.6, w - 8);
    } else {
      ctx.textAlign = 'left';
      const tx = x + pad + (kind === 'checkbox' || kind === 'switch' || kind === 'radio' ? 24 : 0);
      ciWrapText(ctx, label, tx, y + pad, Math.max(8, w - pad * 2 - (tx - x - pad)), Math.max(fs, h - pad * 2), fs * 1.4);
    }
  }
  ctx.restore();
}

// nodes/connections/artboard -> { dataUrl, mimeType, base64, width, height }, or null if there is
// nothing to show. `connections` gives the child edges, which fix the paint order.
function renderCanvasImage(nodes, connections, artboard, opts) {
  const o = opts || {};
  const list = (nodes || []).filter(n => n && !n.hidden);
  const art = artboard && artboard.w ? artboard : { w: 1440, h: 1024 };
  if (!list.length) return null;

  const tokens = {
    bg: ciToken('--bg-app', CI_FALLBACK.bg),
    surface: ciToken('--surface', CI_FALLBACK.surface),
    border: ciToken('--border-subtle', CI_FALLBACK.border),
    text: ciToken('--text-primary', CI_FALLBACK.text),
    muted: ciToken('--text-muted', CI_FALLBACK.muted),
    accent: ciToken('--blue-base', CI_FALLBACK.accent),
  };

  // The drawing spans the artboard PLUS a margin, so anything the design pushed off-canvas is still
  // visible — and visibly outside. Clamping to the artboard would hide the exact fault we're after.
  let minX = 0, minY = 0, maxX = art.w, maxY = art.h;
  list.forEach(n => {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h);
  });
  minX -= CI_MARGIN; minY -= CI_MARGIN; maxX += CI_MARGIN; maxY += CI_MARGIN;

  const worldW = Math.max(1, maxX - minX), worldH = Math.max(1, maxY - minY);
  const scale = Math.min(1, CI_MAX_EDGE / Math.max(worldW, worldH));
  const cw = Math.max(1, Math.round(worldW * scale)), chh = Math.max(1, Math.round(worldH * scale));

  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = chh;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;

  // Off-canvas backdrop: deliberately distinct from the artboard so "outside" reads instantly.
  ctx.fillStyle = '#05070A';
  ctx.fillRect(0, 0, cw, chh);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);

  // The page column: the artboard's WIDTH extended down over everything the design actually occupies.
  // A scrolling page lives in this column — it is "on canvas" for its whole length. Painting only the
  // first artboard-height would have drawn the rest of a landing page as though it were nowhere.
  const pageBottom = Math.max(art.h, maxY - CI_MARGIN);
  ctx.fillStyle = ciColor(o.artboardFill, tokens.bg);
  ctx.fillRect(0, 0, art.w, pageBottom);

  const order = [];
  const seen = {};
  const childOf = {}, childrenOf = {};
  (connections || []).filter(c => c.kind === 'child').forEach(c => {
    childOf[c.to] = c.from;
    (childrenOf[c.from] || (childrenOf[c.from] = [])).push(c.to);
  });
  const byId = {};
  list.forEach(n => { byId[n.id] = n; });
  const walk = (n) => {
    if (!n || seen[n.id]) return;
    seen[n.id] = 1; order.push(n);
    (childrenOf[n.id] || []).forEach(k => walk(byId[k]));
  };
  list.filter(n => !childOf[n.id]).forEach(walk);
  list.forEach(walk);   // anything orphaned by a missing parent still gets drawn
  order.forEach(n => ciDrawNode(ctx, n, tokens));

  // Drawn on TOP of the content, so a node crossing a boundary is unmistakable.
  const hair = Math.max(1, 1 / scale);

  // The two SIDE edges, run the full length of the page. Crossing one is real overflow: nothing
  // scrolls horizontally, so anything out there is unreachable.
  ctx.strokeStyle = '#C2410C';
  ctx.lineWidth = hair;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(0, minY); ctx.lineTo(0, maxY);
  ctx.moveTo(art.w, minY); ctx.lineTo(art.w, maxY);
  ctx.stroke();

  // The folds: where each screenful ends. Dashed and quiet on purpose — a fold is a normal feature of
  // a page, not damage. The first one is the artboard's own bottom edge.
  ctx.strokeStyle = '#5B6478';
  ctx.setLineDash([6 / scale, 6 / scale]);
  ctx.lineWidth = hair;
  const folds = Math.min(CI_FOLD_LIMIT, Math.max(1, Math.ceil(pageBottom / art.h)));
  for (let f = 1; f <= folds; f++) {
    const fy = art.h * f;
    if (fy > maxY) break;
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(art.w, fy); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Fold labels, drawn unscaled so they stay legible however deep the page runs.
  ctx.fillStyle = '#5B6478';
  ctx.font = '500 10px system-ui, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  for (let f = 1; f <= folds; f++) {
    const fy = art.h * f;
    if (fy > maxY) break;
    ctx.fillText('— fold ' + f + ' (y=' + Math.round(fy) + ') · screen ' + f + ' ends here',
      (0 - minX) * scale + 4, (fy - minY) * scale - 2);
  }

  // Legend. The model reads it as part of the picture, and it is the only thing standing between
  // "this page is 3 screens tall" and "this page is broken".
  ctx.fillStyle = '#8B93A7';
  ctx.font = '500 11px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const screens = (pageBottom / art.h);
  ctx.fillText('Artboard ' + Math.round(art.w) + 'x' + Math.round(art.h) +
    ' · page is ' + screens.toFixed(1) + ' screens tall (scrolls — normal)', 6, 5);
  ctx.fillText('Dashed = fold (page scrolls past it, fine). Orange = side edges: content past them is OFF-CANVAS and is a fault.', 6, 19);

  let dataUrl;
  try { dataUrl = cv.toDataURL('image/png'); } catch (e) { return null; }
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return { dataUrl: dataUrl, mimeType: 'image/png', base64: base64, width: cw, height: chh };
}

window.renderCanvasImage = renderCanvasImage;
