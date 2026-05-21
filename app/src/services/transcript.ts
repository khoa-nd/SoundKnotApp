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

const SENTENCES_PER_CHUNK = 2;
const SENTENCE_END_RE = /[.?]["'”’)\]]?\s*$/;
const UNPUNCTUATED_WORDS_PER_CHUNK = 30;

function normalizeFragmentText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function countSentenceEndings(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c !== '.' && c !== '?') continue;
    const prev = text[i - 1];
    const next = text[i + 1];
    if (prev && next && /\d/.test(prev) && /\d/.test(next)) continue;
    count++;
  }
  return count;
}

function hasSentencePunctuation(fragments: TranscriptLine[]): boolean {
  for (const f of fragments) {
    if (countSentenceEndings(f.text) > 0) return true;
  }
  return false;
}

function mergeBySentence(fragments: TranscriptLine[]): TranscriptLine[] {
  const result: TranscriptLine[] = [];
  let buf: string[] = [];
  let bufStart = fragments[0].start;
  let bufEnd = fragments[0].start + fragments[0].duration;
  let sentenceCount = 0;

  for (const frag of fragments) {
    const text = normalizeFragmentText(frag.text);
    if (!text) continue;

    if (buf.length === 0) bufStart = frag.start;
    buf.push(text);
    bufEnd = frag.start + frag.duration;
    sentenceCount += countSentenceEndings(text);

    if (sentenceCount >= SENTENCES_PER_CHUNK && SENTENCE_END_RE.test(text)) {
      result.push({ text: buf.join(' '), start: bufStart, duration: bufEnd - bufStart });
      buf = [];
      sentenceCount = 0;
    }
  }

  if (buf.length > 0) {
    result.push({ text: buf.join(' '), start: bufStart, duration: bufEnd - bufStart });
  }
  return result;
}

function mergeByWordCount(fragments: TranscriptLine[]): TranscriptLine[] {
  const result: TranscriptLine[] = [];
  let buf: string[] = [];
  let bufStart = fragments[0].start;
  let bufEnd = fragments[0].start + fragments[0].duration;
  let wordCount = 0;

  for (const frag of fragments) {
    const text = normalizeFragmentText(frag.text);
    if (!text) continue;

    if (buf.length === 0) bufStart = frag.start;
    buf.push(text);
    bufEnd = frag.start + frag.duration;
    wordCount += text.split(/\s+/).filter(Boolean).length;

    if (wordCount >= UNPUNCTUATED_WORDS_PER_CHUNK) {
      result.push({ text: buf.join(' '), start: bufStart, duration: bufEnd - bufStart });
      buf = [];
      wordCount = 0;
    }
  }

  if (buf.length > 0) {
    result.push({ text: buf.join(' '), start: bufStart, duration: bufEnd - bufStart });
  }
  return result;
}

function mergeIntoSentences(fragments: TranscriptLine[]): TranscriptLine[] {
  if (fragments.length === 0) return [];
  return hasSentencePunctuation(fragments)
    ? mergeBySentence(fragments)
    : mergeByWordCount(fragments);
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

  return { lines: mergeIntoSentences(fragments), videoId };
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
