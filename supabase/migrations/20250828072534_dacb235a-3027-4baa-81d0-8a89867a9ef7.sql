-- CRITICAL SECURITY FIX 3: Enable RLS on tables that have policies but RLS disabled
-- This fixes the "Policy Exists RLS Disabled" error

-- Check and enable RLS on delivery_app_variations if it exists and has policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_app_variations') THEN
    ALTER TABLE delivery_app_variations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- CRITICAL SECURITY FIX 4: Enable RLS on remaining public tables
-- This fixes the "RLS Disabled in Public" error

-- Enable RLS on any remaining tables in public schema that don't have it
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT schemaname, tablename 
    FROM pg_tables pt
    LEFT JOIN pg_class c ON c.relname = pt.tablename
    WHERE pt.schemaname = 'public' 
    AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false)
    AND pt.tablename NOT IN ('spatial_ref_sys') -- Skip PostGIS system tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    RAISE NOTICE 'Enabled RLS on %', table_record.tablename;
  END LOOP;
END $$;

-- CRITICAL SECURITY FIX 5: Add missing search_path to functions that need it
-- This fixes the "Function Search Path Mutable" warning

-- Fix the hash_password function
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Fix the verify_password function  
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN (hash = crypt(password, hash));
END;
$$;

-- Create secure policies for critical customer data tables
-- Ensure customer orders are properly secured
DROP POLICY IF EXISTS "customer_orders_select_simple" ON customer_orders;
DROP POLICY IF EXISTS "customer_orders_insert_policy" ON customer_orders;
DROP POLICY IF EXISTS "customer_orders_update_policy" ON customer_orders;

CREATE POLICY "customer_orders_admin_full_access"
ON customer_orders FOR ALL
TO authenticated
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "customer_orders_service_role_access"
ON customer_orders FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Secure admin_users table more strictly
DROP POLICY IF EXISTS "admin_users_admin_only" ON admin_users;
DROP POLICY IF EXISTS "admin_users_self_only" ON admin_users;
DROP POLICY IF EXISTS "admin_users_self_strict" ON admin_users;

CREATE POLICY "admin_users_admin_access_only"
ON admin_users FOR ALL
TO authenticated
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Secure affiliates table
DROP POLICY IF EXISTS "affiliates_admin_access" ON affiliates;
DROP POLICY IF EXISTS "affiliates_self_and_admin" ON affiliates;
DROP POLICY IF EXISTS "affiliates_self_and_admin_only" ON affiliates;
DROP POLICY IF EXISTS "affiliates_service_role" ON affiliates;

CREATE POLICY "affiliates_admin_and_self_access"
ON affiliates FOR ALL
TO authenticated
USING (is_admin_user_safe() OR email = auth.email())
WITH CHECK (is_admin_user_safe() OR email = auth.email());

CREATE POLICY "affiliates_service_role_access"
ON affiliates FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Log completion of security hardening
INSERT INTO security_audit_log (event_type, user_email, details)
VALUES (
  'security_hardening_phase_2_complete',
  'system',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'enabled_rls_on_all_public_tables',
      'fixed_function_search_paths',
      'secured_customer_orders_table',
      'secured_admin_users_table',
      'secured_affiliates_table'
    ],
    'timestamp', now()
  )
);