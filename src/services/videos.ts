import { apiClient } from './api';
import type { UserVideo, PracticeSession } from '../types';

export const videoService = {
  async list(): Promise<{ videos: UserVideo[] }> {
    return apiClient.get<{ videos: UserVideo[] }>('/videos');
  },

  async add(video: {
    youtube_video_id: string;
    title?: string;
    channel?: string;
    thumbnail_url?: string;
  }): Promise<{ video: UserVideo }> {
    return apiClient.post<{ video: UserVideo }>('/videos', video);
  },

  async getSessions(videoId: string): Promise<{ sessions: PracticeSession[] }> {
    return apiClient.get<{ sessions: PracticeSession[] }>(`/videos/${videoId}/sessions`);
  },
};
