import { create } from 'zustand';
import type { ListeningSession, Bookmark, AIQuery } from '../types';

export interface SessionState {
  activeSession: ListeningSession | null;
  sessions: ListeningSession[];
  totalSecondsToday: number;
  isTracking: boolean;

  // Actions
  startSession: (contentId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  tick: (elapsedSeconds: number) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (bookmarkId: string) => void;
  addAIQuery: (query: AIQuery) => void;
  loadSessions: (sessions: ListeningSession[]) => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  sessions: [],
  totalSecondsToday: 0,
  isTracking: false,

  startSession: (contentId) => {
    const session: ListeningSession = {
      id: `session-${Date.now()}`,
      contentId,
      startTime: new Date().toISOString(),
      listenedSeconds: 0,
      completed: false,
      bookmarks: [],
      aiQueries: [],
    };
    set({ activeSession: session, isTracking: true });
  },

  pauseSession: () => set({ isTracking: false }),

  resumeSession: () => set({ isTracking: true }),

  endSession: () => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;
    const ended: ListeningSession = {
      ...activeSession,
      endTime: new Date().toISOString(),
    };
    set({
      activeSession: null,
      isTracking: false,
      sessions: [ended, ...sessions],
    });
  },

  tick: (elapsedSeconds) =>
    set((s) => {
      if (!s.activeSession || !s.isTracking) return s;
      return {
        activeSession: {
          ...s.activeSession,
          listenedSeconds: s.activeSession.listenedSeconds + elapsedSeconds,
        },
        totalSecondsToday: s.totalSecondsToday + elapsedSeconds,
      };
    }),

  addBookmark: (bookmark) =>
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          bookmarks: [...s.activeSession.bookmarks, bookmark],
        },
      };
    }),

  removeBookmark: (bookmarkId) =>
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          bookmarks: s.activeSession.bookmarks.filter((b) => b.id !== bookmarkId),
        },
      };
    }),

  addAIQuery: (query) =>
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          aiQueries: [...s.activeSession.aiQueries, query],
        },
      };
    }),

  loadSessions: (sessions) => set({ sessions }),
}));
