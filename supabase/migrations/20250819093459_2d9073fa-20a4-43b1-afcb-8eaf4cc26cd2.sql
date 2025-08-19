-- SECURITY FIX PHASE 2: Complete remaining security hardening
-- Fix remaining function security issues without conflicting with existing policies

-- 1. FIX REMAINING FUNCTIONS WITH MISSING SEARCH_PATH
-- These functions need the search_path security fix

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
  base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  IF LENGTH(base_code) < 3 THEN
    base_code := 'AFF' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  
  final_code := base_code;
  
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    final_code := base_code || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$function$;

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
  base_handle := lower(trim(company_name));
  base_handle := regexp_replace(base_handle, '[^a-z0-9]+', '-', 'g');
  base_handle := regexp_replace(base_handle, '^-+|-+$', '', 'g');
  base_handle := substring(base_handle from 1 for 20);
  
  IF length(base_handle) < 3 THEN
    base_handle := 'affiliate-' || floor(random() * 1000)::text;
  END IF;
  
  final_handle := base_handle;
  
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE custom_handle = final_handle) LOOP
    final_handle := base_handle || '-' || counter::text;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_handle;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache_optimized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  DELETE FROM public.cache 
  WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
  
  DELETE FROM public.shopify_products_cache 
  WHERE updated_at < now() - INTERVAL '2 hours';
  
  INSERT INTO public.optimization_logs (task_id, log_level, message, details)
  VALUES ('cache-cleanup', 'info', 'Cache cleanup completed', jsonb_build_object('timestamp', now()));
END;
$function$;

-- 2. ADD MISSING RLS POLICIES FOR TABLES THAT NEED THEM
-- Check and add policies for tables that might be missing them

-- For performance_log_simple table (if it exists and has RLS enabled)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.table_name = 'performance_log_simple' 
        AND t.table_schema = 'public'
        AND c.relrowsecurity = true
        AND n.nspname = 'public'
    ) THEN
        -- Only create if no policies exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'performance_log_simple' 
            AND schemaname = 'public'
        ) THEN
            EXECUTE 'CREATE POLICY "Admin users can manage performance logs"
            ON public.performance_log_simple FOR ALL
            USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email()))';
        END IF;
    END IF;
END $$;

-- For products_cache_simple table (if it exists and has RLS enabled)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.table_name = 'products_cache_simple' 
        AND t.table_schema = 'public'
        AND c.relrowsecurity = true
        AND n.nspname = 'public'
    ) THEN
        -- Only create if no policies exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'products_cache_simple' 
            AND schemaname = 'public'
        ) THEN
            EXECUTE 'CREATE POLICY "Service role can manage product cache"
            ON public.products_cache_simple FOR ALL
            USING ((auth.jwt() ->> ''role''::text) = ''service_role''::text)';
        END IF;
    END IF;
END $$;

-- 3. ADD FINAL SECURITY AUDIT LOG
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-hardening-complete',
  'info',
  'Security hardening completed successfully',
  jsonb_build_object(
    'timestamp', now(),
    'functions_secured', ARRAY[
      'generate_affiliate_code',
      'generate_affiliate_handle', 
      'cleanup_expired_cache_optimized',
      'cleanup_expired_cache',
      'upsert_cache_entry'
    ],
    'policies_reviewed', true,
    'customer_data_secured', true,
    'affiliate_data_secured', true,
    'phase', 'complete'
  )
);