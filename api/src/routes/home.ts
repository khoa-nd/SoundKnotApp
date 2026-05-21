import { Hono } from "hono";
import { createSupabaseAdmin, Env } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { getLocalDayRange } from "../lib/time";

type Variables = {
  userId: string;
};

const home = new Hono<{ Bindings: Env; Variables: Variables }>();

home.use("/*", authMiddleware);

// GET /home — aggregated data for the home screen
// Optional ?tz=<IANA timezone> (e.g. Asia/Ho_Chi_Minh) — defines the local day
// used for the "today's sessions" window. Defaults to UTC.
home.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createSupabaseAdmin(c.env);

  const tz = c.req.query("tz");
  const { startUtcISO: todayStart, endUtcISO: todayEnd, localDate, timeZone } =
    getLocalDayRange(tz);

  console.log(
    "GET /home userId:",
    userId,
    "tz:",
    timeZone,
    "localDate:",
    localDate,
    "range:",
    todayStart,
    "→",
    todayEnd
  );

  // Run all queries in parallel with individual error handling
  let progressResult: any = { data: null, error: null };
  let todaySessionsResult: any = { data: [], error: null };
  let recentSessionsResult: any = { data: [], error: null };
  let videosResult: any = { data: [], error: null };

  try {
    progressResult = await supabase
      .from("user_progress")
      .select("*")
      .eq("id", userId)
      .single();
  } catch (err) {
    console.error("GET /home progress query error:", err);
  }

  // Try joined query first; if it fails (e.g. missing FK relationship), fall back to plain query
  try {
    todaySessionsResult = await supabase
      .from("practice_sessions")
      .select("*, user_videos(title, youtube_video_id, thumbnail_url)")
      .eq("user_id", userId)
      .gte("created_at", todayStart)
      .lt("created_at", todayEnd)
      .order("created_at", { ascending: false });

    if (todaySessionsResult.error) {
      console.warn(
        "GET /home todaySessions join failed, falling back:",
        todaySessionsResult.error.message
      );
      todaySessionsResult = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", todayStart)
        .lt("created_at", todayEnd)
        .order("created_at", { ascending: false });
    }
  } catch (err) {
    console.error("GET /home todaySessions query error:", err);
  }

  try {
    recentSessionsResult = await supabase
      .from("practice_sessions")
      .select("*, user_videos(title, youtube_video_id, thumbnail_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentSessionsResult.error) {
      console.warn(
        "GET /home recentSessions join failed, falling back:",
        recentSessionsResult.error.message
      );
      recentSessionsResult = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
    }
  } catch (err) {
    console.error("GET /home recentSessions query error:", err);
  }

  try {
    videosResult = await supabase
      .from("user_videos")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false })
      .limit(10);
  } catch (err) {
    console.error("GET /home videos query error:", err);
  }

  // If joins failed, manually attach video metadata from videosResult
  const videosMap = new Map<string, any>(
    (videosResult.data ?? []).map((v: any) => [v.id, v])
  );

  const attachVideoMeta = (sessions: any[]) => {
    return sessions.map((s: any) => {
      if (s.user_videos) return s; // join worked
      const video = videosMap.get(s.video_id);
      if (video) {
        return {
          ...s,
          user_videos: {
            title: video.title,
            youtube_video_id: video.youtube_video_id,
            thumbnail_url: video.thumbnail_url,
          },
        };
      }
      return s;
    });
  };

  const todaySessions = attachVideoMeta(todaySessionsResult.data ?? []);
  const recentKnots = attachVideoMeta(recentSessionsResult.data ?? []);

  console.log(
    "GET /home returning:",
    JSON.stringify({
      progress: progressResult.data,
      todaySessionsCount: todaySessions.length,
      recentKnotsCount: recentKnots.length,
      videosCount: (videosResult.data ?? []).length,
    })
  );

  return c.json({
    progress: progressResult.data,
    todaySessions,
    recentKnots,
    videos: videosResult.data ?? [],
  });
});

export default home;
