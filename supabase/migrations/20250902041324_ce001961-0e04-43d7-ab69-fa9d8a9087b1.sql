-- Clear the empty cache completely and reset
DELETE FROM public.cache WHERE key LIKE '%instant-product%' OR data = '[]' OR data IS NULL;

-- Trigger a working sync using execute-sync function
SELECT pg_notify('shopify_sync_needed', 'force_refresh');