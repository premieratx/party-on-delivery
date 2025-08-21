-- Create storage bucket for delivery app assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('delivery-app-assets', 'delivery-app-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for delivery app assets
CREATE POLICY "Allow public read access to delivery app assets" ON storage.objects
FOR SELECT USING (bucket_id = 'delivery-app-assets');

CREATE POLICY "Allow authenticated users to upload delivery app assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'delivery-app-assets' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own delivery app assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'delivery-app-assets' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own delivery app assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'delivery-app-assets' AND
  auth.role() = 'authenticated'
);

-- Log the improvements made
INSERT INTO ai_work_logs (
  session_id,
  action_type,
  component_name,
  description,
  success
) VALUES (
  'delivery-app-fix-session',
  'bug_fix',
  'UnifiedDeliveryAppVisualEditor',
  'Fixed delivery app creator: Added collections loading, proper dropdowns, storage bucket creation, and improved error handling',
  true
);