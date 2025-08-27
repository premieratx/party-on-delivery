-- Ensure pgcrypto extension is available and recreate the function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the verify_admin_password function with explicit extension access
DROP FUNCTION IF EXISTS verify_admin_password(text, text);

CREATE OR REPLACE FUNCTION verify_admin_password(input_email text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $$
DECLARE
  stored_hash text;
  admin_id text;
BEGIN
  -- Log the authentication attempt
  SELECT id, password_hash INTO admin_id, stored_hash 
  FROM admin_users 
  WHERE email = input_email;
  
  -- Log security event
  PERFORM log_security_event(
    'admin_login_attempt',
    input_email,
    jsonb_build_object('success', stored_hash IS NOT NULL)
  );
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password using crypt from pgcrypto extension
  IF stored_hash = public.crypt(input_password, stored_hash) THEN
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
$$;

-- Re-hash the password using the correct function
UPDATE admin_users 
SET password_hash = public.crypt('admin123', public.gen_salt('bf'))
WHERE email = 'brian@partyondelivery.com';

-- Test the function
SELECT email, verify_admin_password('brian@partyondelivery.com', 'admin123') as password_works
FROM admin_users 
WHERE email = 'brian@partyondelivery.com';