-- Final security fixes for remaining RLS and function issues

-- 1. Add basic RLS policies for any remaining tables without policies
DO $$
DECLARE
    table_record RECORD;
    policy_count INTEGER;
BEGIN
    FOR table_record IN
        SELECT t.tablename
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        AND c.relrowsecurity = true  -- RLS is enabled
        AND t.tablename NOT IN (
            'admin_users', 'affiliates', 'customers', 'customer_orders', 
            'affiliate_referrals', 'abandoned_orders', 'customer_profiles', 
            'delivery_addresses'
        )  -- Skip tables with existing complex policies
    LOOP
        -- Check if table has any policies at all
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies p 
        WHERE p.tablename = table_record.tablename 
        AND p.schemaname = 'public';
        
        -- If no policies exist, add basic ones
        IF policy_count = 0 THEN
            BEGIN
                -- Add admin access policy
                EXECUTE format('CREATE POLICY "%s_admin_access" ON public.%I FOR ALL USING (is_admin_user_safe())', 
                    table_record.tablename, 
                    table_record.tablename
                );
                
                -- Add service role policy  
                EXECUTE format('CREATE POLICY "%s_service_access" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', 
                    table_record.tablename, 
                    table_record.tablename
                );
                
                RAISE NOTICE 'Added basic policies for table: %', table_record.tablename;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not add policies for table %, error: %', table_record.tablename, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 2. Fix any remaining functions with missing search_path
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
        AND p.prosecdef = true  
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ))
        AND p.proname NOT LIKE 'st_%'  
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT IN (
            'update_updated_at_column', 
            'update_processed_products_updated_at',
            'ensure_single_default_flow_global',
            'ensure_single_default_cover_page'
        )  
    LOOP
        BEGIN
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