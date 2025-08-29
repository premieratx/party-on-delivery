-- Fix remaining function security issues by setting search_path on critical functions
CREATE OR REPLACE FUNCTION public.set_admin_context(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Store admin email in a way that RLS policies can access
  PERFORM set_config('app.admin_email', admin_email, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  user_email text;
  admin_email text;
BEGIN
  -- Get current user email
  user_email := auth.email();
  
  -- If no email, return false
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Try to get from app context first (set by edge functions)
  admin_email := current_setting('app.admin_email', true);
  
  -- If admin context is set and matches current user, return true
  IF admin_email IS NOT NULL AND admin_email = user_email THEN
    RETURN true;
  END IF;
  
  -- Otherwise check admin_users table directly
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf', 12));
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
BEGIN
  RETURN (hash = extensions.crypt(password, hash));
END;
$function$;