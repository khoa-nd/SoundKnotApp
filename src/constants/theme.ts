// ── Sound Knot V2 — Theme hook (light only)
import { LightColors } from './Colors';

export function useTheme(): typeof LightColors {
  return LightColors;
}

export function useIsDark(): boolean {
  return false;
}
