import { apiClient } from './api';
import { fetchRawTranscript, packTranscriptLines, splitTranscriptLocally, type TranscriptLine } from './transcript';

const MAX_VIDEO_SECONDS = 30 * 60;

export type PreprocessStepId = 'provider' | 'duration' | 'transcript' | 'language' | 'ai';

export interface PreprocessStep {
  id: PreprocessStepId;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  detail?: string;
}

export interface PreprocessResult {
  videoId: string;
  lines: TranscriptLine[];
}

interface YouTubeOEmbed {
  title?: string;
  author_name?: string;
}

interface SplitTranscriptResponse {
  lines: TranscriptLine[];
}

export const INITIAL_PREPROCESS_STEPS: PreprocessStep[] = [
  { id: 'provider', label: 'Recognize video provider', status: 'pending' },
  { id: 'duration', label: 'Check video length', status: 'pending' },
  { id: 'transcript', label: 'Load transcript', status: 'pending' },
  { id: 'language', label: 'Check transcript language', status: 'pending' },
  { id: 'ai', label: 'Split transcript with AI', status: 'pending' },
];

export function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function countAsciiLetters(text: string): number {
  const matches = text.match(/[a-z]/gi);
  return matches?.length ?? 0;
}

function countNonAsciiLetters(text: string): number {
  const matches = text.match(/[^\x00-\x7F]/g);
  return matches?.length ?? 0;
}

function assertLikelyEnglish(lines: TranscriptLine[]) {
  const sample = lines.slice(0, 80).map((line) => line.text).join(' ');
  const asciiLetters = countAsciiLetters(sample);
  const nonAsciiLetters = countNonAsciiLetters(sample);
  const commonWords = sample.toLowerCase().match(/\b(the|and|you|that|this|with|for|are|was|have|not|but|from|they|we|can|will|just|what|when|there)\b/g)?.length ?? 0;

  if (asciiLetters < 80 || commonWords < 4 || nonAsciiLetters > asciiLetters * 0.25) {
    throw new Error('This transcript does not look like English yet. Try an English-captioned video.');
  }
}

function estimateTranscriptDuration(lines: TranscriptLine[]): number {
  const last = lines[lines.length - 1];
  return last.start + last.duration;
}

async function assertVideoEmbeddable(videoId: string): Promise<YouTubeOEmbed> {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error('Could not read this YouTube link. Check that the video is public and try again.');
  }

  return response.json();
}

export const preprocessService = {
  async prepareYoutubeUrl(
    url: string,
    onStep: (id: PreprocessStepId, status: PreprocessStep['status'], detail?: string) => void,
  ): Promise<PreprocessResult> {
    onStep('provider', 'running');
    const videoId = extractYouTubeId(url.trim());
    if (!videoId) {
      onStep('provider', 'failed', 'Only YouTube links are supported right now.');
      throw new Error('Only YouTube links are supported right now.');
    }
    onStep('provider', 'done', 'YouTube link detected.');

    onStep('duration', 'running');
    const metadata = await assertVideoEmbeddable(videoId);
    onStep('duration', 'done', metadata.title ? `Video found: ${metadata.title}` : 'Video found.');

    onStep('transcript', 'running');
    const raw = await fetchRawTranscript(videoId);
    if (raw.lines.length === 0) {
      onStep('transcript', 'failed', 'No transcript is available for this video.');
      throw new Error('No transcript is available for this video.');
    }
    const duration = estimateTranscriptDuration(raw.lines);
    if (duration > MAX_VIDEO_SECONDS) {
      onStep('duration', 'failed', 'Video must be less than 30 minutes.');
      throw new Error('Video must be less than 30 minutes.');
    }
    onStep('transcript', 'done', `${raw.lines.length} transcript fragments loaded.`);
    onStep('duration', 'done', `${Math.ceil(duration / 60)} min video.`);

    onStep('language', 'running');
    assertLikelyEnglish(raw.lines);
    onStep('language', 'done', 'Transcript looks like English.');

    onStep('ai', 'running');
    try {
      const response = await apiClient.post<SplitTranscriptResponse>('/ai/split-transcript', {
        videoId,
        transcript: raw.lines,
      });
      if (!Array.isArray(response.lines) || response.lines.length === 0) {
        throw new Error('AI did not return any transcript segments.');
      }
      const packed = packTranscriptLines(response.lines);
      onStep('ai', 'done', `${packed.length} practice lines prepared.`);
      return { videoId, lines: packed };
    } catch {
      const fallback = splitTranscriptLocally(raw.lines);
      onStep('ai', 'done', `AI split unavailable; prepared ${fallback.length} local practice lines.`);
      return { videoId, lines: fallback };
    }
  },
};
