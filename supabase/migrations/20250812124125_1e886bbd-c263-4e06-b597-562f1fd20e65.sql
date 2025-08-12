-- Add columns to cover_pages for logo height and styles
ALTER TABLE public.cover_pages
  ADD COLUMN IF NOT EXISTS logo_height INTEGER,
  ADD COLUMN IF NOT EXISTS styles JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create a dedicated public bucket for cover assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-assets', 'cover-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for cover-assets
-- Public read
CREATE POLICY IF NOT EXISTS "cover assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-assets');

-- Allow uploads/updates from anon/auth users (frontend) to this bucket
CREATE POLICY IF NOT EXISTS "anyone can upload cover assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cover-assets');

CREATE POLICY IF NOT EXISTS "anyone can update cover assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cover-assets')
WITH CHECK (bucket_id = 'cover-assets');

-- Optional: allow deletes for future cleanup (can be restricted later)
CREATE POLICY IF NOT EXISTS "anyone can delete cover assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'cover-assets');