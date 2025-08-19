-- Fix security issues identified by linter

-- 1. Fix function search path mutable issues by setting search_path for all functions
-- This prevents search path injection attacks

-- Update functions to have stable search paths
ALTER FUNCTION public.is_admin_user_safe() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.get_post_checkout_url(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.link_customer_session(text, text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.find_group_order_by_token(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.get_group_order_details(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.join_group_order_enhanced(uuid, text, text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.join_group_order(uuid, text, text, jsonb, numeric) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.join_group_order_fixed(uuid, text, text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.safe_cache_upsert(text, jsonb, bigint) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.upsert_cache_entry(text, jsonb, bigint) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.update_affiliate_stats() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.generate_affiliate_code(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.execute_automation_template(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.verify_admin_password(text, text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.get_products_cached(character varying, integer) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.generate_affiliate_handle(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.ensure_single_homepage() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.track_affiliate_order(text, text, jsonb) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.ensure_single_default_cover_page() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.ensure_single_default_flow() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.get_product_category(text[]) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.get_categories_with_counts() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.is_admin_user() SET search_path = 'public', 'pg_catalog';

-- 2. Enable leaked password protection (auth setting)
-- This requires system-level configuration that can't be set via SQL
-- Will need to be configured in Supabase dashboard

-- 3. Log the security fixes
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-fixes-round-2',
  'info',
  'Applied additional security fixes for function search paths',
  jsonb_build_object(
    'timestamp', now(),
    'fixes_applied', jsonb_build_array(
      'Set search_path for all public functions',
      'Prepared for leaked password protection configuration'
    ),
    'remaining_manual_steps', jsonb_build_array(
      'Enable leaked password protection in Supabase dashboard',
      'Review any security definer views if they exist'
    )
  )
);