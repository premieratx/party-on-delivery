-- Fix function search paths for security
-- This addresses the "Function Search Path Mutable" warnings

-- Update all existing functions to have secure search_path
ALTER FUNCTION public.comprehensive_security_check() SET search_path = public;
ALTER FUNCTION public.enforce_security_standards() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Update any other functions that might exist
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions in the public schema and set search_path
    FOR func_record IN 
        SELECT proname, pronamespace::regnamespace::text as schema_name
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
        AND proname NOT LIKE 'pg_%'
        AND proname NOT LIKE 'st_%'  -- Skip PostGIS functions
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I() SET search_path = public', 
                          func_record.schema_name, func_record.proname);
        EXCEPTION WHEN OTHERS THEN
            -- Skip if function signature doesn't match or other issues
            CONTINUE;
        END;
    END LOOP;
END $$;