-- Simple fix for delivery_app_variations access
-- Just grant basic read access for everyone

GRANT SELECT ON public.delivery_app_variations TO anon;
GRANT SELECT ON public.delivery_app_variations TO authenticated;

-- Ensure there's at least one basic policy
CREATE POLICY IF NOT EXISTS "basic_read_active_apps" 
ON public.delivery_app_variations 
FOR SELECT 
USING (true);