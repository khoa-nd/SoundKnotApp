// ── Sound Knot V2 — Saddle color system (from design PDF)
// Warm paper light mode, dark charcoal dark mode, single orange accent
// Supports light + dark mode

export const LightColors = {
  // Paper / Ink — warm off-white, near-black charcoal text
  paper: '#F4F3EF',
  paper2: '#ECEAE2',
  ink: '#2A2522',
  ink2: '#4A4440',
  ink3: '#7A756F',
  ink4: '#9E9990',
  hair: 'rgba(42, 37, 34, 0.10)',
  hair2: 'rgba(42, 37, 34, 0.06)',

  // Accent — warm orange (from design: ASK AI button, calendar heatmap, progress ring)
  accent: '#E8913A',
  accentSoft: 'rgba(232, 145, 58, 0.14)',
  accentInk: '#7A3D0A',

  // Inverted text — for light text on dark/accent backgrounds
  inkInverse: 'rgba(244, 243, 239, 0.60)',
  inkInverse2: 'rgba(244, 243, 239, 0.70)',

  // Signals
  positive: '#00897B',
  negative: '#E53935',
} as const;

export const DarkColors = {
  paper: '#1C1A17',
  paper2: '#262320',
  ink: '#F4F3EF',
  ink2: '#D6D3CC',
  ink3: '#A5A09A',
  ink4: '#7A7570',
  hair: 'rgba(244, 243, 239, 0.12)',
  hair2: 'rgba(244, 243, 239, 0.07)',

  accent: '#E8913A',
  accentSoft: 'rgba(232, 145, 58, 0.20)',
  accentInk: '#F5C88A',

  // Inverted text — for light text on dark/accent backgrounds
  inkInverse: 'rgba(244, 243, 239, 0.60)',
  inkInverse2: 'rgba(244, 243, 239, 0.70)',

  positive: '#66BBAA',
  negative: '#EF6C6C',
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
