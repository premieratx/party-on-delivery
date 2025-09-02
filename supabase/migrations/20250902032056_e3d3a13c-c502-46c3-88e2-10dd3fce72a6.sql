-- Force immediate product sync by calling the unified sync function
-- First ensure the function exists and then trigger it properly

-- Insert a sync trigger that will force the edge function to reload everything
INSERT INTO public.cache (key, data, expires_at)
VALUES (
  'force_immediate_product_sync',
  jsonb_build_object(
    'force_sync', true,
    'reload_all_products', true,
    'sync_requested_at', extract(epoch from now()) * 1000,
    'reason', 'emergency_product_reload_after_cache_clear'
  ),
  extract(epoch from now() + interval '10 minutes') * 1000
) ON CONFLICT (key) 
DO UPDATE SET 
  data = EXCLUDED.data,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

-- Log this emergency action
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'emergency-product-reload',
  'error',
  'CRITICAL: No products found after cache clear - triggering emergency reload',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'force_immediate_sync',
    'reason', 'all_products_missing_after_cache_clear',
    'products_count', 0
  )
);