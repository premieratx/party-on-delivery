-- Fix storage RLS policy for app-assets INSERT operations
-- The current INSERT policy has no qualifying conditions, which causes issues

-- Drop and recreate the INSERT policy with proper conditions
DROP POLICY IF EXISTS "Admin can upload to app-assets" ON storage.objects;

CREATE POLICY "Authenticated can upload to app-assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-assets' 
  AND auth.uid() IS NOT NULL
);