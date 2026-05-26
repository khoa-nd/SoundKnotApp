import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TranscriptLine } from '../services/transcript';

const STORAGE_KEY = 'soundknot_preprocessed_transcripts';

interface PreprocessedTranscript {
  videoId: string;
  lines: TranscriptLine[];
}

interface PreprocessedTranscriptState {
  byVideoId: Record<string, PreprocessedTranscript>;
  hydrated: boolean;
  load: () => Promise<void>;
  setTranscript: (videoId: string, lines: TranscriptLine[]) => void;
  getTranscript: (videoId: string) => TranscriptLine[] | null;
}

async function persist(byVideoId: Record<string, PreprocessedTranscript>) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(byVideoId));
  } catch {
    // ignore — caching is best-effort
  }
}

export const usePreprocessedTranscriptStore = create<PreprocessedTranscriptState>((set, get) => ({
  byVideoId: {},
  hydrated: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, PreprocessedTranscript>;
        if (parsed && typeof parsed === 'object') {
          set({ byVideoId: parsed, hydrated: true });
          return;
        }
      }
    } catch {
      // ignore
    }
    set({ hydrated: true });
  },

  setTranscript: (videoId, lines) => {
    const next = {
      ...get().byVideoId,
      [videoId]: { videoId, lines },
    };
    set({ byVideoId: next });
    void persist(next);
  },

  getTranscript: (videoId) => get().byVideoId[videoId]?.lines ?? null,
}));
