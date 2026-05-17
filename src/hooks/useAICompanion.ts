import { useState, useCallback, useRef } from 'react';
import { aiService } from '../services/ai';
import { useSessionStore } from '../stores/sessionStore';
import type { AIQuery } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function useAICompanion() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addAIQuery, activeSession } = useSessionStore();

  const ask = useCallback(
    async (
      query: string,
      contentId: string,
      timestampSeconds: number,
      transcriptContext?: string
    ) => {
      if (!query.trim()) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        text: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await aiService.askQuestion({
          query,
          contentId,
          timestampSeconds,
          transcriptContext,
        });

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          text: response.answer,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const aiQuery: AIQuery = {
          id: `aq-${Date.now()}`,
          query,
          response: response.answer,
          timestampSeconds,
          createdAt: new Date().toISOString(),
        };

        addAIQuery(aiQuery);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get AI response');
      } finally {
        setIsLoading(false);
      }
    },
    [addAIQuery]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    ask,
    clearMessages,
  };
}
