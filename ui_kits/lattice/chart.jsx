/* global React */
// Inline-SVG chart renderer (bar / line / area / pie / donut). Follows the dataviz method:
// validated dark categorical palette, thin marks, rounded data-ends, 2px surface gaps,
// recessive axes, text in text-tokens (not series color), direct labels over dense legends.

// Validated dark-mode categorical order (node validate_palette.js → all checks pass; CVD floor
// band, so slices carry direct labels). Ordering is the CVD-safety mechanism — do not reorder.
const CAT = ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'];
const GAP = '#0d0f14'; // surface gap/ring color (dark)

function nums(data) {
  return (Array.isArray(data) ? data : String(data || '').split(',')).map(Number).filter(v => !isNaN(v));
}

function arcPath(cx, cy, r, a0, a1) {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
}

function Chart({ type = 'bar', data = [], labels = [], color, width = 280, height = 160, mini = false }) {
  const vals = nums(data);
  const labs = Array.isArray(labels) ? labels : String(labels || '').split(',').map(s => s.trim());
  if (!vals.length) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        <span>no data</span>
      </div>
    );
  }
  const C = color || CAT[0];
  const max = Math.max(...vals, 1);
  const total = vals.reduce((a, b) => a + b, 0) || 1;

  // --- Pie / donut ---
  if (type === 'pie' || type === 'donut') {
    const s = Math.min(width, height);
    const cx = s / 2, cy = s / 2, r = s / 2 - 6;
    let a = -Math.PI / 2;
    const slices = vals.map((v, i) => {
      const a1 = a + (v / total) * Math.PI * 2;
      const d = arcPath(cx, cy, r, a, a1);
      const mid = (a + a1) / 2; a = a1;
      return { d, color: CAT[i % CAT.length], mid, pct: Math.round((v / total) * 100), v, label: labs[i] };
    });
    return (
      <svg width={width} height={height} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
        {slices.map((sl, i) => <path key={i} d={sl.d} fill={sl.color} stroke={GAP} strokeWidth="2" />)}
        {type === 'donut' && <circle cx={cx} cy={cy} r={r * 0.58} fill={GAP} />}
        {!mini && slices.map((sl, i) => sl.pct >= 6 && (
          <text key={'l' + i} x={cx + Math.cos(sl.mid) * r * (type === 'donut' ? 0.8 : 0.62)} y={cy + Math.sin(sl.mid) * r * (type === 'donut' ? 0.8 : 0.62)}
            fontSize="9" fill="#fff" fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="middle">{sl.pct}%</text>
        ))}
      </svg>
    );
  }

  // --- Cartesian (bar / line / area) ---
  const padL = 6, padR = 6, padT = 10, padB = mini ? 6 : 16;
  const iw = width - padL - padR, ih = height - padT - padB;
  const baseY = padT + ih;

  if (type === 'bar') {
    const gap = 2;
    const bw = Math.max(2, iw / vals.length - gap);
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <line x1={padL} y1={baseY} x2={width - padR} y2={baseY} stroke="var(--border-subtle)" strokeWidth="1" />
        {vals.map((v, i) => {
          const h = (v / max) * (ih - 6);
          const x = padL + i * (iw / vals.length) + gap / 2;
          const y = baseY - h;
          const rr = Math.min(3, bw / 2, h);
          const d = `M${x},${baseY} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + bw - rr},${y} Q${x + bw},${y} ${x + bw},${y + rr} L${x + bw},${baseY} Z`;
          return (
            <g key={i}>
              <path d={d} fill={color || CAT[i % CAT.length]} />
              {!mini && <text x={x + bw / 2} y={y - 3} fontSize="8.5" fill="var(--text-secondary)" fontFamily="var(--font-mono)" textAnchor="middle">{v}</text>}
              {!mini && labs[i] && <text x={x + bw / 2} y={height - 4} fontSize="8.5" fill="var(--text-muted)" fontFamily="var(--font-mono)" textAnchor="middle">{labs[i]}</text>}
            </g>
          );
        })}
      </svg>
    );
  }

  // line / area
  const stepX = vals.length > 1 ? iw / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => [padL + i * stepX, baseY - (v / max) * (ih - 6)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts[pts.length - 1][0].toFixed(1)},${baseY} L${pts[0][0].toFixed(1)},${baseY} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75].map((g, i) => <line key={i} x1={padL} y1={padT + ih * g} x2={width - padR} y2={padT + ih * g} stroke="var(--border-subtle)" strokeWidth="1" opacity="0.5" />)}
      <line x1={padL} y1={baseY} x2={width - padR} y2={baseY} stroke="var(--border-subtle)" strokeWidth="1" />
      {type === 'area' && <path d={area} fill={C} opacity="0.16" />}
      <path d={line} fill="none" stroke={C} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={C} stroke={GAP} strokeWidth="2" />)}
      {!mini && labs.length > 0 && pts.map((p, i) => labs[i] && <text key={'x' + i} x={p[0]} y={height - 4} fontSize="8.5" fill="var(--text-muted)" fontFamily="var(--font-mono)" textAnchor="middle">{labs[i]}</text>)}
    </svg>
  );
}
window.Chart = Chart;
window.CHART_CAT = CAT;
