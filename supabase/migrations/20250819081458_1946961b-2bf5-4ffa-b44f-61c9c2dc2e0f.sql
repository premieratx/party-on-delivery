-- Force update all tailgate-beer collection products to have proper sort order
-- First, let's invoke the collection order sync for tailgate-beer
SELECT content FROM http((
  'POST',
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-collection-order',
  ARRAY[http_header('Content-Type', 'application/json')],
  '{"collection_handle": "tailgate-beer"}'
));