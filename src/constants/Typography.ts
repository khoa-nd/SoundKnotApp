// ── Sound Knot V2 — Typography scale
// Inter → body/headings | JetBrains Mono → markers/chips/tabs

import { TextStyle } from 'react-native';

export const Fonts = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  serif: 'Inter_400Regular',       // Instrument Serif → Inter fallback (no serif loaded)
  serifItalic: 'Inter_400Regular',
} as const;

export const Typography = {
  // Display — large hero text
  heroLarge: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 56,
    fontWeight: '600' as const,
    letterSpacing: -1.4,
    lineHeight: 60,
  },
  hero: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 34,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  titleLarge: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
    lineHeight: 36,
  },

  // Headings
  headingLarge: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
    lineHeight: 33,
  },
  heading: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.22,
    lineHeight: 27,
  },
  headingSmall: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
    lineHeight: 23,
  },

  // Body
  bodyLarge: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
    lineHeight: 25,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.07,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: -0.05,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.05,
    lineHeight: 19,
  },

  // Mono — markers, timestamps, chips, tab bar
  marker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '400' as const,
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  markerLarge: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.6,
    lineHeight: 15,
  },
  monoSmall: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
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
    fontFamily: Fonts.monoMedium,
    fontSize: 28,
    fontWeight: '500' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  monoStat: {
    fontFamily: Fonts.monoMedium,
    fontSize: 30,
    fontWeight: '500' as const,
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  // Special
  tab: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '400' as const,
    letterSpacing: 0.72,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  chip: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: -0.05,
    lineHeight: 18,
  },
  buttonSmall: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: -0.04,
    lineHeight: 17,
  },

  // Serif italic emphasis (uses Inter italic-like styling)
  serifItalic: {
    fontFamily: Fonts.sans,
    fontStyle: 'italic' as const,
    fontWeight: '400' as const,
  },
} satisfies Record<string, TextStyle>;
