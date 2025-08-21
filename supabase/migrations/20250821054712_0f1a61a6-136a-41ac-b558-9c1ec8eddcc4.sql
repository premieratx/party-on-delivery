-- Create storage bucket for app assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-assets', 'app-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for app assets
CREATE POLICY "App assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');

CREATE POLICY "Admins can upload app assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'app-assets' AND is_admin_user_safe());

CREATE POLICY "Admins can update app assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'app-assets' AND is_admin_user_safe());

CREATE POLICY "Admins can delete app assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'app-assets' AND is_admin_user_safe());