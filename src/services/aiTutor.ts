// ── Sound Knot V2 — AI Tutor service
// Two modes:
//   1. proxy  — POST {apiBaseUrl}/ai/chat  (key lives on server)
//   2. direct — Google Gemini generativelanguage.googleapis.com (key on device)
// Provider abstraction kept thin so OpenAI / Anthropic adapters can drop in later.

import { Config } from '../constants/Config';
import { apiClient } from './api';

export type AiProvider = 'gemini';
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
  // ~30s window of transcript around current playback time
  transcriptWindow?: string;
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

// Default Gemini models offered in the settings UI
export const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-3.1-pro',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
] as const;

// ── Prompt building ──────────────────────────────────────────────────────────

function buildSystemPrompt(context?: AiContext): string {
  const lines = [
    'You are an English listening tutor inside the Sound Knot app.',
    'The learner is practicing with a YouTube video and may ask you to explain words, phrases, idioms, slang, grammar, or pronunciation.',
    'Keep answers concise (2-4 short paragraphs at most), warm, and concrete. Use plain Markdown only when it helps comprehension.',
    'Always answer in the language the learner uses. If they write in English, answer in English; if they write in another language, mirror them.',
  ];
  if (context?.videoTitle) lines.push(`\nVideo: "${context.videoTitle}"${context.videoChannel ? ` — ${context.videoChannel}` : ''}.`);
  if (context?.transcriptWindow) lines.push(`\nNearby transcript:\n"""\n${context.transcriptWindow}\n"""`);
  if (context?.selection) lines.push(`\nThe learner has selected: "${context.selection}".`);
  return lines.join('\n');
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

// ── Backend proxy call ───────────────────────────────────────────────────────

async function callProxy(req: AiChatRequest): Promise<AiChatResponse> {
  // Backend is expected to expose POST /ai/chat that accepts our shape and
  // returns { reply: string }. The proxy holds the API key server-side.
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
  if (req.settings.mode === 'direct') return callGeminiDirect(req);
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
  return `Direct · ${s.provider} · ${s.model}`;
}
