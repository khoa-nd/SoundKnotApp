import { create } from 'zustand';
import type { AudioState, LoopMode } from '../types';

interface PlayerState extends AudioState {
  // Actions
  loadContent: (contentId: string) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setLoopMode: (mode: LoopMode) => void;
  updateProgress: (currentTime: number, duration: number) => void;
  setBuffering: (buffering: boolean) => void;
  reset: () => void;
}

const initialState: AudioState = {
  isPlaying: false,
  isBuffering: false,
  isLoaded: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  volume: 1.0,
  currentContentId: null,
  loopMode: 'off',
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,

  loadContent: (contentId) =>
    set({
      currentContentId: contentId,
      isLoaded: false,
      isBuffering: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  seek: (time) => set({ currentTime: time }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume }),
  setLoopMode: (mode) => set({ loopMode: mode }),
  updateProgress: (currentTime, duration) => set({ currentTime, duration, isLoaded: true }),
  setBuffering: (buffering) => set({ isBuffering: buffering }),
  reset: () => set(initialState),
}));
