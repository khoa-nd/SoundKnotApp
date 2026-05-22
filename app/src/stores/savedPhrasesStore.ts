// ── Saved phrases store
// Persists transcript sentences the user has bookmarked from the Listen screen.
// Each entry is tagged as either a 'phrase' or 'vocabulary' so the Library
// screen can split them into two tabs.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'soundknot_saved_phrases';

export type SavedPhraseKind = 'phrase' | 'vocabulary';

export interface SavedPhrase {
  id: string;
  text: string;
  kind: SavedPhraseKind;
  source?: 'video' | 'ai';
  videoId: string;
  videoTitle?: string;
  videoChannel?: string;
  start: number;
  createdAt: number;
}

interface SavedPhrasesState {
  phrases: SavedPhrase[];
  hydrated: boolean;
  load: () => Promise<void>;
  add: (entry: Omit<SavedPhrase, 'id' | 'createdAt'> & { kind?: SavedPhraseKind }) => Promise<SavedPhrase>;
  remove: (id: string) => Promise<void>;
  removeByLine: (videoId: string, start: number) => Promise<void>;
  setKind: (id: string, kind: SavedPhraseKind) => Promise<void>;
  hasPhrase: (videoId: string, start: number) => boolean;
  findByLine: (videoId: string, start: number) => SavedPhrase | undefined;
}

const lineKey = (videoId: string, start: number) => `${videoId}@${Math.round(start * 1000)}`;

async function persist(phrases: SavedPhrase[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
  } catch {
    // ignore — bookmarks are best-effort
  }
}

export const useSavedPhrasesStore = create<SavedPhrasesState>((set, get) => ({
  phrases: [],
  hydrated: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedPhrase[];
        if (Array.isArray(parsed)) {
          set({ phrases: parsed, hydrated: true });
          return;
        }
      }
    } catch {
      // ignore
    }
    set({ hydrated: true });
  },

  add: async (entry) => {
    const existing = get().findByLine(entry.videoId, entry.start);
    if (existing) return existing;
    const created: SavedPhrase = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: entry.kind ?? 'phrase',
      createdAt: Date.now(),
      text: entry.text,
      source: entry.source ?? 'video',
      videoId: entry.videoId,
      videoTitle: entry.videoTitle,
      videoChannel: entry.videoChannel,
      start: entry.start,
    };
    const next = [created, ...get().phrases];
    set({ phrases: next });
    await persist(next);
    return created;
  },

  remove: async (id) => {
    const next = get().phrases.filter((p) => p.id !== id);
    set({ phrases: next });
    await persist(next);
  },

  removeByLine: async (videoId, start) => {
    const target = lineKey(videoId, start);
    const next = get().phrases.filter((p) => lineKey(p.videoId, p.start) !== target);
    set({ phrases: next });
    await persist(next);
  },

  setKind: async (id, kind) => {
    const next = get().phrases.map((p) => (p.id === id ? { ...p, kind } : p));
    set({ phrases: next });
    await persist(next);
  },

  hasPhrase: (videoId, start) => {
    const target = lineKey(videoId, start);
    return get().phrases.some((p) => lineKey(p.videoId, p.start) === target);
  },

  findByLine: (videoId, start) => {
    const target = lineKey(videoId, start);
    return get().phrases.find((p) => lineKey(p.videoId, p.start) === target);
  },
}));
