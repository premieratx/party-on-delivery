-- Check and fix storage policies for app-assets bucket
-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create comprehensive storage policies for app-assets bucket
CREATE POLICY "Allow public read access to app-assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');

CREATE POLICY "Allow admin upload to app-assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-assets' AND 
  (is_admin_user_safe() OR auth.role() = 'service_role')
);

CREATE POLICY "Allow admin update to app-assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'app-assets' AND 
  (is_admin_user_safe() OR auth.role() = 'service_role')
);

CREATE POLICY "Allow admin delete from app-assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'app-assets' AND 
  (is_admin_user_safe() OR auth.role() = 'service_role')
);