import { Hono } from "hono";
import { Env } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { buildSystemPrompt, ChatContext } from "../lib/aiSystemPrompt";
import { callGemini, AppMessage } from "../lib/gemini";
import { checkRateLimit } from "../lib/rateLimit";

type Variables = {
  userId: string;
};

const ai = new Hono<{ Bindings: Env; Variables: Variables }>();

ai.use("/*", authMiddleware);

const DEFAULT_RATE_LIMIT_PER_MINUTE = 20;
const DEFAULT_MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 2 MB

interface ChatRequestBody {
  provider?: unknown;
  model?: unknown;
  messages?: unknown;
  context?: unknown;
}

interface IncomingMessage {
  role?: unknown;
  content?: unknown;
  audio?: unknown;
}

interface IncomingAudio {
  base64?: unknown;
  mimeType?: unknown;
}

interface TranscriptLineInput {
  text?: unknown;
  start?: unknown;
  duration?: unknown;
}

interface SplitTranscriptBody {
  videoId?: unknown;
  transcript?: unknown;
}

interface SplitTranscriptSegment {
  text?: unknown;
  start?: unknown;
  duration?: unknown;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function approxBase64ByteLength(b64: string): number {
  // Each 4 base64 chars encode 3 bytes; padding chars subtract from the total.
  const len = b64.length;
  if (len === 0) return 0;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function parseSplitSegments(reply: string): Array<{ text: string; start: number; duration: number }> | null {
  const cleaned = reply
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const segments: Array<{ text: string; start: number; duration: number }> = [];
  for (const item of parsed as SplitTranscriptSegment[]) {
    if (!isObject(item)) return null;
    if (typeof item.text !== "string") return null;
    if (typeof item.start !== "number" || !Number.isFinite(item.start)) return null;
    if (typeof item.duration !== "number" || !Number.isFinite(item.duration)) return null;
    const text = normalizeWhitespace(item.text);
    if (!text) continue;
    segments.push({ text, start: Math.max(0, item.start), duration: Math.max(0.5, item.duration) });
  }

  return segments.length > 0 ? segments : null;
}

ai.post("/split-transcript", async (c) => {
  const userId = c.get("userId");
  const startedAt = Date.now();

  if (!c.env.GEMINI_API_KEY) {
    console.error("POST /ai/split-transcript misconfigured: GEMINI_API_KEY is not set");
    return c.json(
      { error: "AI service is not configured. Please contact support." },
      500
    );
  }

  const rateLimit = parseIntEnv(
    c.env.AI_RATE_LIMIT_PER_USER_PER_MINUTE,
    DEFAULT_RATE_LIMIT_PER_MINUTE
  );
  const rl = checkRateLimit(userId, rateLimit);
  if (!rl.allowed) {
    return c.json(
      { error: `You're sending requests too quickly. Please wait ${rl.retryAfterSeconds}s and try again.` },
      429,
      { "Retry-After": String(rl.retryAfterSeconds) }
    );
  }

  let body: SplitTranscriptBody;
  try {
    body = await c.req.json<SplitTranscriptBody>();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  if (typeof body.videoId !== "string" || body.videoId.trim().length === 0) {
    return c.json({ error: "videoId is required." }, 400);
  }
  if (!Array.isArray(body.transcript) || body.transcript.length === 0) {
    return c.json({ error: "transcript must be a non-empty array." }, 400);
  }

  const transcript: Array<{ text: string; start: number; duration: number }> = [];
  for (let i = 0; i < body.transcript.length; i++) {
    const raw = body.transcript[i] as TranscriptLineInput;
    if (!isObject(raw)) {
      return c.json({ error: `transcript[${i}] must be an object.` }, 400);
    }
    if (typeof raw.text !== "string" || raw.text.trim().length === 0) {
      return c.json({ error: `transcript[${i}].text must be a non-empty string.` }, 400);
    }
    if (typeof raw.start !== "number" || !Number.isFinite(raw.start)) {
      return c.json({ error: `transcript[${i}].start must be a finite number.` }, 400);
    }
    if (typeof raw.duration !== "number" || !Number.isFinite(raw.duration)) {
      return c.json({ error: `transcript[${i}].duration must be a finite number.` }, 400);
    }
    transcript.push({
      text: normalizeWhitespace(raw.text),
      start: raw.start,
      duration: raw.duration,
    });
  }

  const transcriptText = transcript
    .map((line) => `[${line.start.toFixed(2)}-${(line.start + line.duration).toFixed(2)}] ${line.text}`)
    .join("\n");

  const result = await callGemini({
    apiKey: c.env.GEMINI_API_KEY,
    model: "gemini-1.5-flash",
    temperature: 0.1,
    maxOutputTokens: 8192,
    systemPrompt:
      "You split English YouTube transcripts into practice-ready segments for language learners. Return only valid JSON. No markdown, no comments.",
    messages: [
      {
        role: "user",
        content:
          `Split this transcript into appropriate-length spoken English practice segments. ` +
          `Each segment must contain only a full number of English sentences: exactly 1, 2, or 3 complete sentences. Never return 1.5 or 2.5 sentences, and never cut a sentence across segments. ` +
          `Target 30-40 words per segment. If a single sentence has 30-40 words or more, keep it as one segment. If sentences are shorter, combine 2 or 3 consecutive full sentences only when the combined segment stays within about 30-40 words. ` +
          `Preserve transcript order. Preserve approximate timing by using the first source timestamp in the segment as start and the last source timestamp end minus start as duration. ` +
          `Return a JSON array of objects with exactly these keys: text, start, duration.\n\n${transcriptText}`,
      },
    ],
  });

  const latencyMs = Date.now() - startedAt;

  if (!result.ok) {
    console.log(
      JSON.stringify({
        event: "ai_split_transcript",
        user_id: userId,
        video_id: body.videoId,
        fragments: transcript.length,
        latency_ms: latencyMs,
        upstream_status: result.upstreamStatus,
        outcome: "error",
        status: result.status,
      })
    );
    return c.json({ error: result.error }, result.status);
  }

  const segments = parseSplitSegments(result.reply);
  if (!segments) {
    return c.json({ error: "AI returned an invalid transcript split. Please try again." }, 502);
  }

  console.log(
    JSON.stringify({
      event: "ai_split_transcript",
      user_id: userId,
      video_id: body.videoId,
      fragments: transcript.length,
      segments: segments.length,
      latency_ms: latencyMs,
      upstream_status: result.upstreamStatus,
      outcome: "ok",
    })
  );

  return c.json({ lines: segments });
});

ai.post("/chat", async (c) => {
  const userId = c.get("userId");
  const startedAt = Date.now();

  if (!c.env.GEMINI_API_KEY) {
    console.error("POST /ai/chat misconfigured: GEMINI_API_KEY is not set");
    return c.json(
      { error: "AI service is not configured. Please contact support." },
      500
    );
  }

  const rateLimit = parseIntEnv(
    c.env.AI_RATE_LIMIT_PER_USER_PER_MINUTE,
    DEFAULT_RATE_LIMIT_PER_MINUTE
  );
  const maxAudioBytes = parseIntEnv(
    c.env.AI_MAX_AUDIO_BYTES,
    DEFAULT_MAX_AUDIO_BYTES
  );

  const rl = checkRateLimit(userId, rateLimit);
  if (!rl.allowed) {
    return c.json(
      {
        error: `You're sending messages too quickly. Please wait ${rl.retryAfterSeconds}s and try again.`,
      },
      429,
      { "Retry-After": String(rl.retryAfterSeconds) }
    );
  }

  let body: ChatRequestBody;
  try {
    body = await c.req.json<ChatRequestBody>();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  // provider — strict allowlist (currently gemini only)
  if (body.provider !== "gemini") {
    return c.json(
      { error: "Unsupported provider. Only 'gemini' is currently available." },
      400
    );
  }

  if (typeof body.model !== "string" || body.model.trim().length === 0) {
    return c.json({ error: "model is required." }, 400);
  }
  const model = body.model.trim();

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: "messages must be a non-empty array." }, 400);
  }

  const messages: AppMessage[] = [];
  let audioCount = 0;

  for (let i = 0; i < body.messages.length; i++) {
    const raw = body.messages[i] as IncomingMessage;
    if (!isObject(raw)) {
      return c.json({ error: `messages[${i}] must be an object.` }, 400);
    }
    if (raw.role !== "user" && raw.role !== "assistant") {
      return c.json(
        { error: `messages[${i}].role must be "user" or "assistant".` },
        400
      );
    }
    if (typeof raw.content !== "string") {
      return c.json(
        { error: `messages[${i}].content must be a string.` },
        400
      );
    }

    const message: AppMessage = { role: raw.role, content: raw.content };

    if (raw.audio !== undefined && raw.audio !== null) {
      if (!isObject(raw.audio)) {
        return c.json(
          { error: `messages[${i}].audio must be an object.` },
          400
        );
      }
      const audio = raw.audio as IncomingAudio;
      if (typeof audio.base64 !== "string" || audio.base64.length === 0) {
        return c.json(
          { error: `messages[${i}].audio.base64 must be a non-empty string.` },
          400
        );
      }
      if (typeof audio.mimeType !== "string" || audio.mimeType.length === 0) {
        return c.json(
          { error: `messages[${i}].audio.mimeType must be a non-empty string.` },
          400
        );
      }
      if (approxBase64ByteLength(audio.base64) > maxAudioBytes) {
        return c.json(
          {
            error: `Audio attachment is too large. Max ${Math.floor(
              maxAudioBytes / 1024
            )} KB.`,
          },
          413
        );
      }

      message.audio = { base64: audio.base64, mimeType: audio.mimeType };
      audioCount++;
    }

    if (message.content.length === 0 && !message.audio) {
      return c.json(
        { error: `messages[${i}] must have content or audio.` },
        400
      );
    }

    messages.push(message);
  }

  // context — all fields optional, tolerate null/empty
  let context: ChatContext = {};
  if (body.context !== undefined && body.context !== null) {
    if (!isObject(body.context)) {
      return c.json({ error: "context must be an object." }, 400);
    }
    const raw = body.context as Record<string, unknown>;
    const pickString = (key: string): string | undefined => {
      const v = raw[key];
      return typeof v === "string" ? v : undefined;
    };
    context = {
      videoTitle: pickString("videoTitle"),
      videoChannel: pickString("videoChannel"),
      videoId: pickString("videoId"),
      transcriptWindow: pickString("transcriptWindow"),
      fullTranscript: pickString("fullTranscript"),
      selection: pickString("selection"),
    };
  }

  const systemPrompt = buildSystemPrompt(context);

  const result = await callGemini({
    apiKey: c.env.GEMINI_API_KEY,
    model,
    systemPrompt,
    messages,
  });

  const latencyMs = Date.now() - startedAt;

  if (!result.ok) {
    console.log(
      JSON.stringify({
        event: "ai_chat",
        user_id: userId,
        provider: "gemini",
        model,
        messages_length: messages.length,
        audio_count: audioCount,
        latency_ms: latencyMs,
        upstream_status: result.upstreamStatus,
        outcome: "error",
        status: result.status,
      })
    );
    return c.json({ error: result.error }, result.status);
  }

  console.log(
    JSON.stringify({
      event: "ai_chat",
      user_id: userId,
      provider: "gemini",
      model,
      messages_length: messages.length,
      audio_count: audioCount,
      latency_ms: latencyMs,
      upstream_status: result.upstreamStatus,
      outcome: "ok",
    })
  );

  return c.json({ reply: result.reply });
});

export default ai;
