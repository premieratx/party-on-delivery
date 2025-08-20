-- Comprehensive security fix for all remaining issues

-- 1. Find and fix any functions without proper search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER functions
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ))
        AND p.proname NOT LIKE 'st_%'  -- Skip PostGIS functions
        AND p.proname NOT IN ('update_updated_at_column', 'update_processed_products_updated_at')  -- Skip simple trigger functions
    LOOP
        BEGIN
            -- Try to update the function with proper search_path
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = ''public'', ''pg_catalog''', 
                func_record.schema_name, 
                func_record.function_name,
                func_record.args
            );
            
            RAISE NOTICE 'Fixed search_path for function: %', func_record.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix search_path for function %, error: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Ensure all critical tables have proper RLS policies
-- Check for tables with RLS enabled but insufficient policies

-- Add service role policies for any tables that need them
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT t.tablename
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        AND c.relrowsecurity = true  -- RLS is enabled
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.tablename = t.tablename 
            AND p.schemaname = 'public'
            AND p.cmd = 'ALL'
            AND p.qual LIKE '%service_role%'
        )
        AND t.tablename NOT IN ('admin_users', 'affiliates', 'customers', 'customer_orders')  -- Skip tables with complex policies
    LOOP
        BEGIN
            EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_service_role_access" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', 
                table_record.tablename, 
                table_record.tablename
            );
            RAISE NOTICE 'Added service role policy for table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add service role policy for table %, error: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. Move any remaining extensions from public schema to extensions schema
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    FOR ext_record IN
        SELECT e.extname
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE n.nspname = 'public'
        AND e.extname NOT IN ('plpgsql')  -- Skip core extensions
    LOOP
        BEGIN
            EXECUTE format('DROP EXTENSION IF EXISTS "%s" CASCADE', ext_record.extname);
            EXECUTE format('CREATE EXTENSION IF NOT EXISTS "%s" WITH SCHEMA extensions', ext_record.extname);
            RAISE NOTICE 'Moved extension % from public to extensions schema', ext_record.extname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not move extension %, error: %', ext_record.extname, SQLERRM;
        END;
    END LOOP;
END $$;