-- Fix remaining function security issues by setting search_path

-- List functions that need search_path fixes
SELECT 
    p.proname as function_name,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.prosrc NOT LIKE '%search_path%'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname IN (
        'cleanup_expired_cache',
        'cleanup_expired_orders', 
        'cleanup_expired_progress',
        'optimized_cache_cleanup',
        'safe_timestamp_to_bigint',
        'generate_affiliate_code',
        'generate_affiliate_handle'
    );

-- Fix specific functions that need search_path
ALTER FUNCTION public.cleanup_expired_cache() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.cleanup_expired_orders() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.cleanup_expired_progress() SET search_path = 'public', 'pg_catalog'; 
ALTER FUNCTION public.optimized_cache_cleanup() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.safe_timestamp_to_bigint(timestamp with time zone) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.generate_affiliate_code(text) SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.generate_affiliate_handle(text) SET search_path = 'public', 'pg_catalog';