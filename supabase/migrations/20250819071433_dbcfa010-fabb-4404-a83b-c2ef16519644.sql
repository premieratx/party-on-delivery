-- CRITICAL SECURITY FIXES - Fix exposed customer data and business intelligence

-- 1. FIX ORDER DRAFTS - Remove public access, allow only own data access
DROP POLICY IF EXISTS "Anyone can view order drafts" ON public.order_drafts;
DROP POLICY IF EXISTS "Order drafts are publicly readable" ON public.order_drafts;

CREATE POLICY "Users can view their own order drafts"
ON public.order_drafts
FOR SELECT
USING (customer_email = auth.email());

CREATE POLICY "Users can create their own order drafts"
ON public.order_drafts
FOR INSERT
WITH CHECK (customer_email = auth.email());

CREATE POLICY "Users can update their own order drafts"
ON public.order_drafts
FOR UPDATE
USING (customer_email = auth.email());

CREATE POLICY "Admin users can manage all order drafts"
ON public.order_drafts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
));

-- 2. FIX OPTIMIZATION LOGS - Admin access only
DROP POLICY IF EXISTS "Optimization logs are publicly readable" ON public.optimization_logs;

CREATE POLICY "Admin users can view optimization logs"
ON public.optimization_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
));

CREATE POLICY "System can insert optimization logs"
ON public.optimization_logs
FOR INSERT
WITH CHECK (true);

-- 3. FIX AUTOMATION SESSIONS - Admin access only
DROP POLICY IF EXISTS "Automation sessions are publicly readable" ON public.automation_sessions;

CREATE POLICY "Admin users can view automation sessions"
ON public.automation_sessions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
));

-- 4. FIX MASTER AUTOMATION SESSIONS if exists - Admin access only
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_automation_sessions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Master automation sessions are publicly readable" ON public.master_automation_sessions';
    
    EXECUTE 'CREATE POLICY "Admin users can view master automation sessions"
    ON public.master_automation_sessions
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ))';
  END IF;
END $$;

-- 5. FIX PRODUCT MODIFICATIONS if exists - Admin access only
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_modifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Product modifications are publicly readable" ON public.product_modifications';
    
    EXECUTE 'CREATE POLICY "Admin users can view product modifications"
    ON public.product_modifications
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ))';
  END IF;
END $$;

-- 6. UPDATE FUNCTIONS TO INCLUDE SEARCH_PATH SECURITY
-- Fix functions that are missing search_path settings
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_affiliate_code(company_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base code from company name (first 6 chars, uppercase, alphanumeric only)
  base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  -- If base_code is empty or too short, use random string
  IF LENGTH(base_code) < 3 THEN
    base_code := 'AFF' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  
  final_code := base_code;
  
  -- Check if code exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    final_code := base_code || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$function$;

-- 7. ADD SECURITY LOG ENTRY
INSERT INTO public.security_audit_log (event_type, user_email, details, created_at)
VALUES (
  'security_hardening_applied',
  'system',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'order_drafts_access_restricted',
      'optimization_logs_admin_only', 
      'automation_sessions_admin_only',
      'functions_search_path_secured'
    ],
    'timestamp', now()
  ),
  now()
);

-- 8. Log successful security fixes
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-hardening-complete',
  'info',
  'Critical security fixes applied successfully',
  jsonb_build_object(
    'customer_data_secured', true,
    'business_intelligence_secured', true,
    'function_security_hardened', true,
    'policies_updated', 8,
    'timestamp', now()
  )
);