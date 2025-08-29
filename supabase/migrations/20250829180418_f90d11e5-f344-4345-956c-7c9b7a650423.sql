-- CRITICAL SECURITY FIX: Secure admin_users table
-- Remove the dangerous open access policy
DROP POLICY IF EXISTS "admin_users_open_access" ON public.admin_users;

-- Create secure admin-only access policy
CREATE POLICY "admin_users_admin_only_access" 
ON public.admin_users 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Allow service role access for admin verification functions
CREATE POLICY "admin_users_service_role_access" 
ON public.admin_users 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Secure the verify_admin_password function with proper search_path
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_email text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  stored_hash text;
  admin_id text;
BEGIN
  -- Get the stored password hash
  SELECT id, password_hash INTO admin_id, stored_hash 
  FROM admin_users 
  WHERE email = input_email;
  
  -- Log the authentication attempt
  PERFORM log_security_event(
    'admin_login_attempt',
    input_email,
    jsonb_build_object('success', stored_hash IS NOT NULL)  
  );
  
  IF stored_hash IS NULL THEN
    PERFORM log_security_event(
      'admin_login_failed',
      input_email,
      jsonb_build_object('reason', 'user_not_found')
    );
    RETURN false;
  END IF;
  
  -- Use proper password verification
  IF verify_password(input_password, stored_hash) THEN
    -- Log successful login
    PERFORM log_security_event(
      'admin_login_success',
      input_email,
      jsonb_build_object('admin_id', admin_id)
    );
    RETURN true;
  ELSE
    -- Log failed login  
    PERFORM log_security_event(
      'admin_login_failed',
      input_email,
      jsonb_build_object('reason', 'invalid_password')
    );
    RETURN false;
  END IF;
END;
$function$;