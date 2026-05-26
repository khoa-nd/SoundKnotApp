import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./lib/supabase";
import auth from "./routes/auth";
import videos from "./routes/videos";
import sessions from "./routes/sessions";
import home from "./routes/home";
import ai from "./routes/ai";
import transcripts from "./routes/transcripts";

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS — allow Expo app and local dev
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "soundknot-api" }));

// Route registration
app.route("/auth", auth);
app.route("/videos", videos);
app.route("/sessions", sessions);
app.route("/home", home);
app.route("/ai", ai);
app.route("/transcripts", transcripts);

export default app;
