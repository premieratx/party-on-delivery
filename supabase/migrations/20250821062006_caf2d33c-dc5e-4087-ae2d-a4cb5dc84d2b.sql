-- Create storage buckets for admin creators if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('app-assets', 'app-assets', true),
  ('cover-assets', 'cover-assets', true),
  ('post-checkout-assets', 'post-checkout-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for app-assets bucket
CREATE POLICY "App assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');

CREATE POLICY "Admins can upload app assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-assets' 
  AND is_admin_user_safe()
);

CREATE POLICY "Admins can update app assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'app-assets' 
  AND is_admin_user_safe()
);

CREATE POLICY "Admins can delete app assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'app-assets' 
  AND is_admin_user_safe()
);

-- Create storage policies for cover-assets bucket
CREATE POLICY "Cover assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cover-assets');

CREATE POLICY "Admins can upload cover assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cover-assets' 
  AND is_admin_user_safe()
);

CREATE POLICY "Admins can update cover assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cover-assets' 
  AND is_admin_user_safe()
);

CREATE POLICY "Admins can delete cover assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cover-assets' 
  AND is_admin_user_safe()
);

-- Create storage policies for post-checkout-assets bucket
CREATE POLICY "Post checkout assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-checkout-assets');

CREATE POLICY "Admins can upload post checkout assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'post-checkout-assets' 
  AND is_admin_user_safe()
);

CREATE POLICY "Admins can update post checkout assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'post-checkout-assets' 
  AND is_admin_user_safe()
);

CREATE POLICY "Admins can delete post checkout assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'post-checkout-assets' 
  AND is_admin_user_safe()
);