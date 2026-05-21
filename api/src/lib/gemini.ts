export type Role = "user" | "assistant";

export interface AudioAttachment {
  base64: string;
  mimeType: string;
}

export interface AppMessage {
  role: Role;
  content: string;
  audio?: AudioAttachment;
}

export interface GeminiRequest {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: AppMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export type GeminiResult =
  | { ok: true; reply: string; upstreamStatus: number }
  | { ok: false; status: 429 | 502; error: string; upstreamStatus: number };

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

function toGeminiContents(messages: AppMessage[]): GeminiContent[] {
  return messages
    .map<GeminiContent | null>((m) => {
      const parts: GeminiPart[] = [];
      if (m.audio && m.audio.base64) {
        parts.push({
          inlineData: { mimeType: m.audio.mimeType, data: m.audio.base64 },
        });
      }
      if (m.content && m.content.length > 0) {
        parts.push({ text: m.content });
      }
      if (parts.length === 0) return null;
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    })
    .filter((c): c is GeminiContent => c !== null);
}

export async function callGemini(req: GeminiRequest): Promise<GeminiResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    req.model
  )}:generateContent?key=${encodeURIComponent(req.apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: req.systemPrompt }] },
    contents: toGeminiContents(req.messages),
    generationConfig: {
      temperature: req.temperature ?? 0.4,
      maxOutputTokens: req.maxOutputTokens ?? 800,
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: "Failed to reach the AI provider. Please try again.",
      upstreamStatus: 0,
    };
  }

  let parsed: GeminiResponse | null = null;
  try {
    parsed = (await res.json()) as GeminiResponse;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    if (res.status === 429) {
      return {
        ok: false,
        status: 429,
        error:
          parsed?.error?.message ??
          "Too many requests. Please slow down and try again shortly.",
        upstreamStatus: res.status,
      };
    }
    return {
      ok: false,
      status: 502,
      error:
        parsed?.error?.message ??
        "The AI provider returned an unexpected error.",
      upstreamStatus: res.status,
    };
  }

  if (parsed?.promptFeedback?.blockReason) {
    return {
      ok: false,
      status: 502,
      error: `The AI provider blocked the response (${parsed.promptFeedback.blockReason}).`,
      upstreamStatus: res.status,
    };
  }

  const reply = (parsed?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!reply) {
    return {
      ok: false,
      status: 502,
      error: "The AI provider returned an empty response.",
      upstreamStatus: res.status,
    };
  }

  return { ok: true, reply, upstreamStatus: res.status };
}
