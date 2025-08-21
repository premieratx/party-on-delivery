-- Create cover-assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-assets', 'cover-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for cover-assets bucket
CREATE POLICY "Anyone can view cover assets" ON storage.objects FOR SELECT USING (bucket_id = 'cover-assets');

CREATE POLICY "Admins can upload cover assets" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'cover-assets' AND is_admin_user_safe());

CREATE POLICY "Admins can update cover assets" ON storage.objects FOR UPDATE 
USING (bucket_id = 'cover-assets' AND is_admin_user_safe());

CREATE POLICY "Admins can delete cover assets" ON storage.objects FOR DELETE 
USING (bucket_id = 'cover-assets' AND is_admin_user_safe());