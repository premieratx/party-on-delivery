-- Fix critical security vulnerabilities - CORRECTED VERSION
-- This addresses the major security issues found by the scanner

-- 1. Fix cart_sessions table with correct column name
DROP POLICY IF EXISTS "Users can manage their own cart sessions" ON public.cart_sessions;
DROP POLICY IF EXISTS "Admins can view all cart sessions" ON public.cart_sessions;
CREATE POLICY "Users can manage their own cart sessions" 
ON public.cart_sessions FOR ALL
TO authenticated
USING (customer_email = auth.email());

CREATE POLICY "Admins can view all cart sessions" 
ON public.cart_sessions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 2. Fix quotes table with correct policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
CREATE POLICY "Users can view their own quotes" 
ON public.quotes FOR ALL
TO authenticated
USING (customer_email = auth.email());

CREATE POLICY "Admins can view all quotes" 
ON public.quotes FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 3. Add missing policies for other critical tables
-- Fix performance_log_simple table
ALTER TABLE public.performance_log_simple ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view performance logs" ON public.performance_log_simple;
CREATE POLICY "Admins can view performance logs" 
ON public.performance_log_simple FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- Fix shopify_products_cache table 
ALTER TABLE public.shopify_products_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read products cache" ON public.shopify_products_cache;
CREATE POLICY "Public can read products cache" 
ON public.shopify_products_cache FOR SELECT
TO public
USING (true);

CREATE POLICY "System can manage products cache" 
ON public.shopify_products_cache FOR ALL
TO authenticated
USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- Fix shopify_collections_cache table
ALTER TABLE public.shopify_collections_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read collections cache" ON public.shopify_collections_cache;
CREATE POLICY "Public can read collections cache" 
ON public.shopify_collections_cache FOR SELECT
TO public
USING (true);

CREATE POLICY "System can manage collections cache" 
ON public.shopify_collections_cache FOR ALL
TO authenticated
USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- Fix optimization_logs table
ALTER TABLE public.optimization_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view optimization logs" ON public.optimization_logs;
CREATE POLICY "Admins can view optimization logs" 
ON public.optimization_logs FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- Fix security_audit_log table (critical - contains sensitive security data)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_audit_log;
CREATE POLICY "Admins can view security logs" 
ON public.security_audit_log FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- Security audit logging for this fix
INSERT INTO public.security_audit_log (event_type, user_email, details, created_at)
VALUES ('critical_security_fixes_applied', 'system', 
  jsonb_build_object(
    'fixed_tables', ARRAY[
      'cart_sessions', 'quotes', 'performance_log_simple', 'shopify_products_cache',
      'shopify_collections_cache', 'optimization_logs', 'security_audit_log'
    ],
    'timestamp', now(),
    'fix_type', 'rls_policies_corrected'
  ), now());