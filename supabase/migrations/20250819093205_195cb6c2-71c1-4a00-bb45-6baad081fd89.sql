-- CRITICAL SECURITY FIX: Protect customer and business data
-- This migration addresses multiple critical security vulnerabilities

-- 1. SECURE CUSTOMER DATA IN ABANDONED_ORDERS TABLE
-- Remove existing overly permissive policies and add strict RLS
DROP POLICY IF EXISTS "Admin users can view abandoned orders" ON public.abandoned_orders;
DROP POLICY IF EXISTS "Service role can manage abandoned orders" ON public.abandoned_orders;

CREATE POLICY "Only admin users can view abandoned orders"
ON public.abandoned_orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Only service role can manage abandoned orders"
ON public.abandoned_orders FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 2. SECURE AFFILIATE BUSINESS DATA
-- Update affiliates table policies to be more restrictive
DROP POLICY IF EXISTS "Anyone can insert affiliate profiles" ON public.affiliates;
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update their own affiliate data" ON public.affiliates;

-- Only allow affiliates to view and update their own data, admins can view all
CREATE POLICY "Affiliates can view own profile only"
ON public.affiliates FOR SELECT
USING (
  email = auth.email() OR 
  EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email())
);

CREATE POLICY "Affiliates can update own profile only"
ON public.affiliates FOR UPDATE
USING (email = auth.email());

CREATE POLICY "Service role can insert affiliate profiles"
ON public.affiliates FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 3. SECURE AUTOMATION LOGS (Customer Data)
-- Remove public access, only admins should see automation logs
DROP POLICY IF EXISTS "System can insert automation logs" ON public.automation_logs;

CREATE POLICY "Only admins can view automation logs"
ON public.automation_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Only service role can manage automation logs"
ON public.automation_logs FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 4. SECURE AFFILIATE ORDER TRACKING
-- Remove overly broad policies, add strict access control
DROP POLICY IF EXISTS "Service role can manage tracking" ON public.affiliate_order_tracking;
DROP POLICY IF EXISTS "Admin users can view all affiliate tracking" ON public.affiliate_order_tracking;
DROP POLICY IF EXISTS "Affiliates can view own tracking only" ON public.affiliate_order_tracking;

CREATE POLICY "Affiliates can view own tracking, admins view all"
ON public.affiliate_order_tracking FOR SELECT
USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()) OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email())
);

CREATE POLICY "Only service role can manage affiliate tracking"
ON public.affiliate_order_tracking FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 5. ADD MISSING RLS POLICIES FOR TABLES WITH RLS ENABLED BUT NO POLICIES
-- Check for other tables that might need policies (based on scan results)

-- For tables that should be admin-only or service-role-only
CREATE POLICY IF NOT EXISTS "Admin access only" ON public.performance_log_simple FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email()));

-- 6. SECURE DATABASE FUNCTIONS - ADD MISSING SEARCH PATH
-- Update functions that are missing proper search_path settings
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

CREATE OR REPLACE FUNCTION public.upsert_cache_entry(cache_key_param text, cache_data_param jsonb, expires_timestamp_param bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO public.cache (key, data, expires_at)
  VALUES (cache_key_param, cache_data_param, expires_timestamp_param)
  ON CONFLICT (key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$function$;

-- 7. ADD SECURITY AUDIT LOGGING
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-hardening',
  'info',
  'Critical security policies updated',
  jsonb_build_object(
    'timestamp', now(),
    'tables_secured', ARRAY[
      'abandoned_orders', 
      'affiliates', 
      'automation_logs', 
      'affiliate_order_tracking'
    ],
    'policies_updated', true,
    'functions_secured', true
  )
);