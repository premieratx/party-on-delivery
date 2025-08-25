-- First drop all existing policies for clean slate
DROP POLICY IF EXISTS "Admins can manage delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Allow admin interface operations" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Public can read active delivery apps" ON public.delivery_app_variations;

-- Drop existing storage policies for app-assets
DROP POLICY IF EXISTS "Admin users can upload app assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update app assets" ON storage.objects;  
DROP POLICY IF EXISTS "Public can view app assets" ON storage.objects;
DROP POLICY IF EXISTS "app-assets admin upload" ON storage.objects;
DROP POLICY IF EXISTS "app-assets public view" ON storage.objects;

-- Create new policies that require proper admin verification
CREATE POLICY "Admins can manage delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
USING (
  auth.role() = 'service_role' OR
  is_admin_user_enhanced()
) 
WITH CHECK (
  auth.role() = 'service_role' OR
  is_admin_user_enhanced()
);

-- Storage policies for app-assets bucket
CREATE POLICY "Admin users can upload app assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-assets' AND
  (auth.role() = 'service_role' OR is_admin_user_enhanced())
);

CREATE POLICY "Admin users can update app assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'app-assets' AND
  (auth.role() = 'service_role' OR is_admin_user_enhanced())
);

CREATE POLICY "Public can view app assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');