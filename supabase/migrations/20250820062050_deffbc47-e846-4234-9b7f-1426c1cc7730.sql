-- Fix all admin table policies to use the same working function
-- This ensures consistent admin access across all tables

-- Update delivery_app_variations to use the working admin function
DROP POLICY IF EXISTS "admin_manage_delivery_apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Admin access for delivery apps" ON public.delivery_app_variations;

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

-- Ensure post_checkout_pages policy exists and is correct
DROP POLICY IF EXISTS "Admin access for post checkout pages" ON public.post_checkout_pages;

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