import { Hono } from "hono";
import { createSupabaseAdmin, Env } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

type Variables = {
  userId: string;
};

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /auth/register
auth.post("/register", async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    display_name?: string;
  }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const supabase = createSupabaseAdmin(c.env);

  // Create user via admin API
  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        display_name: body.display_name,
      },
    });

  if (createError) {
    return c.json({ error: createError.message }, 400);
  }

  // Auto sign-in to get JWT
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

  if (signInError) {
    return c.json({ error: signInError.message }, 500);
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", createData.user.id)
    .single();

  return c.json({
    session: {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
    },
    user: {
      id: createData.user.id,
      email: createData.user.email,
      profile,
    },
  });
});

// POST /auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return c.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    user: {
      id: data.user.id,
      email: data.user.email,
      profile,
    },
  });
});

// POST /auth/logout
auth.post("/logout", authMiddleware, async (c) => {
  // Client-side token invalidation is sufficient for most cases.
  // Optionally, you could call supabase.auth.admin.signOut(userId)
  return c.json({ message: "Logged out" });
});

// GET /auth/me
auth.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const supabase = createSupabaseAdmin(c.env);

  const [profileResult, progressResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("user_progress").select("*").eq("id", userId).single(),
  ]);

  if (profileResult.error) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json({
    profile: profileResult.data,
    progress: progressResult.data,
  });
});

export default auth;
