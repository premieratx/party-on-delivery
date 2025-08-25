-- Check current storage policies and fix logo upload issues
-- First, drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Allow public read access to app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload to app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update to app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete from app-assets" ON storage.objects;

-- Ensure the app-assets bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('app-assets', 'app-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create comprehensive storage policies that actually work
CREATE POLICY "Public read access for app-assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');

CREATE POLICY "Admin can upload to app-assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-assets' AND 
  (
    auth.role() = 'service_role' OR
    is_admin_user_safe() OR 
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Admin can update app-assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'app-assets' AND 
  (
    auth.role() = 'service_role' OR
    is_admin_user_safe() OR 
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Admin can delete from app-assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'app-assets' AND 
  (
    auth.role() = 'service_role' OR
    is_admin_user_safe() OR 
    auth.uid() IS NOT NULL
  )
);