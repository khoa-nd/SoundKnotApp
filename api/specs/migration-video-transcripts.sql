-- SoundKnot: shared transcript cache
-- Run in Supabase SQL Editor after migration.sql.

CREATE TABLE public.video_transcripts (
  youtube_video_id TEXT PRIMARY KEY,
  lines JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;

-- Only the CF Worker (service role) reads/writes; clients go through the API.
CREATE POLICY "Service role full access on video_transcripts"
  ON public.video_transcripts FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER video_transcripts_updated_at
  BEFORE UPDATE ON public.video_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
