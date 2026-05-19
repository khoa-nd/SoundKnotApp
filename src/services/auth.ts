import { apiClient } from './api';
import type { AuthSession, AuthUser, Profile, UserProgress } from '../types';

interface AuthResponse {
  session: AuthSession;
  user: AuthUser;
}

interface MeResponse {
  profile: Profile;
  progress: UserProgress;
}

export const authService = {
  async register(email: string, password: string, display_name?: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', { email, password, display_name });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { email, password });
  },

  async logout(): Promise<void> {
    await apiClient.post<{ message: string }>('/auth/logout', {});
  },

  async me(): Promise<MeResponse> {
    return apiClient.get<MeResponse>('/auth/me');
  },
};
