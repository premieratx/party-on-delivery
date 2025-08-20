-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.set_admin_context(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  -- Store admin email in a way that RLS policies can access
  PERFORM set_config('app.admin_email', admin_email, false);
END;
$$;

-- Fix the enhanced admin check function
CREATE OR REPLACE FUNCTION public.is_admin_user_enhanced()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  admin_email text;
BEGIN
  -- First try to get from app context (set by edge function)
  admin_email := current_setting('app.admin_email', true);
  
  IF admin_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = admin_email
    );
  END IF;
  
  -- Fallback to auth.email() for direct auth
  IF auth.email() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    );
  END IF;
  
  RETURN false;
END;
$$;