-- Complete fix for delivery_app_variations table access
-- First disable RLS temporarily, then recreate with proper policies

ALTER TABLE public.delivery_app_variations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start clean
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "delivery_apps_public_read_only" ON public.delivery_app_variations;
    DROP POLICY IF EXISTS "delivery_apps_admin_manage" ON public.delivery_app_variations;
    DROP POLICY IF EXISTS "delivery_apps_service_manage" ON public.delivery_app_variations;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create simple public read policy
CREATE POLICY "public_read_delivery_apps" 
ON public.delivery_app_variations 
FOR SELECT 
TO public
USING (is_active = true);

-- Create anon read policy  
CREATE POLICY "anon_read_delivery_apps" 
ON public.delivery_app_variations 
FOR SELECT 
TO anon
USING (is_active = true);

-- Create authenticated read policy
CREATE POLICY "authenticated_read_delivery_apps" 
ON public.delivery_app_variations 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Admin management policy
CREATE POLICY "admin_manage_delivery_apps" 
ON public.delivery_app_variations 
FOR ALL 
TO authenticated
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Service role management
CREATE POLICY "service_manage_delivery_apps" 
ON public.delivery_app_variations 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');