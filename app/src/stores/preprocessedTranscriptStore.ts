import { create } from 'zustand';
import type { TranscriptLine } from '../services/transcript';

interface PreprocessedTranscript {
  videoId: string;
  lines: TranscriptLine[];
}

interface PreprocessedTranscriptState {
  byVideoId: Record<string, PreprocessedTranscript>;
  setTranscript: (videoId: string, lines: TranscriptLine[]) => void;
  getTranscript: (videoId: string) => TranscriptLine[] | null;
}

export const usePreprocessedTranscriptStore = create<PreprocessedTranscriptState>((set, get) => ({
  byVideoId: {},

  setTranscript: (videoId, lines) =>
    set((state) => ({
      byVideoId: {
        ...state.byVideoId,
        [videoId]: { videoId, lines },
      },
    })),

  getTranscript: (videoId) => get().byVideoId[videoId]?.lines ?? null,
}));
