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
