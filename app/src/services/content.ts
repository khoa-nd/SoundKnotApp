import { apiClient } from './api';
import type { ContentItem, Recommendation } from '../types';

export const contentService = {
  async fetchLibrary(): Promise<ContentItem[]> {
    return apiClient.get<ContentItem[]>('/v1/content');
  },

  async fetchById(id: string): Promise<ContentItem> {
    return apiClient.get<ContentItem>(`/v1/content/${id}`);
  },

  async fetchRecommendations(interests: string[]): Promise<Recommendation[]> {
    return apiClient.post<Recommendation[]>('/v1/recommendations', {
      interests,
      limit: 20,
    });
  },

  async search(query: string, topics: string[] = []): Promise<ContentItem[]> {
    return apiClient.post<ContentItem[]>('/v1/content/search', {
      query,
      topics,
    });
  },

  async fetchTopics(): Promise<string[]> {
    return apiClient.get<string[]>('/v1/topics');
  },

  async getSignedUrl(contentId: string): Promise<string> {
    const { url } = await apiClient.get<{ url: string }>(
      `/v1/content/${contentId}/audio`
    );
    return url;
  },
};
