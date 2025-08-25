-- Fix storage bucket and policies for logo uploads
-- Create the app-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create the cover-assets bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cover-assets', 'cover-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies for these buckets
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "app-assets upload" ON storage.objects;
DROP POLICY IF EXISTS "app-assets select" ON storage.objects;
DROP POLICY IF EXISTS "cover-assets upload" ON storage.objects;
DROP POLICY IF EXISTS "cover-assets select" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to cover-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view cover-assets" ON storage.objects;

-- Create unrestricted storage policies for our buckets
CREATE POLICY "app_assets_unrestricted_access" 
ON storage.objects 
FOR ALL 
TO PUBLIC
USING (bucket_id = 'app-assets')
WITH CHECK (bucket_id = 'app-assets');

CREATE POLICY "cover_assets_unrestricted_access" 
ON storage.objects 
FOR ALL 
TO PUBLIC
USING (bucket_id = 'cover-assets')
WITH CHECK (bucket_id = 'cover-assets');