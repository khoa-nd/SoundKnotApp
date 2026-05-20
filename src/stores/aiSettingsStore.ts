// ── AI Tutor settings store
// Persists AI provider / model / mode / key to AsyncStorage.
// The default is `proxy` mode so the device never needs an API key, but
// a key can be pasted here to bypass the backend (useful before it ships).

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AiMode, AiProvider, AiSettings } from '../services/aiTutor';
import { GEMINI_MODELS } from '../services/aiTutor';

const STORAGE_KEY = 'soundknot_ai_settings';

const DEFAULTS: AiSettings = {
  mode: 'proxy',
  provider: 'gemini',
  model: GEMINI_MODELS[0],
  apiKey: '',
};

interface AiSettingsState {
  settings: AiSettings;
  hydrated: boolean;
  load: () => Promise<void>;
  setMode: (m: AiMode) => Promise<void>;
  setProvider: (p: AiProvider) => Promise<void>;
  setModel: (m: string) => Promise<void>;
  setApiKey: (k: string) => Promise<void>;
  reset: () => Promise<void>;
}

async function persist(s: AiSettings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore — settings are not critical
  }
}

export const useAiSettingsStore = create<AiSettingsState>((set, get) => ({
  settings: DEFAULTS,
  hydrated: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AiSettings>;
        set({ settings: { ...DEFAULTS, ...parsed }, hydrated: true });
        return;
      }
    } catch {
      // ignore
    }
    set({ hydrated: true });
  },

  setMode: async (mode) => {
    const next = { ...get().settings, mode };
    set({ settings: next });
    await persist(next);
  },
  setProvider: async (provider) => {
    const next = { ...get().settings, provider };
    set({ settings: next });
    await persist(next);
  },
  setModel: async (model) => {
    const next = { ...get().settings, model };
    set({ settings: next });
    await persist(next);
  },
  setApiKey: async (apiKey) => {
    const next = { ...get().settings, apiKey };
    set({ settings: next });
    await persist(next);
  },
  reset: async () => {
    set({ settings: DEFAULTS });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
