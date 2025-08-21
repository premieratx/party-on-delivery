-- Create storage bucket for delivery app assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('delivery-app-assets', 'delivery-app-assets', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for delivery app assets bucket
CREATE POLICY "Allow public read access to delivery app assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'delivery-app-assets');

CREATE POLICY "Allow authenticated users to upload delivery app assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'delivery-app-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update delivery app assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'delivery-app-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete delivery app assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'delivery-app-assets' AND auth.role() = 'authenticated');