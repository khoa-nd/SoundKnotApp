// ── Sound Knot V2 — AI Tutor service
// Two modes:
//   1. proxy  — POST {apiBaseUrl}/ai/chat  (key lives on server, Gemini only)
//   2. direct — Provider chosen per AiSettings; key on device:
//        - gemini      → generativelanguage.googleapis.com
//        - openrouter  → openrouter.ai/api/v1/chat/completions

import { Config } from '../constants/Config';
import { apiClient } from './api';
import { formatTimestamp, type TranscriptLine } from './transcript';

export type AiProvider = 'gemini' | 'openrouter';
export type AiMode = 'proxy' | 'direct';

export interface AiAudioAttachment {
  base64: string;
  mimeType: string; // e.g. 'audio/m4a', 'audio/mp4', 'audio/webm'
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  audio?: AiAudioAttachment;
}

export interface AiContext {
  videoTitle?: string;
  videoChannel?: string;
  videoId?: string;
  // ~30s window of transcript around current playback time (used for vocab/comprehension intents)
  transcriptWindow?: string;
  // Whole video transcript with per-line timestamps (used for summary intent)
  fullTranscript?: string;
  // The user's selection (from long-press), if any
  selection?: string;
}

export interface AiSettings {
  mode: AiMode;
  provider: AiProvider;
  model: string;
  apiKey: string;
}

export interface AiChatRequest {
  messages: AiMessage[];
  context?: AiContext;
  settings: AiSettings;
}

export interface AiChatResponse {
  reply: string;
}

// Gemini models offered in the settings UI. To verify any model name is live
// on your key, list available models with:
//   curl "https://generativelanguage.googleapis.com/v1beta/models?key=<KEY>"
// Free-tier quotas are small for *-pro models (often ~50 requests/day) and
// generous for *-flash variants — pick accordingly.
export const GEMINI_MODELS = [
  'gemini-2.5-pro',          // Default — high quality, but free tier has a tight daily cap.
  'gemini-3.5-flash',
  'gemini-3.1-pro',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
] as const;

// ── Prompt building ──────────────────────────────────────────────────────────

// Kept in sync with api/src/lib/aiSystemPrompt.ts. The proxy mode uses the
// server-side prompt; this copy is only used by the direct (BYO Gemini key) mode.
const PREAMBLE = [
  'You are an English listening tutor inside the Sound Knot app. The learner is practicing with a YouTube video.',
  '',
  'PRIORITY OF INSTRUCTIONS',
  "If the learner's message contains explicit output instructions (e.g. \"return only a numbered list\",",
  '"no intro, no outro", "use exactly this format: ..."), follow those instructions verbatim. They',
  'override every default below — including paragraph length, prefatory text, and follow-up offers.',
  '',
  'DEFAULT ANSWER SHAPES (used only when the learner gives no explicit format)',
  "Pick the shape that best matches the learner's message:",
  '',
  'A. SUMMARY ("summarize", "what is this video about", "key themes", "main points", "recap") →',
  '   Bulleted Markdown grouped by theme. Cover the whole video, not just the beginning.',
  '   Do NOT include timestamps in summaries — keep bullets clean. (Comprehension answers may still cite.)',
  '',
  'B. VOCABULARY or PHRASE EXPLANATION ("what does X mean", "explain Y", "translate Z") →',
  '   2–4 short paragraphs. Definition + 1 concrete example. Do not cite timestamps unless',
  '   the learner asked about a specific occurrence.',
  '',
  'C. CURATED LIST ("list of keywords", "list of phrases", "give me 8 ...") →',
  "   This is almost always paired with explicit format instructions in the learner's message.",
  '   Honor those exactly. Default: a numbered list, no intro, no outro, no closing remarks.',
  '   Do not invent timestamps inside list items unless the learner asked for them.',
  '',
  "D. COMPREHENSION (everything else: \"why did they say…\", \"what's the argument\") →",
  '   Grounded answer in 2–4 short paragraphs with 1–3 timestamp citations using [t=MM:SS].',
  '',
  'TIMESTAMP RULES',
  '- Timestamps are ONLY for COMPREHENSION answers (shape D). Never include them in SUMMARY (A),',
  '  VOCABULARY (B), or CURATED LIST (C) responses — those should be clean of any [t=...] tokens.',
  '- When you do cite (comprehension only), use the literal token [t=MM:SS] (square brackets,',
  '  lowercase t, equals sign). The UI parses these and renders them as tap-to-seek links.',
  '  Plain "(0:45)" or "at 25:07" will not work.',
  '- NEVER invent a timestamp. Only cite timestamps that appear in the transcript you were given.',
  '- If you were not given a transcript, do not cite any timestamps.',
  '',
  'STYLE',
  '- Keep answers concrete and warm. Use plain Markdown — bold, italics, bullets — only when it helps.',
  '- Always answer in the language the learner uses. English in, English out. Vietnamese in, Vietnamese out.',
].join('\n');

