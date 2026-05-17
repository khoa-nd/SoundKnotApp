import { Audio } from 'expo-av';

export async function configureAudioSession() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.warn('Failed to configure audio session:', error);
  }
}

export function validateAudioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function clampPlaybackRate(rate: number): number {
  return Math.min(Math.max(rate, 0.5), 2.0);
}

export const RATE_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
