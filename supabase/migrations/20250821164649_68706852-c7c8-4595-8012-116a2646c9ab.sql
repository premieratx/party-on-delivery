-- Enable leaked password protection for better security
-- This addresses the security warning about password protection

-- Enable built-in password strength and leaked password protection
-- Note: This requires enabling it in the Supabase dashboard under Authentication > Settings
-- For now, we'll document the requirement and enable what we can via SQL

-- Create a trigger to ensure safe_timestamp_to_bigint has proper search path
CREATE OR REPLACE FUNCTION public.safe_timestamp_to_bigint(ts timestamp with time zone)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXTRACT(EPOCH FROM ts) * 1000;
END;
$function$;

-- Note: Leaked password protection must be enabled manually in Supabase dashboard
-- Go to Authentication > Settings > Password protection
-- This is a dashboard setting and cannot be enabled via SQL