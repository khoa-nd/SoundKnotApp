// ── Sound Knot V2 — Theme hook (dark Spotify-style)
import { DarkColors, type ColorTokens } from './Colors';

export function useTheme(): ColorTokens {
  return DarkColors;
}

export function useIsDark(): boolean {
  return true;
}
