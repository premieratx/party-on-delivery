-- Fix storage RLS policies for app-assets bucket to allow authenticated admin uploads

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can upload to app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from app-assets" ON storage.objects;

-- Create more permissive policies for app-assets bucket
CREATE POLICY "Authenticated users can upload to app-assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update app-assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'app-assets' 
  AND auth.role() = 'authenticated'
) 
WITH CHECK (
  bucket_id = 'app-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete app-assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'app-assets' 
  AND auth.role() = 'authenticated'
);

-- Keep public read access
CREATE POLICY "Public read access for app-assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');