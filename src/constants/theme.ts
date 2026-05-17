// ── Sound Knot V2 — Theme hook (light/dark mode)
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, type ColorTokens } from './Colors';

export function useTheme(): typeof LightColors | typeof DarkColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
