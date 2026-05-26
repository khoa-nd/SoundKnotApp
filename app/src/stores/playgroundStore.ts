import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { AiMode, AiProvider, OpenRouterModel } from '../services/aiTutor';

const STORAGE_KEY = 'soundknot_playground';

export interface PlaygroundParams {
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface PromptPreset {
  systemPrompt: string;
  userPrompt: string;
  params: PlaygroundParams;
}

export interface ResultCardState {
  status: 'pending' | 'done' | 'error';
  reply: string | null;
  error: string | null;
  latencyMs: number | null;
  usage: { promptTokens: number; completionTokens: number } | null;
  cost: number | null;
}

export interface RunSnapshot {
  startedAt: number;
  finishedAt: number | null;
  provider: AiProvider;
  mode: AiMode;
  systemPrompt: string;
  userPrompt: string;
  params: PlaygroundParams;
  results: Record<string, ResultCardState>;
}

interface PersistedPlaygroundState {
  selectedModels: Record<AiProvider, string[]>;
  systemPrompt: string;
  userPrompt: string;
  params: PlaygroundParams;
  presets: Record<string, PromptPreset>;
  mode: AiMode;
  provider: AiProvider;
  cachedOpenRouterModels: OpenRouterModel[] | null;
  lastRun: RunSnapshot | null;
}

interface PlaygroundState extends PersistedPlaygroundState {
  hydrated: boolean;
  load: () => Promise<void>;
  setProvider: (provider: AiProvider) => Promise<void>;
  setMode: (mode: AiMode) => Promise<void>;
  setSelectedModels: (provider: AiProvider, models: string[]) => Promise<void>;
  toggleModel: (provider: AiProvider, model: string) => Promise<void>;
  setSystemPrompt: (systemPrompt: string) => Promise<void>;
  setUserPrompt: (userPrompt: string) => Promise<void>;
  setParams: (params: Partial<PlaygroundParams>) => Promise<void>;
  savePreset: (name: string) => Promise<void>;
  loadPreset: (name: string) => Promise<void>;
  deletePreset: (name: string) => Promise<void>;
  setCachedOpenRouterModels: (models: OpenRouterModel[] | null) => Promise<void>;
  setLastRun: (lastRun: RunSnapshot | null) => Promise<void>;
}

export const DEFAULT_PLAYGROUND_PARAMS: PlaygroundParams = {
  temperature: 0.4,
  maxTokens: 800,
  topP: 0.95,
};

const DEFAULTS: PersistedPlaygroundState = {
  selectedModels: {
    gemini: ['gemini-2.5-pro', 'gemini-3.5-flash'],
    openrouter: [],
  },
  systemPrompt: 'You are a precise English listening tutor. Answer clearly, cite tradeoffs, and avoid filler.',
  userPrompt: 'Explain the main idea in this transcript excerpt and give 3 useful phrases for an English learner.',
  params: DEFAULT_PLAYGROUND_PARAMS,
  presets: {},
  mode: 'direct',
  provider: 'gemini',
  cachedOpenRouterModels: null,
  lastRun: null,
};

async function persist(state: PersistedPlaygroundState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-critical developer UI state.
  }
}

function persistedSlice(state: PlaygroundState): PersistedPlaygroundState {
  return {
    selectedModels: state.selectedModels,
    systemPrompt: state.systemPrompt,
    userPrompt: state.userPrompt,
    params: state.params,
    presets: state.presets,
    mode: state.mode,
    provider: state.provider,
    cachedOpenRouterModels: state.cachedOpenRouterModels,
    lastRun: state.lastRun,
  };
}

async function setAndPersist(set: (partial: Partial<PlaygroundState>) => void, get: () => PlaygroundState, partial: Partial<PlaygroundState>) {
  set(partial);
  await persist(persistedSlice(get()));
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedPlaygroundState>;
        set({
          ...DEFAULTS,
          ...parsed,
          selectedModels: { ...DEFAULTS.selectedModels, ...(parsed.selectedModels ?? {}) },
          params: { ...DEFAULT_PLAYGROUND_PARAMS, ...(parsed.params ?? {}) },
          hydrated: true,
        });
        return;
      }
    } catch {
      // Ignore corrupt local state.
    }
    set({ hydrated: true });
  },

  setProvider: (provider) => setAndPersist(set, get, { provider }),
  setMode: (mode) => setAndPersist(set, get, { mode }),
  setSelectedModels: (provider, models) => {
    const limited = models.slice(0, 10);
    return setAndPersist(set, get, {
      selectedModels: { ...get().selectedModels, [provider]: limited },
    });
  },
  toggleModel: (provider, model) => {
    const current = get().selectedModels[provider] ?? [];
    const next = current.includes(model)
      ? current.filter((id) => id !== model)
      : current.length >= 10
        ? current
        : [...current, model];
    return get().setSelectedModels(provider, next);
  },
  setSystemPrompt: (systemPrompt) => setAndPersist(set, get, { systemPrompt }),
  setUserPrompt: (userPrompt) => setAndPersist(set, get, { userPrompt }),
  setParams: (params) => setAndPersist(set, get, { params: { ...get().params, ...params } }),
  savePreset: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return Promise.resolve();
    return setAndPersist(set, get, {
      presets: {
        ...get().presets,
        [trimmed]: {
          systemPrompt: get().systemPrompt,
          userPrompt: get().userPrompt,
          params: get().params,
        },
      },
    });
  },
  loadPreset: (name) => {
    const preset = get().presets[name];
    if (!preset) return Promise.resolve();
    return setAndPersist(set, get, {
      systemPrompt: preset.systemPrompt,
      userPrompt: preset.userPrompt,
      params: preset.params,
    });
  },
  deletePreset: (name) => {
    const next = { ...get().presets };
    delete next[name];
    return setAndPersist(set, get, { presets: next });
  },
  setCachedOpenRouterModels: (cachedOpenRouterModels) => setAndPersist(set, get, { cachedOpenRouterModels }),
  setLastRun: (lastRun) => setAndPersist(set, get, { lastRun }),
}));
