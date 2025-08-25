-- Remove admin-only restrictions on delivery app tables temporarily

-- Make delivery_app_variations accessible to everyone temporarily
DROP POLICY IF EXISTS "delivery_app_variations_admin_only" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_app_variations_admin_access" ON public.delivery_app_variations;

-- Create permissive policy for delivery app variations
CREATE POLICY "delivery_app_variations_unrestricted" 
ON public.delivery_app_variations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also make media library accessible
DROP POLICY IF EXISTS "media_library_admin_only" ON public.media_library;

CREATE POLICY "media_library_unrestricted" 
ON public.media_library 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Make system guidelines accessible
DROP POLICY IF EXISTS "system_guidelines_admin_only" ON public.system_guidelines;

CREATE POLICY "system_guidelines_unrestricted" 
ON public.system_guidelines 
FOR ALL 
USING (true) 
WITH CHECK (true);