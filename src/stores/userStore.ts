import { create } from 'zustand';
import type { User, UserLevel } from '../types';

interface UserState {
  user: User | null;
  isOnboardingComplete: boolean;
  handsFreeEnabled: boolean;

  // Actions
  setUser: (user: User) => void;
  updateInterests: (interests: string[]) => void;
  addListeningMinutes: (minutes: number) => void;
  updateStreak: (streak: number) => void;
  setLevel: (level: UserLevel) => void;
  completeOnboarding: () => void;
  toggleHandsFree: () => void;
  reset: () => void;
}

const mockUser: User = {
  id: 'user-1',
  displayName: 'Learner',
  interests: ['technology', 'philosophy', 'science'],
  totalListeningMinutes: 0,
  streak: 0,
  longestStreak: 0,
  level: 'beginner',
  onboardingComplete: false,
  handsFreeEnabled: false,
  createdAt: new Date().toISOString(),
};

export const useUserStore = create<UserState>((set, get) => ({
  user: mockUser,
  isOnboardingComplete: false,
  handsFreeEnabled: false,

  setUser: (user) => set({ user }),

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

  reset: () => set({ user: mockUser, isOnboardingComplete: false, handsFreeEnabled: false }),
}));

function calculateLevel(totalMinutes: number): UserLevel {
  if (totalMinutes >= 60000) return 'master';
  if (totalMinutes >= 30000) return 'advanced';
  if (totalMinutes >= 6000) return 'intermediate';
  return 'beginner';
}
