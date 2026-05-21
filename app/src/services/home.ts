import { apiClient } from './api';
import type { HomeData } from '../types';

export const homeService = {
  async fetch(): Promise<HomeData> {
    return apiClient.get<HomeData>('/home');
  },
};