function buildSystemPrompt(context?: AiContext): string {
  const sections: string[] = [PREAMBLE];
  if (context?.videoTitle) {
    sections.push(`Video: "${context.videoTitle}"${context.videoChannel ? ` — ${context.videoChannel}` : ''}.`);
  } else if (context?.videoChannel) {
    sections.push(`Channel: ${context.videoChannel}.`);
  }
  if (context?.fullTranscript) {
    sections.push(`Full transcript with timestamps (one line per row, "MM:SS  text"):\n"""\n${context.fullTranscript}\n"""`);
  } else if (context?.transcriptWindow) {
    sections.push(`Nearby transcript:\n"""\n${context.transcriptWindow}\n"""`);
  }
  if (context?.selection) sections.push(`The learner has selected: "${context.selection}".`);
  return sections.join('\n\n');
}

// ── Direct Gemini call ───────────────────────────────────────────────────────

interface GeminiPart { text?: string; inlineData?: { mimeType: string; data: string } }
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
}

async function callGeminiDirect(req: AiChatRequest): Promise<AiChatResponse> {
  const { settings, messages, context } = req;
  if (!settings.apiKey) throw new Error('Missing API key. Open AI settings to add one.');

  const systemPrompt = buildSystemPrompt(context);
  const contents = messages.map((m) => {
    const parts: any[] = [];
    if (m.audio) parts.push({ inlineData: { mimeType: m.audio.mimeType, data: m.audio.base64 } });
    if (m.content) parts.push({ text: m.content });
    if (parts.length === 0) parts.push({ text: '' });
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });

  const data: GeminiResponse = await response.json().catch(() => ({} as GeminiResponse));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini error: ${response.status}`);
  }

  const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!reply) throw new Error('Gemini returned an empty response.');
  return { reply };
}

// ── OpenRouter (direct mode) ─────────────────────────────────────────────────

// Used as the initial model selection when a user first switches to OpenRouter,
// before the live model list arrives. Any free-tier-flagged model would work; this
// one is a reasonable middle ground for the AI Tutor use case.
export const DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

interface OpenRouterModel {
  id: string;            // e.g. "anthropic/claude-sonnet-4.5", "meta-llama/llama-3.3-70b-instruct:free"
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

interface OpenRouterModelsResponse {
  data?: OpenRouterModel[];
}

interface OpenRouterChatChoice {
  message?: { role?: string; content?: string };
  finish_reason?: string;
}
interface OpenRouterChatResponse {
  choices?: OpenRouterChatChoice[];
  error?: { message?: string; code?: number };
}

// GET https://openrouter.ai/api/v1/models — returns the live catalog (~500 models).
// We pass the user's key as Authorization so the response reflects what their
// account can actually call (some endpoints are key-gated).
export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  if (!apiKey) throw new Error('Missing OpenRouter API key.');
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data: OpenRouterModelsResponse = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`OpenRouter models lookup failed: ${res.status}`);
  }
  return Array.isArray(data.data) ? data.data : [];
}

async function callOpenRouterDirect(req: AiChatRequest): Promise<AiChatResponse> {
  const { settings, messages, context } = req;
  if (!settings.apiKey) throw new Error('Missing API key. Open AI settings to add one.');

  // Audio attachments are dropped — OpenRouter's chat API doesn't accept Gemini's
  // inlineData shape. A future revision could base64-encode and inline via a
  // model that supports it (e.g. gpt-4o-audio), but most OpenRouter models won't.
  const droppedAudio = messages.some((m) => m.audio);

  const systemPrompt = buildSystemPrompt(context);
  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content || (m.audio ? '(voice question — audio not supported on this provider)' : ''),
    })),
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      // OpenRouter recommends these for app attribution / rankings; both optional.
      'HTTP-Referer': 'https://soundknot.app',
      'X-Title': 'SoundKnot',
    },
    body: JSON.stringify({
      model: settings.model,
      messages: chatMessages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  });

  const data: OpenRouterChatResponse = await response.json().catch(() => ({} as OpenRouterChatResponse));
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenRouter error: ${response.status}`);
  }
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('OpenRouter returned an empty response.');
  if (droppedAudio) {
    return { reply: `${reply}\n\n_(Note: voice input isn't supported on OpenRouter — type your question instead, or switch to Gemini.)_` };
  }
  return { reply };
}

