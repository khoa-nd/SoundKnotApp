// ── Sound Knot V2 — YouTube Transcript Fetcher
// Uses youtube-transcript npm package (InnerTube API with HTML fallback)

import { fetchTranscript as ytFetchTranscript } from 'youtube-transcript';

export interface TranscriptLine {
  text: string;
  start: number;   // start time in seconds
  duration: number; // duration in seconds
}

export interface TranscriptData {
  lines: TranscriptLine[];
  videoId: string;
}

// Sentence-ending punctuation pattern
const SENTENCE_END = /[.!?]$/;

// Max seconds before forcing a new line even without punctuation
const MAX_MERGE_DURATION = 15;

/**
 * Merge raw transcript fragments into meaningful sentences.
 * Fragments are joined until we hit sentence-ending punctuation
 * or exceed MAX_MERGE_DURATION seconds from the first fragment.
 */
function mergeIntoSentences(fragments: TranscriptLine[]): TranscriptLine[] {
  if (fragments.length === 0) return [];

  const merged: TranscriptLine[] = [];
  let buf: string[] = [];
  let bufStart = fragments[0].start;
  let bufEnd = fragments[0].start + fragments[0].duration;

  for (const frag of fragments) {
    const fragEnd = frag.start + frag.duration;
    const wouldExceed = (fragEnd - bufStart) > MAX_MERGE_DURATION;

    // If adding this fragment would exceed the max duration and we already
    // have content, flush the buffer first
    if (wouldExceed && buf.length > 0) {
      merged.push({
        text: buf.join(' '),
        start: bufStart,
        duration: bufEnd - bufStart,
      });
      buf = [];
      bufStart = frag.start;
    }

    buf.push(frag.text);
    bufEnd = fragEnd;

    // Flush on sentence-ending punctuation
    if (SENTENCE_END.test(frag.text)) {
      merged.push({
        text: buf.join(' '),
        start: bufStart,
        duration: bufEnd - bufStart,
      });
      buf = [];
      bufStart = fragEnd;
    }
  }

  // Flush remaining
  if (buf.length > 0) {
    merged.push({
      text: buf.join(' '),
      start: bufStart,
      duration: bufEnd - bufStart,
    });
  }

  return merged;
}

export async function fetchTranscript(videoId: string): Promise<TranscriptData> {
  const raw = await ytFetchTranscript(videoId);

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('No transcript available for this video');
  }

  const fragments: TranscriptLine[] = raw
    .filter((item) => item.text && typeof item.text === 'string')
    .map((item) => ({
      text: item.text.trim(),
      start: (item.offset ?? 0) / 1000,     // offset is in ms, convert to seconds
      duration: (item.duration ?? 3000) / 1000,
    }));

  if (fragments.length === 0) {
    throw new Error('No transcript lines parsed');
  }

  const lines = mergeIntoSentences(fragments);

  return { lines, videoId };
}

// Format seconds to mm:ss or h:mm:ss
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Find the index of the transcript line that matches the current playback time
export function findCurrentLineIndex(
  lines: TranscriptLine[],
  currentTimeSeconds: number
): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].start <= currentTimeSeconds) {
      return i;
    }
  }
  return 0;
}
