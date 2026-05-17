// ── Sound Knot V2 — Typography scale
// Inter Tight → sans-serif | JetBrains Mono → monospace | Instrument Serif → serif

import { Platform, TextStyle } from 'react-native';

const monoFamily = Platform.select({ ios: 'Menlo', default: 'monospace' });
const serifFamily = Platform.select({ ios: 'Georgia', default: 'serif' });

export const Fonts = {
  sans: Platform.select({ ios: 'System', default: 'Roboto' }) as string,
  sansMedium: Platform.select({ ios: 'System', default: 'Roboto' }) as string,
  sansSemibold: Platform.select({ ios: 'System', default: 'Roboto' }) as string,
  mono: monoFamily as string,
  serif: serifFamily as string,
  serifItalic: serifFamily as string,
};

export const Typography = {
  // Display — serif hero text
  heroLarge: {
    fontFamily: Fonts.serif,
    fontSize: 56,
    fontWeight: '400' as const,
    letterSpacing: -2.2,
    lineHeight: 58,
  },
  hero: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    fontWeight: '400' as const,
    letterSpacing: -0.68,
    lineHeight: 37,
  },
  titleLarge: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: -0.64,
    lineHeight: 35,
  },

  // Headings — sans-serif
  headingLarge: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.56,
    lineHeight: 31,
  },
  heading: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.22,
    lineHeight: 26,
  },
  headingSmall: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.18,
    lineHeight: 22,
  },

  // Body — sans-serif
  bodyLarge: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.085,
    lineHeight: 24,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.075,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.065,
    lineHeight: 19,
  },
  bodyMedium: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: -0.07,
    lineHeight: 20,
  },

  // Mono — markers, timestamps, chips, tab bar
  marker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '400' as const,
    letterSpacing: 0.8,
    lineHeight: 14,
  },
  markerLarge: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.66,
    lineHeight: 15,
  },
  monoSmall: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '400' as const,
    letterSpacing: 0.21,
    lineHeight: 14,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 18,
  },
  monoDisplay: {
    fontFamily: Fonts.mono,
    fontSize: 28,
    fontWeight: '500' as const,
    letterSpacing: -0.28,
    lineHeight: 30,
  },
  monoStat: {
    fontFamily: Fonts.mono,
    fontSize: 30,
    fontWeight: '500' as const,
    letterSpacing: -0.6,
    lineHeight: 30,
  },

  // Special
  tab: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '400' as const,
    letterSpacing: 0.72,
    lineHeight: 12,
  },
  chip: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '400' as const,
    letterSpacing: 0.21,
    lineHeight: 14,
  },
  button: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: -0.07,
    lineHeight: 18,
  },
  buttonSmall: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: -0.065,
    lineHeight: 17,
  },

  // Serif italic emphasis
  serifItalic: {
    fontFamily: Fonts.serif,
    fontStyle: 'italic' as const,
    fontWeight: '400' as const,
  },
} satisfies Record<string, TextStyle>;