// ── Backend proxy call ───────────────────────────────────────────────────────

async function callProxy(req: AiChatRequest): Promise<AiChatResponse> {
  // Backend is expected to expose POST /ai/chat that accepts our shape and
  // returns { reply: string }. The proxy holds the API key server-side.
  // Only Gemini is wired through the backend today; OpenRouter is direct-only.
  if (req.settings.provider !== 'gemini') {
    throw new Error(`${req.settings.provider} is only available in Direct mode. Switch mode in AI Settings.`);
  }
  const res = await apiClient.post<AiChatResponse>('/ai/chat', {
    provider: req.settings.provider,
    model: req.settings.model,
    messages: req.messages,
    context: req.context ?? null,
  });
  if (!res?.reply) throw new Error('Proxy returned an empty response.');
  return res;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function chat(req: AiChatRequest): Promise<AiChatResponse> {
  if (req.settings.mode === 'direct') {
    if (req.settings.provider === 'openrouter') return callOpenRouterDirect(req);
    return callGeminiDirect(req);
  }
  return callProxy(req);
}

// Build a transcript window around `centerSeconds`. Uses a +/- half-window
// of ~15s so total context is ~30s by default.
export function buildTranscriptWindow(
  lines: { text: string; start: number; duration: number }[],
  centerSeconds: number,
  halfWindow = 15,
): string {
  if (!lines.length) return '';
  const lo = centerSeconds - halfWindow;
  const hi = centerSeconds + halfWindow;
  const picked = lines.filter((l) => l.start + l.duration >= lo && l.start <= hi);
  // Fallback: if nothing matched (e.g. before playback), grab first 5 lines.
  const window = picked.length ? picked : lines.slice(0, 5);
  return window.map((l) => l.text).join(' ');
}

// Convenience used by the proxy server URL display etc.
export function describeMode(s: AiSettings): string {
  if (s.mode === 'proxy') return `Backend proxy · ${Config.apiBaseUrl}`;
  const providerLabel = s.provider === 'openrouter' ? 'OpenRouter' : 'Gemini';
  return `Direct · ${providerLabel} · ${s.model}`;
}

// ── Full-video context (used for summary-intent questions) ───────────────────

const FULL_TRANSCRIPT_CHAR_CAP = 30000;
// Matches any intent that benefits from seeing the WHOLE video transcript instead of just a ±15s slice:
//   - SUMMARY ("summarize this video", "key themes", "main points", "tl;dr", "recap")
//   - CURATED LIST ("list of keywords", "list of phrases", "curate 8 vocabulary items", etc.)
const FULL_SCOPE_INTENT_REGEX = /\b(summari[sz]|key theme|main point|overall|what.*video.*about|what is this video|tl;dr|recap|curate|list of (?:keyword|phrase|grammar|vocabulary|word)|\d+\s+(?:keyword|phrase|grammar|vocabulary|word)s?)\b/i;

export function isSummaryIntent(userMessage: string): boolean {
  return FULL_SCOPE_INTENT_REGEX.test(userMessage);
}

// Builds a single string "MM:SS  text" per line, capped at FULL_TRANSCRIPT_CHAR_CAP.
// If over cap, drops middle lines and inserts a marker so the model sees both ends.
export function buildFullTranscript(lines: TranscriptLine[]): string {
  if (!lines?.length) return '';
  const rows = lines.map((l) => `${formatTimestamp(l.start)}  ${l.text.trim()}`).filter((r) => r.length > 5);
  const joined = rows.join('\n');
  if (joined.length <= FULL_TRANSCRIPT_CHAR_CAP) return joined;

  // Truncate from the middle, keep ~equal halves around a marker.
  const half = Math.floor(FULL_TRANSCRIPT_CHAR_CAP / 2);
  let head = '';
  for (const row of rows) {
    if (head.length + row.length + 1 > half) break;
    head += (head ? '\n' : '') + row;
  }
  let tail = '';
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (tail.length + row.length + 1 > half) break;
    tail = row + (tail ? '\n' : '') + tail;
  }
  return `${head}\n[... transcript truncated to fit context ...]\n${tail}`;
}
