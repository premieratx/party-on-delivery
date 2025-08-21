-- Fix the media storage bucket issue and ensure all policies exist
-- Create media-uploads bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('media-uploads', 'media-uploads', true)
  ON CONFLICT (id) DO NOTHING;
END$$;

-- Create storage policies for media uploads if they don't exist
DO $$
BEGIN
  -- Policy for public access to media files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Media files are publicly accessible'
  ) THEN
    CREATE POLICY "Media files are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media-uploads');
  END IF;

  -- Policy for authenticated upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload media files'
  ) THEN
    CREATE POLICY "Users can upload media files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media-uploads' AND auth.role() = 'authenticated');
  END IF;

  -- Policy for authenticated update/delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can manage media files'
  ) THEN  
    CREATE POLICY "Users can manage media files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'media-uploads' AND auth.role() = 'authenticated');
  END IF;
END$$;