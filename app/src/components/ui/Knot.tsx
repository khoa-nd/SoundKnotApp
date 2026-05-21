// ── Sound Knot V2 — Trefoil Knot SVG motif
import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../../constants/theme';

interface KnotProps {
  size?: number;
  progress?: number; // 0..1 playback position
  mastery?: number; // 0..1 controls tightness + dot size
  pass?: number;
  animated?: boolean;
  subdued?: number;
  accentColor?: string;
}

interface Point {
  x: number;
  y: number;
  z: number;
}

export function Knot({
  size = 64,
  progress = 0.5,
  mastery = 0.35,
  pass = 1,
  subdued = 0.18,
  accentColor,
}: KnotProps) {
  const colors = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const scale = (size / 2) * 0.28 * (1 - mastery * 0.12);
  const steps = 360;

  const strokeColor = colors.ink;
  const theAccentColor = accentColor || colors.accent;
  const breakColor = colors.paper;

  // Build parametric trefoil knot points
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    points.push({
      x: cx + (Math.sin(t) + 2 * Math.sin(2 * t)) * scale,
      y: cy + (Math.cos(t) - 2 * Math.cos(2 * t)) * scale,
      z: Math.sin(3 * t),
    });
  }

  // Cumulative arc length
  const lens: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
    lens.push(total);
  }

  // Full path
  const pathD = points
    .map((p, i) =>
      i === 0
        ? `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
        : `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    )
    .join(' ');

  // Over sections (where z > 0.3)
  const overPaths: string[] = [];
  let cur: string[] | null = null;
  for (let i = 0; i < points.length; i++) {
    const overHere = points[i].z > 0.3;
    if (overHere && !cur) {
      cur = [`M ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`];
    } else if (overHere && cur) {
      cur.push(`L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`);
    } else if (!overHere && cur) {
      overPaths.push(cur.join(' '));
      cur = null;
    }
  }
  if (cur) overPaths.push(cur.join(' '));

  // Find outer radius
  const outerR =
    Math.max(...points.map((p) => Math.hypot(p.x - cx, p.y - cy))) + 4;

  const strokeW = Math.max(1.4, size / 110);
  const overGapW = strokeW + 4;

  // Pass rings
  const ringCount = Math.max(0, Math.min(4, pass - 1));
  const rings = [];
  for (let i = 0; i < ringCount; i++) {
    rings.push(
      <Circle
        key={`ring-${i}`}
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

  // Tick marks
  const ticks = [];
  const tickR = outerR + 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ticks.push(
      <Line
        key={`tick-${i}`}
        x1={cx + Math.cos(a) * tickR}
        y1={cy + Math.sin(a) * tickR}
        x2={cx + Math.cos(a) * (tickR + 4)}
        y2={cy + Math.sin(a) * (tickR + 4)}
        stroke={strokeColor}
        strokeOpacity={0.2}
        strokeWidth={0.8}
      />
    );
  }

  const playedLen = total * Math.max(0, Math.min(1, progress));

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      {rings}
      {ticks}

      {/* Base knot — full muted */}
      <Path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={subdued}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Over-section paper-colored gaps */}
      {overPaths.map((d, i) => (
        <Path
          key={`gap-${i}`}
          d={d}
          fill="none"
          stroke={breakColor}
          strokeWidth={overGapW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Over-section re-draw */}
      {overPaths.map((d, i) => (
        <Path
          key={`over-${i}`}
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={subdued}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Played portion */}
      <Path
        d={pathD}
        fill="none"
        stroke={theAccentColor}
        strokeWidth={strokeW + 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${playedLen} ${total}`}
      />

      {/* Over gaps on played line */}
      {overPaths.map((d, i) => (
        <Path
          key={`played-over-${i}`}
          d={d}
          fill="none"
          stroke={theAccentColor}
          strokeWidth={strokeW + 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={playedLen >= total * 0.999 ? 1 : 0}
        />
      ))}

      {/* Center dot */}
      <Circle
        cx={cx}
        cy={cy}
        r={1.5 + mastery * 2.5}
        fill={theAccentColor}
      />
    </Svg>
  );
}
