-- Create a simple admin session function to bypass edge function issues temporarily
CREATE OR REPLACE FUNCTION public.verify_admin_access(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Check if the email exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
END;
$function$;

-- Drop existing policy and recreate for cover_pages
DROP POLICY IF EXISTS "Admin users can manage cover pages" ON public.cover_pages;
CREATE POLICY "Admin users can manage cover pages" ON public.cover_pages
FOR ALL 
USING (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
);

-- Drop and recreate for delivery_app_variations  
DROP POLICY IF EXISTS "Admin users can manage delivery apps" ON public.delivery_app_variations;
CREATE POLICY "Admin users can manage delivery apps" ON public.delivery_app_variations
FOR ALL 
USING (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
);

-- Drop and recreate for post_checkout_screens
DROP POLICY IF EXISTS "Admin users can manage post checkout screens" ON public.post_checkout_screens;
CREATE POLICY "Admin users can manage post checkout screens" ON public.post_checkout_screens
FOR ALL 
USING (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
);