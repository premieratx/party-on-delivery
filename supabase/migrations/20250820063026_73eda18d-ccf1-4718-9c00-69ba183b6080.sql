-- Fix post_checkout_pages RLS policies to use the working admin function
-- This ensures consistent admin access across all tables

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin access for post checkout pages" ON public.post_checkout_pages;
DROP POLICY IF EXISTS "Admin users can manage post checkout pages" ON public.post_checkout_pages;
DROP POLICY IF EXISTS "post_checkout_pages_admin_only" ON public.post_checkout_pages;

-- Create consistent policy using the working admin function
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