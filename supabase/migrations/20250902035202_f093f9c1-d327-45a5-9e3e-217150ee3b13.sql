-- Force trigger the existing Shopify sync functions that were working
SELECT net.http_post(
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/fetch-shopify-products',
  '{}',
  'application/json'
);

-- Also trigger execute-sync which should populate the cache
SELECT net.http_post(
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/execute-sync',
  '{}',
  'application/json'
);