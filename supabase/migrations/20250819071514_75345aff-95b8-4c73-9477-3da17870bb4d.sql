-- CRITICAL SECURITY FIXES - Remove public access to sensitive data

-- 1. Remove public access policies that expose data
DROP POLICY IF EXISTS "System can manage drafts" ON public.order_drafts;
DROP POLICY IF EXISTS "Optimization logs are publicly readable" ON public.optimization_logs; 
DROP POLICY IF EXISTS "System can manage optimization logs" ON public.optimization_logs;
DROP POLICY IF EXISTS "System can manage automation sessions" ON public.automation_sessions;
DROP POLICY IF EXISTS "Master automation sessions are publicly accessible" ON public.master_automation_sessions;
DROP POLICY IF EXISTS "Allow all operations on product_modifications" ON public.product_modifications;

-- 2. Add secure system access for edge functions only
CREATE POLICY "Service role can insert optimization logs"
ON public.optimization_logs
FOR INSERT
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Service role can manage automation sessions"
ON public.automation_sessions
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 3. Update remaining functions to have secure search_path
CREATE OR REPLACE FUNCTION public.generate_affiliate_handle(company_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 1;
BEGIN
  -- Create base handle from company name (lowercase, replace spaces/special chars with hyphens)
  base_handle := lower(trim(company_name));
  base_handle := regexp_replace(base_handle, '[^a-z0-9]+', '-', 'g');
  base_handle := regexp_replace(base_handle, '^-+|-+$', '', 'g');
  base_handle := substring(base_handle from 1 for 20);
  
  -- If base_handle is empty or too short, use random string
  IF length(base_handle) < 3 THEN
    base_handle := 'affiliate-' || floor(random() * 1000)::text;
  END IF;
  
  final_handle := base_handle;
  
  -- Check if handle exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE custom_handle = final_handle) LOOP
    final_handle := base_handle || '-' || counter::text;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_handle;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_post_checkout_url(app_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
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

-- 4. Log security fixes
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-policies-fixed',
  'info', 
  'Removed public access to sensitive business data',
  jsonb_build_object(
    'tables_secured', ARRAY['order_drafts', 'optimization_logs', 'automation_sessions', 'master_automation_sessions', 'product_modifications'],
    'public_policies_removed', 6,
    'timestamp', now()
  )
);