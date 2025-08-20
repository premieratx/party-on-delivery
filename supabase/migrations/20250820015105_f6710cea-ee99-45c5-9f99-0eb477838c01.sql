-- Final security fixes for remaining issues

-- 1. Add comprehensive policies for any tables that still need them
DO $$
DECLARE
    table_record RECORD;
    policy_count INTEGER;
BEGIN
    -- Find tables with RLS enabled but few/no policies
    FOR table_record IN
        SELECT DISTINCT t.tablename
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        AND c.relrowsecurity = true
        AND t.tablename NOT IN (
            SELECT DISTINCT tablename 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            GROUP BY tablename 
            HAVING COUNT(*) >= 2  -- Tables with 2+ policies are likely OK
        )
    LOOP
        -- Count existing policies for this table
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_record.tablename;
        
        -- Add basic policies if needed
        IF policy_count = 0 THEN
            BEGIN
                -- Add admin access policy
                EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_admin_access" ON public.%I FOR ALL USING (is_admin_user_safe())', 
                    table_record.tablename, table_record.tablename);
                
                -- Add service role policy  
                EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_service_access" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', 
                    table_record.tablename, table_record.tablename);
                    
                RAISE NOTICE 'Added policies for table: %', table_record.tablename;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not add policies for table %, error: %', table_record.tablename, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 2. Fix any remaining functions with search path issues
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Look for any remaining SECURITY DEFINER functions without search_path
    FOR func_record IN
        SELECT 
            p.proname,
            n.nspname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ))
        -- Skip system/extension functions
        AND p.proname NOT LIKE 'st_%'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE '_st_%'
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = ''public'', ''pg_catalog''', 
                func_record.nspname, 
                func_record.proname,
                func_record.args
            );
            RAISE NOTICE 'Fixed search_path for function: %', func_record.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;