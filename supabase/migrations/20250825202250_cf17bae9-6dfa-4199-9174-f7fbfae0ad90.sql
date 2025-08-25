-- Fix RLS policies for delivery_app_variations table to allow admin access
DROP POLICY IF EXISTS "Admin users can manage delivery apps" ON delivery_app_variations;
DROP POLICY IF EXISTS "Service role can manage delivery apps" ON delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active delivery apps" ON delivery_app_variations;

-- Create comprehensive RLS policies for delivery_app_variations
CREATE POLICY "Admin and service role can manage all delivery apps" 
ON delivery_app_variations 
FOR ALL 
USING (is_admin_user_safe() OR auth.role() = 'service_role'::text)
WITH CHECK (is_admin_user_safe() OR auth.role() = 'service_role'::text);

CREATE POLICY "Public can view active delivery apps" 
ON delivery_app_variations 
FOR SELECT 
USING (is_active = true);

-- Ensure delivery-app-assets storage bucket exists with proper policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('delivery-app-assets', 'delivery-app-assets', true) 
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for delivery app assets
DROP POLICY IF EXISTS "Admin can upload delivery app assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view delivery app assets" ON storage.objects;

CREATE POLICY "Admin can upload delivery app assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'delivery-app-assets' AND is_admin_user_safe());

CREATE POLICY "Admin can update delivery app assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'delivery-app-assets' AND is_admin_user_safe());

CREATE POLICY "Public can view delivery app assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'delivery-app-assets');