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

-- Add RLS policies that allow admin verification
CREATE POLICY "Allow admin verification" ON public.admin_users
FOR SELECT 
USING (true);

-- Update cover_pages policies to be more permissive for now
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

-- Update delivery_app_variations policies to allow admin access
CREATE POLICY IF NOT EXISTS "Admin users can manage delivery apps" ON public.delivery_app_variations
FOR ALL 
USING (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
);

-- Update post_checkout_screens policies to allow admin access
CREATE POLICY IF NOT EXISTS "Admin users can manage post checkout screens" ON public.post_checkout_screens
FOR ALL 
USING (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.email() IN (SELECT email FROM public.admin_users) OR
  auth.role() = 'service_role'::text
);