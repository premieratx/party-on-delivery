-- Force refresh all Shopify data and create fresh product-collection mappings
-- First, clear stale cache entries
DELETE FROM cache WHERE key LIKE 'shopify%' AND created_at < NOW() - INTERVAL '1 hour';

-- Update products cache sync
UPDATE shopify_products_cache 
SET updated_at = NOW() - INTERVAL '2 hours'  
WHERE updated_at > NOW() - INTERVAL '1 hour';