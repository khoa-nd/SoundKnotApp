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

export interface AiSamplingParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AiChatRequest {
  messages: AiMessage[];
  context?: AiContext;
  settings: AiSettings;
  // Playground-only: replaces the built-in PREAMBLE so prompt-tuning can win
  // over the Tutor's defaults. Direct mode only; ignored by the proxy.
  systemPromptOverride?: string;
  // Playground-only: forwarded to the provider's sampling controls.
  params?: AiSamplingParams;
}

export interface AiChatResponse {
  reply: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
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
  'You are an expert English listening tutor inside the Sound Knot app. The learner is practicing with a YouTube video.',
  '',
  'PRIORITY OF INSTRUCTIONS',
  "If the learner's message contains explicit output instructions (e.g. \"return only a numbered list\",",
  '"no intro, no outro", "use exactly this format: ..."), follow those instructions verbatim. They override every default below.',
  '',
  'DEFAULT ANSWER SHAPES (used only when the learner gives no explicit format)',
  "Pick the shape that best matches the learner's message:",
  '',
  'A. SUMMARY ("summarize", "what is this video about", "key themes", "main points", "recap") →',
  '   Provide a beautifully structured, comprehensive summary of the main ideas. Use rich Markdown including descriptive headings (### H3), sub-headings, paragraph explanations, and bulleted lists. Focus on capturing the core arguments, context, and takeaways across the entire video. Do not include timestamps in the summary.',
  '',
  'B. VOCABULARY or PHRASE EXPLANATION ("what does X mean", "explain Y", "translate Z") →',
  '   Provide a rich, educational explanation. Include a clear definition, practical usage context, pronunciation/listening tips, and a concrete example sentence. Use bolding to highlight key terms.',
  '',
  'C. CURATED LIST ("list of keywords", "list of phrases", "give me 8 ...") →',
  '   Return a beautifully formatted numbered list. No introductory or closing conversational filler. Follow any format instructions requested by the learner.',
  '',
  "D. COMPREHENSION (everything else: \"why did they say…\", \"what's the argument\") →",
  '   Provide a clear, well-reasoned, and thorough answer. Back up your explanation with 1–3 specific timestamp citations using the [t=MM:SS] format where appropriate.',
  '',
  'TIMESTAMP RULES',
  '- When citing timestamps (Comprehension/explanations only), you MUST use the literal token [t=MM:SS] (square brackets, lowercase t, equals sign, minutes, seconds). The UI parses these to render tap-to-seek links. Plain "(0:45)" or "at 25:07" will not work.',
  '- NEVER invent a timestamp. Only cite timestamps that appear in the transcript you were given. If no transcript is provided, do not cite any timestamps.',
  '',
  'STYLE',
  '- Be professional, highly educational, clear, and warm.',
  '- Use rich Markdown structure (headings, subheadings, lists, bold, italics, code blocks) to make information extremely readable and visually structured. Avoid walls of plain text or simple flat lists.',
  '- Always answer in the language the learner uses. English in, English out. Vietnamese in, Vietnamese out.',
].join('\n');

function buildSystemPrompt(context?: AiContext, basePreamble = PREAMBLE): string {
  const sections: string[] = [basePreamble];
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
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { message?: string };
}

async function callGeminiDirect(req: AiChatRequest): Promise<AiChatResponse> {
  const { settings, messages, context, systemPromptOverride, params } = req;
  if (!settings.apiKey) throw new Error('Missing API key. Open AI settings to add one.');

  const systemPrompt = systemPromptOverride
    ? buildSystemPrompt(context, systemPromptOverride)
    : buildSystemPrompt(context);
  const contents = messages.map((m) => {
    const parts: any[] = [];
    if (m.audio) parts.push({ inlineData: { mimeType: m.audio.mimeType, data: m.audio.base64 } });
    if (m.content) parts.push({ text: m.content });
    if (parts.length === 0) parts.push({ text: '' });
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });

  const generationConfig: Record<string, number> = {
    temperature: params?.temperature ?? 0.4,
    maxOutputTokens: params?.maxTokens ?? 800,
  };
  if (params?.topP !== undefined) generationConfig.topP = params.topP;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig,
    }),
  });

  const data: GeminiResponse = await response.json().catch(() => ({} as GeminiResponse));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini error: ${response.status}`);
  }

  const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!reply) throw new Error('Gemini returned an empty response.');
  const usage = data.usageMetadata
    ? {
        promptTokens: data.usageMetadata.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
      }
    : undefined;
  return { reply, usage };
}

// GET https://generativelanguage.googleapis.com/v1beta/models?key=...
// Returns the live Gemini catalog. We surface only models that support
// generateContent so the playground doesn't list embedding-only or vision-only IDs.
interface GeminiCatalogModel {
  name?: string;                       // "models/gemini-2.5-pro"
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

interface GeminiCatalogResponse {
  models?: GeminiCatalogModel[];
  error?: { message?: string };
}

export interface GeminiModel {
  id: string;                          // "gemini-2.5-pro" (name with "models/" stripped)
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export async function fetchGeminiModels(apiKey: string): Promise<GeminiModel[]> {
  if (!apiKey) throw new Error('Missing Gemini API key.');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  const data: GeminiCatalogResponse = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini models lookup failed: ${res.status}`);
  }
  const all = Array.isArray(data.models) ? data.models : [];
  return all
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => ({
      id: (m.name ?? '').replace(/^models\//, ''),
      displayName: m.displayName,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
    }))
    .filter((m) => m.id);
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

export type { OpenRouterModel };

interface OpenRouterModelsResponse {
  data?: OpenRouterModel[];
}

interface OpenRouterChatChoice {
  message?: { role?: string; content?: string };
  finish_reason?: string;
}
interface OpenRouterChatResponse {
  choices?: OpenRouterChatChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
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
  const { settings, messages, context, systemPromptOverride, params } = req;
  if (!settings.apiKey) throw new Error('Missing API key. Open AI settings to add one.');

  // Audio attachments are dropped — OpenRouter's chat API doesn't accept Gemini's
  // inlineData shape. A future revision could base64-encode and inline via a
  // model that supports it (e.g. gpt-4o-audio), but most OpenRouter models won't.
  const droppedAudio = messages.some((m) => m.audio);

  const systemPrompt = systemPromptOverride
    ? buildSystemPrompt(context, systemPromptOverride)
    : buildSystemPrompt(context);
  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content || (m.audio ? '(voice question — audio not supported on this provider)' : ''),
    })),
  ];

  const body: Record<string, unknown> = {
    model: settings.model,
    messages: chatMessages,
    temperature: params?.temperature ?? 0.4,
    max_tokens: params?.maxTokens ?? 800,
  };
  if (params?.topP !== undefined) body.top_p = params.topP;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      // OpenRouter recommends these for app attribution / rankings; both optional.
      'HTTP-Referer': 'https://soundknot.app',
      'X-Title': 'SoundKnot',
    },
    body: JSON.stringify(body),
  });

  const data: OpenRouterChatResponse = await response.json().catch(() => ({} as OpenRouterChatResponse));
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenRouter error: ${response.status}`);
  }
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('OpenRouter returned an empty response.');
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
      }
    : undefined;
  if (droppedAudio) {
    return {
      reply: `${reply}\n\n_(Note: voice input isn't supported on OpenRouter — type your question instead, or switch to Gemini.)_`,
      usage,
    };
  }
  return { reply, usage };
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
