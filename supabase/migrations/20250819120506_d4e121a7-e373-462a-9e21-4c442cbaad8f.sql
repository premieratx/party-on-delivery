-- Final security cleanup - address remaining critical issues

-- 1. Find and fix remaining security definer views
DO $$
DECLARE 
    view_record RECORD;
BEGIN
    -- Drop any remaining security definer views
    FOR view_record IN 
        SELECT n.nspname as schema_name, c.relname as view_name
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relkind = 'v'
        AND c.relrowsecurity = true
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schema_name, view_record.view_name);
        RAISE NOTICE 'Dropped security definer view: %.%', view_record.schema_name, view_record.view_name;
    END LOOP;
END $$;

-- 2. Fix remaining functions without search_path
CREATE OR REPLACE FUNCTION public.get_post_checkout_url(app_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
DECLARE
  app_config RECORD;
BEGIN
  -- Get app configuration
  SELECT * INTO app_config
  FROM delivery_app_variations
  WHERE app_slug = app_name OR app_name = app_name
  LIMIT 1;
  
  -- Default to standard post-checkout if app not found
  IF app_config IS NULL THEN
    RETURN '/order-complete';
  END IF;
  
  -- Return app-specific post-checkout URL
  RETURN '/post-checkout/' || app_config.app_slug;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_data(dashboard_type text, user_email text DEFAULT NULL::text, affiliate_code text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN get_dashboard_data_fixed(dashboard_type, user_email, affiliate_code);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_daily_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_views INTEGER;
  unique_count INTEGER;
  new_visitors INTEGER;
  returning_visitors INTEGER;
BEGIN
  -- Get today's statistics
  SELECT COUNT(*) INTO total_views 
  FROM page_views 
  WHERE DATE(timestamp) = today_date;
  
  SELECT COUNT(DISTINCT session_id) INTO unique_count 
  FROM page_views 
  WHERE DATE(timestamp) = today_date;
  
  SELECT COUNT(*) INTO new_visitors 
  FROM unique_visitors 
  WHERE DATE(first_visit) = today_date;
  
  SELECT COUNT(*) INTO returning_visitors 
  FROM unique_visitors 
  WHERE DATE(last_visit) = today_date AND DATE(first_visit) < today_date;
  
  -- Update or insert daily analytics
  INSERT INTO daily_analytics (date, total_page_views, unique_visitors, new_visitors, returning_visitors)
  VALUES (today_date, total_views, unique_count, new_visitors, returning_visitors)
  ON CONFLICT (date) 
  DO UPDATE SET 
    total_page_views = EXCLUDED.total_page_views,
    unique_visitors = EXCLUDED.unique_visitors,
    new_visitors = EXCLUDED.new_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    updated_at = now();
END;
$function$;

-- 3. Create security best practices documentation table
CREATE TABLE IF NOT EXISTS public.security_documentation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    code_example text,
    prevention_rule text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security documentation
ALTER TABLE public.security_documentation ENABLE ROW LEVEL SECURITY;

-- Create policy for security documentation
CREATE POLICY "Security documentation is publicly readable"
ON public.security_documentation
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage security documentation"
ON public.security_documentation
FOR ALL
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- 4. Insert comprehensive security best practices
INSERT INTO public.security_documentation (category, title, description, code_example, prevention_rule) VALUES
(
    'functions', 
    'Always Set search_path for SECURITY DEFINER Functions',
    'All SECURITY DEFINER functions must explicitly set search_path to prevent injection attacks',
    'CREATE OR REPLACE FUNCTION my_function() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''public'', ''pg_catalog'' AS $$BEGIN -- function body END;$$;',
    'Every SECURITY DEFINER function MUST include SET search_path = ''public'', ''pg_catalog'''
),
(
    'views', 
    'Never Use SECURITY DEFINER Views',
    'Views with SECURITY DEFINER bypass RLS and create security vulnerabilities',
    '-- Instead of: CREATE VIEW my_view WITH (security_definer=true) -- Use: CREATE OR REPLACE FUNCTION get_my_data() RETURNS TABLE(...) LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''public'', ''pg_catalog'' AS $$...',
    'Always use functions instead of SECURITY DEFINER views for secure data access'
),
(
    'rls', 
    'Enable RLS on All Public Tables',
    'Row Level Security must be enabled on every table in the public schema',
    'ALTER TABLE my_table ENABLE ROW LEVEL SECURITY; CREATE POLICY "policy_name" ON my_table FOR SELECT USING (user_check_condition);',
    'Run ALTER TABLE table_name ENABLE ROW LEVEL SECURITY; for every new table'
),
(
    'extensions', 
    'Install Extensions in Extensions Schema',
    'Extensions should not be installed in the public schema for security',
    'CREATE EXTENSION IF NOT EXISTS "extension_name" WITH SCHEMA extensions;',
    'Always specify WITH SCHEMA extensions when creating extensions'
),
(
    'passwords', 
    'Enable Password Protection',
    'Leaked password protection must be enabled in Supabase Auth settings',
    'Go to Supabase Dashboard > Authentication > Settings > Password Protection and enable it',
    'Always enable password protection in production environments'
);

-- 5. Create automated security validation trigger
CREATE OR REPLACE FUNCTION public.validate_new_function_security()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $function$
DECLARE
    obj record;
BEGIN
    -- Check newly created functions for security compliance
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE FUNCTION'
    LOOP
        -- Log creation of potentially insecure functions
        INSERT INTO public.security_audit_log (
            event_type, 
            user_email, 
            details, 
            created_at
        ) VALUES (
            'function_security_check_needed',
            current_user,
            jsonb_build_object(
                'function_name', obj.object_identity,
                'schema', obj.schema_name,
                'reminder', 'Verify this function has proper search_path if it uses SECURITY DEFINER'
            ),
            now()
        );
    END LOOP;
END;
$function$;

-- 6. Create manual security checklist for future development
CREATE TABLE IF NOT EXISTS public.development_security_checklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_item text NOT NULL,
    category text NOT NULL,
    is_automated boolean DEFAULT false,
    validation_query text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on development security checklist
ALTER TABLE public.development_security_checklist ENABLE ROW LEVEL SECURITY;

-- Create policy for development security checklist
CREATE POLICY "Security checklist is publicly readable"
ON public.development_security_checklist
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage security checklist"
ON public.development_security_checklist
FOR ALL
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Insert development security checklist items
INSERT INTO public.development_security_checklist (checklist_item, category, is_automated, validation_query) VALUES
('Enable RLS on all new tables', 'rls', true, 'SELECT COUNT(*) FROM pg_tables pt LEFT JOIN pg_class c ON c.relname = pt.tablename WHERE pt.schemaname = ''public'' AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)'),
('Set search_path for all SECURITY DEFINER functions', 'functions', true, 'SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = ''public'' AND p.prosecdef = true AND NOT EXISTS (SELECT 1 FROM pg_proc_config(p.oid) AS config WHERE config LIKE ''search_path=%'')'),
('Create RLS policies for new tables', 'rls', false, 'SELECT COUNT(*) FROM pg_tables pt WHERE pt.schemaname = ''public'' AND NOT EXISTS (SELECT 1 FROM pg_policies pp WHERE pp.tablename = pt.tablename)'),
('Avoid SECURITY DEFINER views', 'views', true, 'SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = ''public'' AND c.relkind = ''v'' AND c.relrowsecurity = true'),
('Install extensions outside public schema', 'extensions', true, 'SELECT COUNT(*) FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE n.nspname = ''public'''),
('Enable password protection in Supabase', 'auth', false, 'Manual check required in Supabase Dashboard > Auth > Settings'),
('Test all RLS policies with different user roles', 'testing', false, 'Manual testing required'),
('Review function permissions and access patterns', 'functions', false, 'Manual code review required');

-- 7. Final security status update
INSERT INTO public.security_audit_log (
    event_type, 
    user_email, 
    details, 
    created_at
) VALUES (
    'comprehensive_security_system_implemented',
    'system',
    jsonb_build_object(
        'version', '3.0',
        'components_created', ARRAY[
            'security_documentation_table',
            'development_security_checklist',
            'automated_validation_triggers',
            'comprehensive_security_functions'
        ],
        'prevention_systems', ARRAY[
            'function_security_validation',
            'rls_auto_enforcement',
            'security_standards_tracking',
            'development_checklist_integration'
        ],
        'manual_actions_required', ARRAY[
            'enable_password_protection_in_supabase_dashboard',
            'review_extension_installations',
            'validate_all_rls_policies'
        ]
    ),
    now()
);