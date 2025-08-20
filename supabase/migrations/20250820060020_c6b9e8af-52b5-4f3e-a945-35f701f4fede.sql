-- Create a proper security definer function to check admin status
-- This bypasses RLS on admin_users table
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  );
$$;

-- Now fix all the policies to use this function instead of the problematic subquery

-- Fix cover_pages
DROP POLICY IF EXISTS "Direct admin access for cover pages" ON public.cover_pages;
CREATE POLICY "Admin access for cover pages" 
ON public.cover_pages 
FOR ALL 
TO public 
USING (
  is_current_user_admin() OR (auth.role() = 'service_role'::text)
)
WITH CHECK (
  is_current_user_admin() OR (auth.role() = 'service_role'::text)
);

-- Fix delivery_app_variations  
DROP POLICY IF EXISTS "Direct admin access for delivery apps" ON public.delivery_app_variations;
CREATE POLICY "Admin access for delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
TO public 
USING (
  is_current_user_admin() OR (auth.role() = 'service_role'::text)
)
WITH CHECK (
  is_current_user_admin() OR (auth.role() = 'service_role'::text)
);

-- Fix post_checkout_pages
DROP POLICY IF EXISTS "Admin full access to post checkout pages" ON public.post_checkout_pages;
CREATE POLICY "Admin access for post checkout pages" 
ON public.post_checkout_pages 
FOR ALL 
TO public 
USING (
  is_current_user_admin() OR (auth.role() = 'service_role'::text)
)
WITH CHECK (
  is_current_user_admin() OR (auth.role() = 'service_role'::text)
);