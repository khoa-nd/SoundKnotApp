import { Config } from '../constants/Config';
import type { AIQuery } from '../types';

interface AIRequest {
  query: string;
  contentId: string;
  timestampSeconds: number;
  transcriptContext?: string;
}

interface AIResponse {
  answer: string;
  relatedTopics?: string[];
  suggestedContent?: string[];
}

export const aiService = {
  async askQuestion(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(Config.aiEndpoint + '/v1/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    return response.json();
  },

  async explainPhrase(
    phrase: string,
    context: string
  ): Promise<string> {
    const response = await fetch(Config.aiEndpoint + '/v1/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase, context }),
    });

    if (!response.ok) {
      throw new Error(`Explain request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  },

  buildQueryContext(
    segmentText: string,
    speaker: string,
    topic: string
  ): string {
    return `Speaker: ${speaker}\nTopic: ${topic}\nRelevant transcript: "${segmentText}"`;
  },
};
