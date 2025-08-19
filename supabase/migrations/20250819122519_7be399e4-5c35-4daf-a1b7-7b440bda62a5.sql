-- Fix delivery_app_variations table permissions
-- Drop conflicting policies and create a simple public read policy

DROP POLICY IF EXISTS "Allow admin write access to delivery_app_variations" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Allow public read access to delivery_app_variations" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_apps_delete_all" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_apps_insert_all" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_apps_public_read" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_apps_select_all" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_apps_update_all" ON public.delivery_app_variations;

-- Create clean policies
CREATE POLICY "delivery_apps_public_read_only" 
ON public.delivery_app_variations 
FOR SELECT 
USING (true);

CREATE POLICY "delivery_apps_admin_manage" 
ON public.delivery_app_variations 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "delivery_apps_service_manage" 
ON public.delivery_app_variations 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);