-- Trigger products/update webhook manually to refresh product cache
-- This will call our existing shopify-webhook-receiver which has product update handling
SELECT net.http_post(
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-webhook-receiver',
  '{"id": 1, "trigger_sync": true}',
  'application/json',
  '{"x-shopify-topic": "products/update", "Content-Type": "application/json"}'
);