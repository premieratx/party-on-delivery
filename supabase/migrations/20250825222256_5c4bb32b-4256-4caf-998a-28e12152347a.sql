-- Fix RLS policies to work with proper admin context
-- The issue is the cached session bypasses admin context setting

-- First, let's create proper policies that require admin context to be set
DROP POLICY IF EXISTS "Allow admin interface operations" ON public.delivery_app_variations;

-- Create policy that requires proper admin verification
CREATE POLICY "Admins can manage delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
USING (
  -- Service role for Edge Functions
  auth.role() = 'service_role' OR
  -- Properly verified admin with context set
  is_admin_user_enhanced()
) 
WITH CHECK (
  auth.role() = 'service_role' OR
  is_admin_user_enhanced()
);

-- Fix storage policies for app-assets bucket
-- Allow authenticated admins to upload logos
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