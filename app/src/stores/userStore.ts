import { create } from 'zustand';
import { authService } from '../services/auth';
import type { User, UserLevel, Profile, UserProgress } from '../types';

interface UserState {
  user: User | null;
  isOnboardingComplete: boolean;
  handsFreeEnabled: boolean;

  // Actions
  setUser: (user: User) => void;
  loadFromApi: () => Promise<void>;
  updateInterests: (interests: string[]) => void;
  addListeningMinutes: (minutes: number) => void;
  updateStreak: (streak: number) => void;
  setLevel: (level: UserLevel) => void;
  completeOnboarding: () => void;
  toggleHandsFree: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isOnboardingComplete: false,
  handsFreeEnabled: false,

  setUser: (user) => set({ user }),

  loadFromApi: async () => {
    try {
      const data = await authService.me();
      const profile = data.profile;
      const progress = data.progress;
      const user: User = {
        id: profile.id,
        displayName: profile.display_name || 'Learner',
        interests: profile.interests || [],
        totalListeningMinutes: progress?.total_minutes ?? 0,
        streak: progress?.current_streak ?? 0,
        longestStreak: progress?.longest_streak ?? 0,
        level: (profile.level as UserLevel) || 'beginner',
        onboardingComplete: true,
        handsFreeEnabled: get().handsFreeEnabled,
        createdAt: profile.created_at,
      };
      set({ user });
    } catch {
      // ignore — user may not be authenticated
    }
  },

  updateInterests: (interests) =>
    set((s) => ({ user: s.user ? { ...s.user, interests } : null })),

  addListeningMinutes: (minutes) =>
    set((s) => {
      if (!s.user) return s;
      const total = s.user.totalListeningMinutes + minutes;
      const level = calculateLevel(total);
      return { user: { ...s.user, totalListeningMinutes: total, level } };
    }),

  updateStreak: (streak) =>
    set((s) => {
      if (!s.user) return s;
      return {
        user: {
          ...s.user,
          streak,
          longestStreak: Math.max(s.user.longestStreak, streak),
        },
      };
    }),

  setLevel: (level) =>
    set((s) => (s.user ? { user: { ...s.user, level } } : s)),

  completeOnboarding: () =>
    set((s) => ({
      isOnboardingComplete: true,
      user: s.user ? { ...s.user, onboardingComplete: true } : null,
    })),

  toggleHandsFree: () =>
    set((s) => ({
      handsFreeEnabled: !s.handsFreeEnabled,
    })),

  reset: () => set({ user: null, isOnboardingComplete: false, handsFreeEnabled: false }),
}));

function calculateLevel(totalMinutes: number): UserLevel {
  if (totalMinutes >= 60000) return 'master';
  if (totalMinutes >= 30000) return 'advanced';
  if (totalMinutes >= 6000) return 'intermediate';
  return 'beginner';
}
