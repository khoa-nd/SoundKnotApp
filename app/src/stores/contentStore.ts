import { create } from 'zustand';
import type { ContentItem, ContentDifficulty } from '../types';

export interface ContentState {
  library: ContentItem[];
  recommendations: { contentId: string; reason: string; score: number }[];
  isLoading: boolean;
  error: string | null;
  activeFilters: {
    topics: string[];
    difficulty: ContentDifficulty | null;
    speaker: string | null;
    query: string;
  };

  // Actions
  setLibrary: (items: ContentItem[]) => void;
  addToLibrary: (item: ContentItem) => void;
  setRecommendations: (recs: { contentId: string; reason: string; score: number }[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  getById: (id: string) => ContentItem | undefined;
  getFiltered: () => ContentItem[];
}

const defaultFilters = {
  topics: [] as string[],
  difficulty: null as ContentDifficulty | null,
  speaker: null as string | null,
  query: '',
};

export const useContentStore = create<ContentState>((set, get) => ({
  library: [],
  recommendations: [],
  isLoading: false,
  error: null,
  activeFilters: { ...defaultFilters },

  setLibrary: (items) => set({ library: items }),
  addToLibrary: (item) =>
    set((s) => ({ library: [...s.library, item] })),

  setRecommendations: (recs) => set({ recommendations: recs }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setFilter: (key, value) =>
    set((s) => ({
      activeFilters: { ...s.activeFilters, [key]: value },
    })),

  clearFilters: () => set({ activeFilters: { ...defaultFilters } }),

  getById: (id) => get().library.find((c) => c.id === id),

  getFiltered: () => {
    const { library, activeFilters } = get();
    return library.filter((item) => {
      if (activeFilters.query) {
        const q = activeFilters.query.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.speaker.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (activeFilters.difficulty && item.difficulty !== activeFilters.difficulty) {
        return false;
      }
      if (activeFilters.speaker && item.speaker !== activeFilters.speaker) {
        return false;
      }
      if (activeFilters.topics.length > 0) {
        const hasTopic = activeFilters.topics.some((t) => item.topics.includes(t));
        if (!hasTopic) return false;
      }
      return true;
    });
  },
}));
