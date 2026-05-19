import { apiClient } from './api';
import type { PracticeSession } from '../types';

export const sessionService = {
  async create(data: {
    video_id: string;
    segment?: string;
    pass?: number;
    mastery?: number;
    accuracy?: number;
    listened_seconds?: number;
  }): Promise<{ session: PracticeSession }> {
    return apiClient.post<{ session: PracticeSession }>('/sessions', data);
  },
};
