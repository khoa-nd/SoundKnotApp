// ── Sound Knot V2 — Amber-on-paper color system
// Cool technical, near-black, single amber accent
// Supports light + dark mode

export const LightColors = {
  // Paper / Ink
  paper: '#F4F3EE',
  paper2: '#ECEAE2',
  ink: '#0B0C0E',
  ink2: '#232528',
  ink3: '#5B5E64',
  ink4: '#8B8E94',
  hair: 'rgba(11, 12, 14, 0.10)',
  hair2: 'rgba(11, 12, 14, 0.06)',

  // Accent — precise amber
  accent: '#D4941A',
  accentSoft: 'rgba(212, 148, 26, 0.14)',
  accentInk: '#6B3A0A',

  // Signals
  positive: '#00897B',
  negative: '#E53935',
} as const;

export const DarkColors = {
  paper: '#0B0C0E',
  paper2: '#16181C',
  ink: '#F4F3EE',
  ink2: '#D6D4CC',
  ink3: '#8F9298',
  ink4: '#5B5E64',
  hair: 'rgba(244, 243, 238, 0.12)',
  hair2: 'rgba(244, 243, 238, 0.06)',

  accent: '#E8A835',
  accentSoft: 'rgba(232, 168, 53, 0.18)',
  accentInk: '#E8C860',

  positive: '#4DB6AC',
  negative: '#EF5350',
} as const;

export type ColorTokens = typeof LightColors;

// Backward compatibility — maps new token names to old property names
export const Colors = {
  // Brand
  primary: LightColors.accent,
  primaryLight: LightColors.accent,
  primaryDark: LightColors.accentInk,
  // Accent
  accent: LightColors.accent,
  accentLight: LightColors.accent,
  accentDark: LightColors.accentInk,
  // Semantic
  success: LightColors.positive,
  warning: LightColors.accent,
  error: LightColors.negative,
  // Background
  background: LightColors.paper,
  surface: LightColors.paper2,
  surfaceAlt: LightColors.paper2,
  card: LightColors.paper2,
  // Text
  text: LightColors.ink,
  textSecondary: LightColors.ink2,
  textMuted: LightColors.ink3,
  textInverse: LightColors.paper,
  // Border
  border: LightColors.hair,
  borderLight: LightColors.hair2,
  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
  // Levels
  beginner: LightColors.positive,
  intermediate: LightColors.accent,
  advanced: LightColors.accentInk,
  master: LightColors.ink,
} as const;
