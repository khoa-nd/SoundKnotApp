import { Hono } from "hono";
import { createSupabaseAdmin, Env } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { getLocalDate, getLocalYesterday } from "../lib/time";

type Variables = {
  userId: string;
};

const sessions = new Hono<{ Bindings: Env; Variables: Variables }>();

sessions.use("/*", authMiddleware);

// Validate UUID v4 format
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// POST /sessions — record a practice session + update user_progress
sessions.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    video_id: string;
    segment?: string;
    pass?: number;
    mastery?: number;
    accuracy?: number;
    listened_seconds?: number;
    tz?: string;
  }>();

  console.log("POST /sessions body:", JSON.stringify(body));
  console.log("POST /sessions userId:", userId);

  if (!body.video_id) {
    return c.json({ error: "video_id is required" }, 400);
  }

  if (!isValidUUID(body.video_id)) {
    console.error("POST /sessions invalid video_id format:", body.video_id);
    return c.json(
      { error: "video_id must be a valid UUID (user_videos.id)" },
      400
    );
  }

  const supabase = createSupabaseAdmin(c.env);

  // Verify video belongs to user
  const { data: video, error: videoError } = await supabase
    .from("user_videos")
    .select("id")
    .eq("id", body.video_id)
    .eq("user_id", userId)
    .single();

  if (videoError) {
    console.error("POST /sessions video lookup error:", videoError);
  }
  if (!video) {
    return c.json(
      { error: "Video not found or does not belong to user" },
      404
    );
  }

  // Insert the practice session
  const sessionInsert = {
    user_id: userId,
    video_id: body.video_id,
    segment: body.segment ?? null,
    pass: body.pass ?? 1,
    mastery: body.mastery ?? 0,
    accuracy: body.accuracy ?? 0,
    listened_seconds: body.listened_seconds ?? 0,
  };

  console.log("POST /sessions inserting:", JSON.stringify(sessionInsert));

  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .insert(sessionInsert)
    .select()
    .single();

  if (sessionError) {
    console.error("POST /sessions insert error:", sessionError);
    return c.json({ error: sessionError.message }, 500);
  }

  console.log("POST /sessions created:", JSON.stringify(session));

  // Update user_progress: streak + total minutes + total sessions
  // Use the client's local timezone (passed in body, or ?tz=) so that
  // "today" matches the user's calendar day. Defaults to UTC.
  const tz = body.tz ?? c.req.query("tz");
  const today = getLocalDate(tz); // YYYY-MM-DD in user's tz
  const yesterdayStr = getLocalYesterday(tz);
  const listenedMinutes = Math.round((body.listened_seconds ?? 0) / 60);

  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("id", userId)
    .single();

  if (progressError) {
    console.warn(
      "POST /sessions user_progress lookup error:",
      progressError
    );
  }

  if (progress) {
    const lastDate = progress.last_session_date;
    let newStreak = progress.current_streak;

    if (lastDate !== today) {
      // Check if yesterday — continue streak
      if (lastDate === yesterdayStr) {
        newStreak = progress.current_streak + 1;
      } else if (!lastDate) {
        newStreak = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
    // If lastDate === today, streak stays the same (already counted today)

    const longestStreak = Math.max(progress.longest_streak, newStreak);

    const { error: updateError } = await supabase
      .from("user_progress")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        total_minutes: progress.total_minutes + listenedMinutes,
        total_sessions: progress.total_sessions + 1,
        last_session_date: today,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("POST /sessions user_progress update error:", updateError);
      // Don't fail the request — the session was still created
    }
  } else {
    console.warn("POST /sessions no user_progress row found for user:", userId);
  }

  return c.json({ session });
});

export default sessions;
