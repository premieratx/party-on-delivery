-- Fix storage policies for delivery app logo uploads
-- Create storage policies for delivery-app-logos bucket

-- First ensure the bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('delivery-app-logos', 'delivery-app-logos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies for this bucket
DROP POLICY IF EXISTS "Anyone can view delivery app logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload delivery app logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update delivery app logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete delivery app logos" ON storage.objects;

-- Create completely permissive storage policies for delivery-app-logos bucket
CREATE POLICY "Public can view delivery app logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-app-logos');

CREATE POLICY "Anyone can upload delivery app logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'delivery-app-logos');

CREATE POLICY "Anyone can update delivery app logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'delivery-app-logos')
WITH CHECK (bucket_id = 'delivery-app-logos');

CREATE POLICY "Anyone can delete delivery app logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'delivery-app-logos');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;