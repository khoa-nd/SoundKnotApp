// ── AI Tutor settings store
// Persists AI provider / model / mode / key to AsyncStorage.
// The default is `proxy` mode so the device never needs an API key, but
// a key can be pasted here to bypass the backend (useful before it ships).

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AiMode, AiProvider, AiSettings } from '../services/aiTutor';
import { GEMINI_MODELS, DEFAULT_OPENROUTER_MODEL } from '../services/aiTutor';

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
        const merged: AiSettings = { ...DEFAULTS, ...parsed };
        // Provider-aware stale-model guard.
        //   - Gemini: snap to GEMINI_MODELS[0] if the persisted ID isn't in the curated list.
        //   - OpenRouter: model IDs are dynamic (fetched live), so we don't whitelist them.
        //     We only check the slug looks plausible (contains a "/"), otherwise default.
        if (merged.provider === 'gemini') {
          if (!(GEMINI_MODELS as readonly string[]).includes(merged.model)) {
            merged.model = GEMINI_MODELS[0];
            await persist(merged);
          }
        } else if (merged.provider === 'openrouter') {
          if (!merged.model || !merged.model.includes('/')) {
            merged.model = DEFAULT_OPENROUTER_MODEL;
            await persist(merged);
          }
        }
        set({ settings: merged, hydrated: true });
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
    // Reset the model when switching providers so we never carry a Gemini ID
    // into OpenRouter (or vice versa). Key is also cleared because OpenRouter
    // and Gemini keys are not interchangeable.
    const current = get().settings;
    if (current.provider === provider) return;
    const defaultModel = provider === 'openrouter' ? DEFAULT_OPENROUTER_MODEL : GEMINI_MODELS[0];
    const next: AiSettings = { ...current, provider, model: defaultModel, apiKey: '' };
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
