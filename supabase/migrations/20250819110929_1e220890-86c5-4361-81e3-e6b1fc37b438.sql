-- Final security fixes - address remaining linter issues

-- 1. Set search paths for remaining functions that don't have them
ALTER FUNCTION public.safe_timestamp_to_bigint(timestamp with time zone) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.update_processed_products_updated_at() SET search_path = 'public', 'pg_catalog';

-- 2. Check if instant_products_view has any security issues and recreate it properly if needed
-- The view appears to be a standard view, not SECURITY DEFINER
-- But let's ensure it's created without any security definer properties
DROP VIEW IF EXISTS public.instant_products_view;
CREATE VIEW public.instant_products_view AS 
SELECT 
    spc.id,
    spc.title,
    spc.price,
    spc.image,
    spc.handle,
    spc.variants,
    spc.collection_handles,
    spc.category,
    spc.updated_at,
    COALESCE(cm.app_category, 'other'::character varying) AS app_category
FROM shopify_products_cache spc
LEFT JOIN category_mappings_simple cm ON (
    EXISTS (
        SELECT 1 
        FROM unnest(spc.collection_handles) ch(handle)
        WHERE ch.handle ILIKE ('%' || cm.collection_handle || '%')
    )
);

-- 3. Grant appropriate permissions on the view
GRANT SELECT ON public.instant_products_view TO PUBLIC;

-- 4. Log the final security fixes
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-fixes-final',
  'info',
  'Applied final security fixes - remaining issues require manual configuration',
  jsonb_build_object(
    'timestamp', now(),
    'fixes_applied', jsonb_build_array(
      'Set search_path for remaining functions',
      'Recreated instant_products_view without security definer',
      'Granted public select permissions on view'
    ),
    'manual_fixes_needed', jsonb_build_array(
      'Move pg_net extension from public schema (requires superuser access)',
      'Enable leaked password protection in Supabase Auth settings'
    ),
    'dashboard_links', jsonb_build_object(
      'auth_settings', 'https://supabase.com/dashboard/project/acmlfzfliqupwxwoefdq/auth/providers'
    )
  )
);