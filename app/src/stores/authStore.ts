import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';
import { authService } from '../services/auth';
import type { AuthSession, AuthUser } from '../types';

const STORAGE_KEY_SESSION = 'soundknot_session';
const STORAGE_KEY_USER = 'soundknot_user';

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      apiClient.setToken(data.session.access_token);
      await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(email, password, displayName);
      apiClient.setToken(data.session.access_token);
      await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore server error on logout
    }
    apiClient.clearToken();
    await AsyncStorage.multiRemove([STORAGE_KEY_SESSION, STORAGE_KEY_USER]);
    set({ user: null, session: null, isAuthenticated: false, error: null });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const sessionStr = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
      const userStr = await AsyncStorage.getItem(STORAGE_KEY_USER);
      if (!sessionStr || !userStr) {
        set({ isLoading: false });
        return false;
      }

      const session: AuthSession = JSON.parse(sessionStr);
      const user: AuthUser = JSON.parse(userStr);

      // Check if token is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        await AsyncStorage.multiRemove([STORAGE_KEY_SESSION, STORAGE_KEY_USER]);
        set({ isLoading: false });
        return false;
      }

      apiClient.setToken(session.access_token);

      // Validate token is still valid by calling /auth/me
      try {
        await authService.me();
      } catch {
        apiClient.clearToken();
        await AsyncStorage.multiRemove([STORAGE_KEY_SESSION, STORAGE_KEY_USER]);
        set({ isLoading: false });
        return false;
      }

      set({ user, session, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

useAuthStore.subscribe((state, prev) => {
  const token = state.session?.access_token ?? null;
  const prevToken = prev.session?.access_token ?? null;
  if (token === prevToken) return;
  if (token) apiClient.setToken(token);
  else apiClient.clearToken();
});
