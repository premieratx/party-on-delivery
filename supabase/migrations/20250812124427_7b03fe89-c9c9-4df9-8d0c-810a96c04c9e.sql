-- Add columns to cover_pages for logo height and styles
ALTER TABLE public.cover_pages
  ADD COLUMN IF NOT EXISTS logo_height INTEGER,
  ADD COLUMN IF NOT EXISTS styles JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create a dedicated public bucket for cover assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-assets', 'cover-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for cover-assets (use DO blocks to avoid duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'cover assets are publicly accessible'
  ) THEN
    CREATE POLICY "cover assets are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'cover-assets');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'anyone can upload cover assets'
  ) THEN
    CREATE POLICY "anyone can upload cover assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'cover-assets');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'anyone can update cover assets'
  ) THEN
    CREATE POLICY "anyone can update cover assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'cover-assets')
    WITH CHECK (bucket_id = 'cover-assets');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'anyone can delete cover assets'
  ) THEN
    CREATE POLICY "anyone can delete cover assets"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'cover-assets');
  END IF;
END$$;