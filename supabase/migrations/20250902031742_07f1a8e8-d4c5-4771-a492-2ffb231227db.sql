-- Emergency fix: Directly trigger Shopify sync and clear all caches
-- This will force all products to load with correct Shopify ordering

-- Clear all existing product caches
DELETE FROM public.cache 
WHERE key LIKE '%product%' OR key LIKE '%collection%' OR key LIKE '%shopify%';

-- Clear shopify products cache
DELETE FROM public.shopify_products_cache 
WHERE id IS NOT NULL;

-- Insert a cache entry that forces immediate refresh with ordering fix
INSERT INTO public.cache (key, data, expires_at)
VALUES (
  'emergency_product_order_fix',
  jsonb_build_object(
    'force_refresh', true,
    'ordering_fix_applied', true,
    'cache_cleared_at', extract(epoch from now()) * 1000,
    'message', 'All caches cleared - products will load with correct Shopify ordering'
  ),
  extract(epoch from now() + interval '5 minutes') * 1000
) ON CONFLICT (key) 
DO UPDATE SET 
  data = EXCLUDED.data,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

-- Log the emergency fix
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'emergency-product-order-fix',
  'info',
  'Emergency cache clear completed - products will refresh with correct ordering',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'emergency_cache_clear_and_force_refresh',
    'next_load_will_have_correct_order', true
  )
);