import { Hono } from "hono";
import { createSupabaseAdmin, Env } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

type Variables = {
  userId: string;
};

const transcripts = new Hono<{ Bindings: Env; Variables: Variables }>();

transcripts.use("/*", authMiddleware);

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const MAX_LINES = 5000;

interface TranscriptLineInput {
  text?: unknown;
  start?: unknown;
  duration?: unknown;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

transcripts.get("/:videoId", async (c) => {
  const videoId = c.req.param("videoId");
  if (!VIDEO_ID_RE.test(videoId)) {
    return c.json({ error: "Invalid YouTube video ID." }, 400);
  }

  const supabase = createSupabaseAdmin(c.env);
  const { data, error } = await supabase
    .from("video_transcripts")
    .select("lines")
    .eq("youtube_video_id", videoId)
    .maybeSingle();

  if (error) {
    console.error(`GET /transcripts/${videoId} db error:`, error);
    return c.json({ error: error.message }, 500);
  }
  if (!data) {
    return c.json({ error: "Transcript not cached." }, 404);
  }
  return c.json({ videoId, lines: data.lines });
});

transcripts.post("/:videoId", async (c) => {
  const videoId = c.req.param("videoId");
  if (!VIDEO_ID_RE.test(videoId)) {
    return c.json({ error: "Invalid YouTube video ID." }, 400);
  }

  let body: { lines?: unknown };
  try {
    body = await c.req.json<{ lines?: unknown }>();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return c.json({ error: "lines must be a non-empty array." }, 400);
  }
  if (body.lines.length > MAX_LINES) {
    return c.json({ error: `lines exceeds max of ${MAX_LINES}.` }, 400);
  }

  const lines: Array<{ text: string; start: number; duration: number }> = [];
  for (let i = 0; i < body.lines.length; i++) {
    const raw = body.lines[i] as TranscriptLineInput;
    if (!isObject(raw)) {
      return c.json({ error: `lines[${i}] must be an object.` }, 400);
    }
    if (typeof raw.text !== "string" || raw.text.trim().length === 0) {
      return c.json({ error: `lines[${i}].text must be a non-empty string.` }, 400);
    }
    if (typeof raw.start !== "number" || !Number.isFinite(raw.start)) {
      return c.json({ error: `lines[${i}].start must be a finite number.` }, 400);
    }
    if (typeof raw.duration !== "number" || !Number.isFinite(raw.duration)) {
      return c.json({ error: `lines[${i}].duration must be a finite number.` }, 400);
    }
    lines.push({
      text: raw.text.trim(),
      start: Math.max(0, raw.start),
      duration: Math.max(0, raw.duration),
    });
  }

  const supabase = createSupabaseAdmin(c.env);
  const { error } = await supabase
    .from("video_transcripts")
    .upsert(
      { youtube_video_id: videoId, lines, updated_at: new Date().toISOString() },
      { onConflict: "youtube_video_id" }
    );

  if (error) {
    console.error(`POST /transcripts/${videoId} db error:`, error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ ok: true, videoId, count: lines.length });
});

export default transcripts;
