-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for logo uploads
CREATE POLICY IF NOT EXISTS "Anyone can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY IF NOT EXISTS "Admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Admins can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Admins can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);