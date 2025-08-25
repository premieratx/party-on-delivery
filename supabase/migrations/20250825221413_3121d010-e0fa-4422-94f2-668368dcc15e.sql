-- Create a more permissive policy for admin interface usage
-- Since admin auth is handled via session, not Supabase Auth directly

-- Drop the existing policies that may be causing conflicts
DROP POLICY IF EXISTS "Admins can manage delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Public can read active delivery apps" ON public.delivery_app_variations;

-- Create a policy that allows admin operations when not using Supabase Auth
CREATE POLICY "Allow admin interface operations" 
ON public.delivery_app_variations 
FOR ALL 
USING (
  -- Allow service role (for Edge Functions)
  auth.role() = 'service_role' OR
  -- Allow existing admin functions
  is_admin_user_safe() OR
  is_current_user_admin() OR
  -- Allow when no auth context (admin interface usage)
  auth.uid() IS NULL
) 
WITH CHECK (
  -- Same logic for inserts/updates
  auth.role() = 'service_role' OR
  is_admin_user_safe() OR
  is_current_user_admin() OR
  auth.uid() IS NULL
);