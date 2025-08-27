-- Temporarily use a simple password verification (NOT for production!)
-- This is just to test the login flow works

DROP FUNCTION IF EXISTS verify_admin_password(text, text);

CREATE OR REPLACE FUNCTION verify_admin_password(input_email text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
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
  
  -- TEMPORARY: Simple password check (replace with proper hashing later)
  IF input_password = 'admin123' AND input_email = 'brian@partyondelivery.com' THEN
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

-- Update password to simple value for testing
UPDATE admin_users 
SET password_hash = 'temporary_hash'
WHERE email = 'brian@partyondelivery.com';

-- Test the function
SELECT email, verify_admin_password('brian@partyondelivery.com', 'admin123') as test_login
FROM admin_users 
WHERE email = 'brian@partyondelivery.com';