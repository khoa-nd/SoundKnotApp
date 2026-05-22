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

const MAX_SENTENCES_PER_CHUNK = 3;
const MIN_WORDS_PER_CHUNK = 30;
const MAX_WORDS_PER_CHUNK = 40;
const UNPUNCTUATED_WORDS_PER_CHUNK = 45;
const COMMON_ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
  'e.g',
  'i.e',
  'u.s',
  'u.k',
]);

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

function lineEnd(line: TranscriptLine): number {
  return line.start + line.duration;
}

function mergeLines(lines: TranscriptLine[]): TranscriptLine {
  const first = lines[0];
  const last = lines[lines.length - 1];
  return {
    text: lines.map((line) => normalizeFragmentText(line.text)).filter(Boolean).join(' '),
    start: first.start,
    duration: Math.max(0.5, lineEnd(last) - first.start),
  };
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildTimedText(fragments: TranscriptLine[]): { text: string; times: number[] } {
  let text = '';
  const times: number[] = [];

  for (const fragment of fragments) {
    const fragmentText = normalizeFragmentText(fragment.text);
    if (!fragmentText) continue;

    if (text.length > 0) {
      text += ' ';
      times.push(fragment.start);
    }

    const charDuration = fragment.duration / Math.max(1, fragmentText.length);
    for (let i = 0; i < fragmentText.length; i++) {
      text += fragmentText[i];
      times.push(fragment.start + i * charDuration);
    }
  }

  return { text, times };
}

function previousToken(text: string, index: number): string {
  const before = text.slice(0, index).trim();
  return before.match(/([A-Za-z](?:[A-Za-z.]*)?)$/)?.[1].toLowerCase() ?? '';
}

function sentenceBoundaryEnd(text: string, index: number): number | null {
  const char = text[index];
  if (char !== '.' && char !== '?' && char !== '!') return null;

  const prev = text[index - 1];
  const next = text[index + 1];
  if (char === '.' && prev && next && /\d/.test(prev) && /\d/.test(next)) return null;
  if (char === '.' && prev && next && /[A-Z]/.test(prev) && /[A-Z]/.test(next)) return null;
  if (char === '.' && COMMON_ABBREVIATIONS.has(previousToken(text, index))) return null;

  let end = index;
  while (end + 1 < text.length && /["'”’)\]]/.test(text[end + 1])) {
    end++;
  }

  const nextNonSpace = text.slice(end + 1).match(/\S/)?.[0];
  if (!nextNonSpace) return end;
  return end;
}

function lineFromSpan(text: string, times: number[], startIndex: number, endIndex: number): TranscriptLine {
  const start = times[startIndex] ?? 0;
  const nextTime = times[endIndex + 1];
  const end = nextTime ?? (times[endIndex] != null ? times[endIndex] + 0.5 : start + 0.5);
  return {
    text: text.slice(startIndex, endIndex + 1).trim(),
    start,
    duration: Math.max(0.5, end - start),
  };
}

function splitIntoSentenceUnits(fragments: TranscriptLine[]): TranscriptLine[] {
  if (fragments.length === 0) return [];
  if (!fragments.some((fragment) => countSentenceEndings(fragment.text) > 0)) {
    return mergeByWordCount(fragments);
  }

  const { text, times } = buildTimedText(fragments);
  const sentences: TranscriptLine[] = [];
  let startIndex = text.search(/\S/);
  if (startIndex < 0) return [];

  for (let i = startIndex; i < text.length; i++) {
    const end = sentenceBoundaryEnd(text, i);
    if (end == null) continue;

    const sentence = lineFromSpan(text, times, startIndex, end);
    if (sentence.text) sentences.push(sentence);

    const rest = text.slice(end + 1);
    const next = rest.search(/\S/);
    if (next < 0) return sentences;
    startIndex = end + 1 + next;
    i = startIndex;
  }

  if (startIndex < text.length) {
    const trailing = lineFromSpan(text, times, startIndex, text.length - 1);
    if (trailing.text) sentences.push(trailing);
  }

  return sentences;
}

export function packTranscriptLines(segments: TranscriptLine[]): TranscriptLine[] {
  const sentences = splitIntoSentenceUnits(segments);
  const chunks: TranscriptLine[] = [];
  let buf: TranscriptLine[] = [];

  const flush = () => {
    if (!buf.length) return;
    chunks.push(mergeLines(buf));
    buf = [];
  };

  for (const segment of sentences) {
    const text = normalizeFragmentText(segment.text);
    if (!text) continue;
    const sentence = { ...segment, text };
    const sentenceWords = wordCount(text);

    if (sentenceWords >= MIN_WORDS_PER_CHUNK) {
      flush();
      chunks.push(sentence);
      continue;
    }

    const candidate = [...buf, sentence];
    const candidateWords = wordCount(candidate.map((line) => line.text).join(' '));
    const candidateSentenceCount = candidate.length;

    if (
      candidateSentenceCount <= MAX_SENTENCES_PER_CHUNK &&
      candidateWords <= MAX_WORDS_PER_CHUNK
    ) {
      buf = candidate;
      if (candidateWords >= MIN_WORDS_PER_CHUNK || candidateSentenceCount === MAX_SENTENCES_PER_CHUNK) {
        flush();
      }
    } else {
      flush();
      buf = [sentence];
    }
  }

  flush();
  return chunks;
}

export async function fetchRawTranscript(videoId: string): Promise<TranscriptData> {
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

  return { lines: fragments, videoId };
}

export function splitTranscriptLocally(fragments: TranscriptLine[]): TranscriptLine[] {
  return packTranscriptLines(fragments);
}

export async function fetchTranscript(videoId: string): Promise<TranscriptData> {
  const data = await fetchRawTranscript(videoId);
  return { lines: splitTranscriptLocally(data.lines), videoId };
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
