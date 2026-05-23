import { readFile } from 'node:fs/promises';
import { stdin } from 'node:process';
import { fetchRawTranscript, fetchTranscript, packTranscriptLines, type TranscriptLine } from '../../src/services/transcript';

type CliOptions = {
  file?: string;
  url?: string;
  videoId?: string;
  withAi: boolean;
  json: boolean;
  help: boolean;
};

const TIMESTAMP_LINE = /^\s*(?:\[)?(?<start>\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:-|-->|–|—)\s*(?<end>\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?|\d+(?:\.\d+)?)(?:\])?\s*(?<text>.*)$/;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { withAi: false, json: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--file' || arg === '-f') options.file = argv[++i];
    else if (arg === '--url' || arg === '-u') options.url = argv[++i];
    else if (arg === '--video-id' || arg === '-v') options.videoId = argv[++i];
    else if (arg === '--with-ai') options.withAi = true;
    else if (!options.file) options.file = arg;
  }

  return options;
}

function usage(): string {
  return `Transcript split review runner

Usage:
  npm run test:transcript -- --url "https://www.youtube.com/watch?v=VIDEO_ID"
  npm run test:transcript -- --with-ai --url "https://www.youtube.com/watch?v=VIDEO_ID"
  npm run test:transcript -- --video-id VIDEO_ID
  npm run test:transcript -- --file ./sample-transcript.txt
  npm run test:transcript -- ./sample-transcript.txt
  pbpaste | npm run test:transcript --
  npm run test:transcript -- --json ./sample-transcript.txt

Input formats:
  YouTube URL/video ID: fetches raw transcript through src/services/transcript.ts.
  Plain text: one or many transcript paragraphs/lines.
  Timestamped lines: 00:00-00:03 first fragment text
  JSON: [{ "text": "...", "start": 0, "duration": 2.5 }]

Output:
  Split chunks from the real app algorithm in src/services/transcript.ts.
`;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readInput(file?: string): Promise<string> {
  if (file) return readFile(file, 'utf8');
  return readStdin();
}

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function parseTimestamp(value: string): number {
  if (!value.includes(':')) return Number(value);
  const parts = value.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text: string): number {
  return (text.match(/[.!?](?:["'”’)]|\s|$)/g) ?? []).length || 1;
}

function tryParseJson(input: string): TranscriptLine[] | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) return null;

    const lines = parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        if (typeof obj.text !== 'string') return null;
        const start = typeof obj.start === 'number' ? obj.start : Number(obj.start ?? 0);
        const duration = typeof obj.duration === 'number' ? obj.duration : Number(obj.duration ?? 2);
        if (!Number.isFinite(start) || !Number.isFinite(duration)) return null;
        return { text: obj.text, start, duration } satisfies TranscriptLine;
      })
      .filter((line): line is TranscriptLine => line != null);

    return lines.length ? lines : null;
  } catch {
    return null;
  }
}

function parseTextInput(input: string): TranscriptLine[] {
  const nonEmptyLines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lines = nonEmptyLines.length ? nonEmptyLines : [input.trim()].filter(Boolean);
  const fragments: TranscriptLine[] = [];
  let cursor = 0;

  for (const line of lines) {
    const match = line.match(TIMESTAMP_LINE);
    if (match?.groups) {
      const start = parseTimestamp(match.groups.start);
      const end = parseTimestamp(match.groups.end);
      const text = match.groups.text.trim();
      if (text) fragments.push({ text, start, duration: Math.max(0.5, end - start) });
      cursor = Math.max(cursor, end);
      continue;
    }

    const duration = Math.max(1.5, wordCount(line) * 0.35);
    fragments.push({ text: line, start: cursor, duration });
    cursor += duration;
  }

  return fragments;
}

function parseInput(input: string): TranscriptLine[] {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('No transcript input provided. Pipe text or pass --file.');
  return tryParseJson(trimmed) ?? parseTextInput(trimmed);
}

async function getInputFragments(options: CliOptions): Promise<{ source: string; fragments: TranscriptLine[]; videoId: string | null }> {
  const directVideoId = options.videoId ?? (options.url ? extractYouTubeId(options.url) : null);
  if (directVideoId) {
    const raw = await fetchRawTranscript(directVideoId);
    return { source: `YouTube ${directVideoId}`, fragments: raw.lines, videoId: directVideoId };
  }

  const input = await readInput(options.file);
  const fileVideoId = extractYouTubeId(input);
  if (fileVideoId && input.trim().split(/\s+/).length === 1) {
    const raw = await fetchRawTranscript(fileVideoId);
    return { source: `YouTube ${fileVideoId}`, fragments: raw.lines, videoId: fileVideoId };
  }

  return { source: options.file ? `File ${options.file}` : 'stdin', fragments: parseInput(input), videoId: null };
}

async function getChunks(options: CliOptions, fragments: TranscriptLine[], videoId: string | null): Promise<TranscriptLine[]> {
  if (options.withAi) {
    if (!videoId) throw new Error('--with-ai requires --url or --video-id input');
    const data = await fetchTranscript(videoId);
    return data.lines;
  }

  return packTranscriptLines(fragments);
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const ms = Math.round((seconds - whole) * 1000);
  const minutes = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function printReview(source: string, inputLines: TranscriptLine[], chunks: TranscriptLine[]) {
  console.log(`Source: ${source}`);
  console.log(`Input fragments: ${inputLines.length}`);
  console.log(`Output chunks: ${chunks.length}`);
  console.log('');

  chunks.forEach((chunk, index) => {
    const end = chunk.start + chunk.duration;
    console.log(`#${index + 1}`);
    console.log(`time: ${formatTime(chunk.start)} - ${formatTime(end)}`);
    console.log(`words: ${wordCount(chunk.text)} | sentences: ${sentenceCount(chunk.text)} | chars: ${chunk.text.length}`);
    console.log(chunk.text);
    console.log('');
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const { source, fragments, videoId } = await getInputFragments(options);
  const chunks = await getChunks(options, fragments, videoId);

  if (options.json) {
    console.log(JSON.stringify({ source, inputFragments: fragments, chunks }, null, 2));
    return;
  }

  printReview(source, fragments, chunks);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`transcript split review failed: ${message}`);
  process.exit(1);
});
