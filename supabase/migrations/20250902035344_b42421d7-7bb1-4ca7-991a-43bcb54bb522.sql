-- Clear cache conflicts and trigger sync
DELETE FROM cache WHERE key ILIKE '%product%' OR key ILIKE '%shopify%';
DELETE FROM shopify_products_cache;

-- Call the existing functions using proper Supabase function invocation
SELECT 
  content::jsonb as fetch_result
FROM http((
  'POST',
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/fetch-shopify-products',
  ARRAY[http_header('Content-Type', 'application/json')],
  '{}'::text
));

-- Then call execute-sync to populate cache
SELECT 
  content::jsonb as sync_result  
FROM http((
  'POST',
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/execute-sync',
  ARRAY[http_header('Content-Type', 'application/json')],
  '{}'::text
));