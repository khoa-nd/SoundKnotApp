import { apiClient } from './api';
import type { TranscriptLine } from './transcript';

export const transcriptApi = {
  async get(youtubeVideoId: string): Promise<TranscriptLine[] | null> {
    try {
      const res = await apiClient.get<{ videoId: string; lines: TranscriptLine[] }>(
        `/transcripts/${encodeURIComponent(youtubeVideoId)}`
      );
      if (!Array.isArray(res.lines) || res.lines.length === 0) return null;
      return res.lines;
    } catch (err: any) {
      const message = err?.message ?? '';
      if (/not cached|404/i.test(message)) return null;
      throw err;
    }
  },

  async save(youtubeVideoId: string, lines: TranscriptLine[]): Promise<void> {
    await apiClient.post<{ ok: boolean; videoId: string; count: number }>(
      `/transcripts/${encodeURIComponent(youtubeVideoId)}`,
      { lines }
    );
  },
};
