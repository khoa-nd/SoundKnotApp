import { useState, useCallback, useMemo } from 'react';
import { useContentStore } from '../stores/contentStore';
import { useUserStore } from '../stores/userStore';
import type { ContentItem } from '../types';

export function useRecommendations() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { library, recommendations } = useContentStore();
  const user = useUserStore((s) => s.user);

  const recommendedContent = useMemo(() => {
    if (recommendations.length === 0) {
      // Fallback: score content by interest overlap
      return library
        .map((item) => {
          const interestOverlap = user?.interests.filter((i) =>
            item.topics.includes(i)
          ).length ?? 0;
          return { item, score: interestOverlap };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    }

    const recMap = new Map(recommendations.map((r) => [r.contentId, r]));
    return library
      .filter((item) => recMap.has(item.id))
      .sort((a, b) => {
        const scoreA = recMap.get(a.id)?.score ?? 0;
        const scoreB = recMap.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });
  }, [library, recommendations, user?.interests]);

  const refresh = useCallback(async (interests: string[]) => {
    setIsRefreshing(true);
    try {
      const { contentService } = await import('../services/content');
      const recs = await contentService.fetchRecommendations(interests);
      useContentStore.getState().setRecommendations(recs);
    } catch {
      // Fall back to interest-based local scoring
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    recommendedContent,
    isRefreshing,
    refresh,
  };
}
