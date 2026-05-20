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

// Sentence-ending punctuation. Matches `.`/`!`/`?` optionally followed
// by a closing quote, paren, or bracket — e.g. `he said."`, `(yes!)`.
const SENTENCE_END = /[.!?]["'”’)\]]?\s*$/;

// Hard safety cap: only triggers for transcripts with no punctuation at all
// (some auto-generated YouTube captions). Sentence boundaries are the primary
// split signal; this just prevents one unbounded blob.
const MAX_MERGE_DURATION = 90;

function normalizeFragmentText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Merge raw transcript fragments into full sentences.
 *
 * Primary boundary: sentence-ending punctuation (`.`, `!`, `?`, including a
 * trailing quote/paren). The 90-second cap is a safety net for unpunctuated
 * captions; punctuated transcripts are split strictly dot-to-dot.
 */
function mergeIntoSentences(fragments: TranscriptLine[]): TranscriptLine[] {
  if (fragments.length === 0) return [];

  const merged: TranscriptLine[] = [];
  let buf: string[] = [];
  let bufStart = fragments[0].start;
  let bufEnd = fragments[0].start + fragments[0].duration;

  for (const frag of fragments) {
    const fragEnd = frag.start + frag.duration;
    const text = normalizeFragmentText(frag.text);
    if (!text) continue;

    if (buf.length === 0) bufStart = frag.start;
    buf.push(text);
    bufEnd = fragEnd;

    const endsSentence = SENTENCE_END.test(text);
    const exceededCap = (bufEnd - bufStart) > MAX_MERGE_DURATION;

    if (endsSentence || exceededCap) {
      merged.push({
        text: buf.join(' '),
        start: bufStart,
        duration: bufEnd - bufStart,
      });
      buf = [];
    }
  }

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
