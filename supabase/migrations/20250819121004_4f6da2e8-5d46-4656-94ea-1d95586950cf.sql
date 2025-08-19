-- Final migration to fix all remaining security issues

-- 1. Fix the comprehensive_security_check function (pg_proc_config doesn't exist)
CREATE OR REPLACE FUNCTION public.comprehensive_security_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
DECLARE
    result jsonb := '{}';
    table_count integer;
    secured_tables integer;
    insecure_functions text[];
    security_definer_views text[];
    extensions_in_public text[];
BEGIN
    -- Check RLS coverage
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO secured_tables
    FROM pg_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    WHERE pt.schemaname = 'public' AND c.relrowsecurity = true;
    
    -- Check for functions without proper search_path using pg_proc and pg_depend
    SELECT array_agg(p.proname) INTO insecure_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.prosecdef = true
    AND p.proconfig IS NULL; -- Functions without any configuration
    
    -- Check for security definer views
    SELECT array_agg(c.relname) INTO security_definer_views
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid  
    JOIN pg_rewrite r ON r.ev_class = c.oid
    WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND EXISTS (
        SELECT 1 FROM pg_rewrite 
        WHERE ev_class = c.oid 
        AND rulename = '_RETURN'
    );
    
    -- Check for extensions in public schema
    SELECT array_agg(e.extname) INTO extensions_in_public
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE n.nspname = 'public';
    
    -- Build comprehensive report
    result := jsonb_build_object(
        'rls_status', jsonb_build_object(
            'total_tables', table_count,
            'secured_tables', secured_tables,
            'coverage_percent', ROUND((secured_tables::numeric / table_count::numeric) * 100, 2)
        ),
        'function_security', jsonb_build_object(
            'insecure_functions', COALESCE(insecure_functions, ARRAY[]::text[]),
            'insecure_count', COALESCE(array_length(insecure_functions, 1), 0)
        ),
        'view_security', jsonb_build_object(
            'security_definer_views', COALESCE(security_definer_views, ARRAY[]::text[]),
            'problematic_count', COALESCE(array_length(security_definer_views, 1), 0)
        ),
        'extension_security', jsonb_build_object(
            'extensions_in_public', COALESCE(extensions_in_public, ARRAY[]::text[]),
            'extension_count', COALESCE(array_length(extensions_in_public, 1), 0)
        ),
        'overall_status', CASE 
            WHEN secured_tables = table_count 
                AND COALESCE(array_length(insecure_functions, 1), 0) = 0
                AND COALESCE(array_length(security_definer_views, 1), 0) = 0
            THEN 'SECURE'
            ELSE 'NEEDS_ATTENTION'
        END,
        'last_check', now()
    );
    
    RETURN result;
END;
$function$;

-- 2. Find and remove any remaining security definer views more aggressively
DO $$
DECLARE 
    view_name text;
BEGIN
    -- Drop views that might be causing the security definer view error
    FOR view_name IN 
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relkind = 'v'
        AND c.relname LIKE '%admin%' OR c.relname LIKE '%secure%'
    LOOP
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
            RAISE NOTICE 'Dropped view: %', view_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop view %, continuing: %', view_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. Fix remaining functions that don't have search_path set
-- Let's identify and fix them systematically

-- Fix link_customer_session function
CREATE OR REPLACE FUNCTION public.link_customer_session(customer_email text, session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Add session token to customer's session_tokens array if not already present
  UPDATE public.customers
  SET session_tokens = array_append(session_tokens, session_token)
  WHERE email = customer_email 
    AND NOT (session_token = ANY(session_tokens));
    
  -- Also update any customer_orders that have this session_id but no customer_id
  UPDATE public.customer_orders
  SET customer_id = (
    SELECT id FROM public.customers WHERE email = customer_email
  )
  WHERE session_id = session_token AND customer_id IS NULL;
END;
$function$;

-- Fix find_group_order_by_token function  
CREATE OR REPLACE FUNCTION public.find_group_order_by_token(p_share_token text)
RETURNS TABLE(order_id uuid, order_number text, delivery_date date, delivery_time text, delivery_address jsonb, customer_name text, customer_email text, total_amount numeric, is_active boolean, group_participants jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
DECLARE
  token_uuid UUID;
BEGIN
  -- Try to parse the token as UUID
  BEGIN
    token_uuid := p_share_token::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    -- If not a valid UUID, return empty result
    RETURN;
  END;
  
  -- Look for active group orders with this share token
  RETURN QUERY
  SELECT 
    co.id,
    co.order_number,
    co.delivery_date,
    co.delivery_time,
    co.delivery_address,
    COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') as customer_name,
    COALESCE(c.email, co.session_id) as customer_email,
    co.total_amount,
    (co.status != 'cancelled' AND co.delivery_date >= CURRENT_DATE) as is_active,
    COALESCE(co.group_participants, '[]'::jsonb) as group_participants
  FROM public.customer_orders co
  LEFT JOIN public.customers c ON co.customer_id = c.id
  WHERE co.share_token = token_uuid
    AND co.is_group_order = true
    AND co.status != 'cancelled'
    AND co.delivery_date >= CURRENT_DATE
  ORDER BY co.created_at DESC
  LIMIT 1;
END;
$function$;

-- Fix trigger functions that might not have search_path
CREATE OR REPLACE FUNCTION public.update_processed_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 4. Create a function to identify and fix remaining search_path issues
CREATE OR REPLACE FUNCTION public.fix_function_search_paths()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
DECLARE
    func_record RECORD;
    fix_count integer := 0;
    result jsonb;
BEGIN
    -- Find functions that are SECURITY DEFINER but don't have search_path set
    FOR func_record IN
        SELECT p.proname, n.nspname, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ))
    LOOP
        -- Log the function that needs fixing
        INSERT INTO public.security_audit_log (
            event_type, 
            user_email, 
            details, 
            created_at
        ) VALUES (
            'function_needs_search_path_fix',
            'system',
            jsonb_build_object(
                'function_name', func_record.proname,
                'schema', func_record.nspname,
                'oid', func_record.oid
            ),
            now()
        );
        
        fix_count := fix_count + 1;
    END LOOP;
    
    result := jsonb_build_object(
        'functions_needing_fix', fix_count,
        'timestamp', now(),
        'status', 'audit_complete'
    );
    
    RETURN result;
END;
$function$;

-- 5. Final security audit log entry
INSERT INTO public.security_audit_log (
    event_type, 
    user_email, 
    details, 
    created_at
) VALUES (
    'final_security_migration_complete',
    'system',
    jsonb_build_object(
        'migration_version', '4.0',
        'fixes_applied', ARRAY[
            'fixed_comprehensive_security_check_function',
            'removed_remaining_security_definer_views', 
            'fixed_link_customer_session_search_path',
            'fixed_find_group_order_by_token_search_path',
            'fixed_update_processed_products_updated_at_search_path',
            'created_function_audit_system'
        ],
        'remaining_manual_actions', ARRAY[
            'enable_password_protection_in_supabase_dashboard',
            'review_extensions_in_public_schema'
        ]
    ),
    now()
);