// knot.jsx — The Gordian knot motif
// A proper trefoil knot (3 real self-crossings) rendered with over/under weave.

function Knot({
  size = 260,
  progress = 0.5,      // 0..1 playback position
  mastery = 0.35,      // 0..1 — controls tightness + dot size
  pass = 1,
  animated = true,
  strokeColor = 'currentColor',
  accentColor = null,
  subdued = 0.18,
}) {
  const cx = size / 2;
  const cy = size / 2;
  // Real trefoil knot projection: produces 3 genuine self-crossings.
  // Scale so knot fits well within viewBox.
  const scale = (size / 2) * 0.28 * (1 - mastery * 0.12);
  const steps = 720;

  // Build parametric points
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = cx + (Math.sin(t) + 2 * Math.sin(2 * t)) * scale;
    const y = cy + (Math.cos(t) - 2 * Math.cos(2 * t)) * scale;
    // z (depth) parameter — used to decide over/under at crossings
    const z = Math.sin(3 * t);
    points.push([x, y, z, t]);
  }

  // Cumulative arc length for dash animation + for building segments
  const lens = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    total += Math.sqrt(dx * dx + dy * dy);
    lens.push(total);
  }

  // Build the full knot path
  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}` : `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`))
    .join(' ');

  // Find crossings: 6 t-values where z ≈ 0 with opposite strand behind
  // Simplest reliable approach — split the curve into 3 "over" arcs and 3 "under"
  // arcs driven by z parameter. We'll draw the base curve, then draw a second pass
  // with a wider background stroke just around the "over" sections to create the
  // visual break where the other strand passes under.
  // Over sections = where z > 0.
  // Build sub-paths for over segments.
  const overPaths = [];
  let cur = null;
  for (let i = 0; i < points.length; i++) {
    const overHere = points[i][2] > 0.3; // use margin to get clear arcs
    if (overHere && !cur) {
      cur = [`M ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`];
    } else if (overHere && cur) {
      cur.push(`L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`);
    } else if (!overHere && cur) {
      overPaths.push(cur.join(' '));
      cur = null;
    }
  }
  if (cur) overPaths.push(cur.join(' '));

  // Pass rings — one hairline per completed pass
  const ringCount = Math.max(0, Math.min(4, pass - 1));
  const rings = [];
  const outerR = Math.max(...points.map(p => Math.hypot(p[0] - cx, p[1] - cy))) + 4;
  for (let i = 0; i < ringCount; i++) {
    rings.push(
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={outerR + 2 + i * 7}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={0.1 + i * 0.02}
        strokeWidth={0.8}
        strokeDasharray="2 4"
      />
    );
  }

  // Tick marks around perimeter
  const ticks = [];
  const tickR = outerR + 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(a) * tickR;
    const y1 = cy + Math.sin(a) * tickR;
    const x2 = cx + Math.cos(a) * (tickR + 4);
    const y2 = cy + Math.sin(a) * (tickR + 4);
    ticks.push(
      <line key={i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={strokeColor}
        strokeOpacity={0.2}
        strokeWidth={0.8}
      />
    );
  }

  const playedLen = total * Math.max(0, Math.min(1, progress));
  const strokeW = Math.max(1.4, size / 110);
  const overGapW = strokeW + 4; // background stroke width to create under-gap

  // Background tint for over/under breaks (matches paper)
  const breakColor = 'var(--gk-paper)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', overflow: 'visible' }}>
      {rings}
      {ticks}

      {/* Base knot — full muted */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={subdued}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Over-strand background breaks — paint wider paper-colored stroke
          along the "over" arcs so the base strand appears to duck under */}
      {overPaths.map((d, i) => (
        <path key={'gap-' + i}
          d={d}
          fill="none"
          stroke={breakColor}
          strokeWidth={overGapW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Over-strand — muted (re-draws the over arcs on top of the gap) */}
      {overPaths.map((d, i) => (
        <path key={'over-' + i}
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={subdued}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Active played portion — drawn on top with gaps preserved */}
      <path
        d={pathD}
        fill="none"
        stroke={accentColor || strokeColor}
        strokeWidth={strokeW + 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${playedLen} ${total}`}
        style={animated ? { transition: 'stroke-dasharray 0.4s linear' } : {}}
      />
      {/* Re-apply over-gaps on top of played line too */}
      {overPaths.map((d, i) => (
        <path key={'played-over-' + i}
          d={d}
          fill="none"
          stroke={accentColor || strokeColor}
          strokeWidth={strokeW + 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={playedLen >= total * 0.999 ? 1 : 0}
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={1.5 + mastery * 2.5}
        fill={accentColor || strokeColor}
      />
    </svg>
  );
}

function KnotGlyph({ size = 24, mastery = 0.3, strokeColor = 'currentColor' }) {
  return <Knot size={size} progress={mastery} mastery={mastery} pass={1} animated={false} strokeColor={strokeColor} subdued={0.3} />;
}

Object.assign(window, { Knot, KnotGlyph });
