-- Fix the password verification functions to use proper schema
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf', 12));
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN (hash = extensions.crypt(password, hash));
END;
$function$;

-- Update the admin password again with the fixed function
UPDATE admin_users 
SET password_hash = public.hash_password('admin123')
WHERE email = 'brian@partyondelivery.com';