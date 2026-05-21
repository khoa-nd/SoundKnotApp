import { Hono } from "hono";
import { createSupabaseAdmin, Env } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

type Variables = {
  userId: string;
};

const videos = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require auth
videos.use("/*", authMiddleware);

interface YouTubeOEmbed {
  title: string;
  author_name: string;
  author_url: string;
  type: string;
  height: number;
  width: number;
  version: string;
  provider_name: string;
  provider_url: string;
  thumbnail_height: number;
  thumbnail_width: number;
  thumbnail_url: string;
  html: string;
}

async function fetchYouTubeMetadata(
  youtubeVideoId: string
): Promise<{ title: string; channel: string; thumbnail_url: string } | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`;
    const res = await fetch(oEmbedUrl, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn(`YouTube oEmbed failed for ${youtubeVideoId}: ${res.status}`);
      return null;
    }
    const data = (await res.json()) as YouTubeOEmbed;
    return {
      title: data.title,
      channel: data.author_name,
      thumbnail_url: `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`,
    };
  } catch (err) {
    console.warn(`YouTube metadata fetch failed for ${youtubeVideoId}:`, err);
    return null;
  }
}

// GET /videos — user's videos ordered by added_at DESC
videos.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("user_videos")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ videos: data });
});

// POST /videos — upsert a video (youtube_video_id is natural key)
// If title/channel/thumbnail are not provided, fetches them from YouTube
videos.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    youtube_video_id: string;
    title?: string;
    channel?: string;
    thumbnail_url?: string;
  }>();

  if (!body.youtube_video_id) {
    return c.json({ error: "youtube_video_id is required" }, 400);
  }

  const supabase = createSupabaseAdmin(c.env);

  // If metadata is missing, try to fetch from YouTube
  let title = body.title ?? null;
  let channel = body.channel ?? null;
  let thumbnailUrl = body.thumbnail_url ?? null;

  if (!title || !channel || !thumbnailUrl) {
    const meta = await fetchYouTubeMetadata(body.youtube_video_id);
    if (meta) {
      title = title ?? meta.title;
      channel = channel ?? meta.channel;
      thumbnailUrl = thumbnailUrl ?? meta.thumbnail_url;
    }
  }

  const { data, error } = await supabase
    .from("user_videos")
    .upsert(
      {
        user_id: userId,
        youtube_video_id: body.youtube_video_id,
        title,
        channel,
        thumbnail_url: thumbnailUrl,
      },
      { onConflict: "user_id,youtube_video_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("POST /videos upsert error:", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ video: data });
});

// GET /videos/:id/sessions — sessions for a specific video
videos.get("/:id/sessions", async (c) => {
  const userId = c.get("userId");
  const videoId = c.req.param("id");
  const supabase = createSupabaseAdmin(c.env);

  // Verify video belongs to user
  const { data: video, error: videoError } = await supabase
    .from("user_videos")
    .select("id")
    .eq("id", videoId)
    .eq("user_id", userId)
    .single();

  if (videoError || !video) {
    return c.json({ error: "Video not found" }, 404);
  }

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("video_id", videoId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ sessions: data });
});

export default videos;
