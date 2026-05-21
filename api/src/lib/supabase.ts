import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  GEMINI_API_KEY: string;
  AI_RATE_LIMIT_PER_USER_PER_MINUTE?: string;
  AI_MAX_AUDIO_BYTES?: string;
};

export function createSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
