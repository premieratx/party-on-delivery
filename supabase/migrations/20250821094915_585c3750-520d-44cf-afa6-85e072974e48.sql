-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-uploads', 'media-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for media uploads
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media-uploads');

CREATE POLICY "Authenticated users can upload media" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'media-uploads' AND 
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

CREATE POLICY "Users can update their uploads" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'media-uploads' AND 
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

CREATE POLICY "Users can delete their uploads" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'media-uploads' AND 
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Add media columns to existing tables if they don't exist
DO $$ 
BEGIN
  -- Add video support to cover_pages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_pages' AND column_name = 'logo_width') THEN
    ALTER TABLE cover_pages ADD COLUMN logo_width INTEGER DEFAULT 120;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_pages' AND column_name = 'logo_height_override') THEN
    ALTER TABLE cover_pages ADD COLUMN logo_height_override INTEGER;
  END IF;

  -- Add media support to delivery_app_variations  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_app_variations' AND column_name = 'logo_url') THEN
    ALTER TABLE delivery_app_variations ADD COLUMN logo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_app_variations' AND column_name = 'bg_image_url') THEN
    ALTER TABLE delivery_app_variations ADD COLUMN bg_image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_app_variations' AND column_name = 'bg_video_url') THEN
    ALTER TABLE delivery_app_variations ADD COLUMN bg_video_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_app_variations' AND column_name = 'logo_width') THEN
    ALTER TABLE delivery_app_variations ADD COLUMN logo_width INTEGER DEFAULT 120;
  END IF;

  -- Add media support to post_checkout_pages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_checkout_pages' AND column_name = 'logo_url') THEN
    ALTER TABLE post_checkout_pages ADD COLUMN logo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_checkout_pages' AND column_name = 'bg_image_url') THEN
    ALTER TABLE post_checkout_pages ADD COLUMN bg_image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_checkout_pages' AND column_name = 'bg_video_url') THEN
    ALTER TABLE post_checkout_pages ADD COLUMN bg_video_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_checkout_pages' AND column_name = 'logo_width') THEN
    ALTER TABLE post_checkout_pages ADD COLUMN logo_width INTEGER DEFAULT 120;
  END IF;
END $$;