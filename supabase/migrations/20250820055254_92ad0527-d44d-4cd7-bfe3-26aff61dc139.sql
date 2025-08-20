-- Fix admin access to cover_pages table by adding direct admin check
-- This allows admins to access cover pages without needing context set first

-- Drop the problematic policy that requires context
DROP POLICY IF EXISTS "Enhanced admin access for cover pages" ON public.cover_pages;

-- Create a new policy that directly checks admin_users table
CREATE POLICY "Direct admin access for cover pages" 
ON public.cover_pages 
FOR ALL 
TO public 
USING (
  -- Allow if user is in admin_users table OR service role OR context is set
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
  OR is_admin_user_enhanced()
)
WITH CHECK (
  -- Same check for writes
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
  OR is_admin_user_enhanced()
);

-- Also fix the same issue for delivery_app_variations and post_checkout_pages
DROP POLICY IF EXISTS "Enhanced admin access for delivery apps" ON public.delivery_app_variations;
CREATE POLICY "Direct admin access for delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
TO public 
USING (
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
  OR is_admin_user_enhanced()
)
WITH CHECK (
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
  OR is_admin_user_enhanced()
);

DROP POLICY IF EXISTS "Enhanced admin access for post checkout pages" ON public.post_checkout_pages;
CREATE POLICY "Direct admin access for post checkout pages" 
ON public.post_checkout_pages 
FOR ALL 
TO public 
USING (
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
  OR is_admin_user_enhanced()
)
WITH CHECK (
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
  OR is_admin_user_enhanced()
);