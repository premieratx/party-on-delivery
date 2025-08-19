-- Drop affiliate_app_links view since delivery apps are no longer linked to affiliates
DROP VIEW IF EXISTS affiliate_app_links CASCADE;

-- Drop affiliate_app_assignments table since delivery apps are no longer linked to affiliates  
DROP TABLE IF EXISTS affiliate_app_assignments CASCADE;

-- Remove affiliate-related columns from delivery_app_variations since they're no longer linked to affiliates
ALTER TABLE delivery_app_variations 
DROP COLUMN IF EXISTS affiliate_id,
DROP COLUMN IF EXISTS assigned_to_affiliate;

-- Fix search_path for all functions to ensure they work properly
ALTER FUNCTION cleanup_expired_cache() SET search_path = public, pg_catalog;
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION upsert_cache_entry(text, jsonb, bigint) SET search_path = public, pg_catalog;
ALTER FUNCTION update_daily_analytics() SET search_path = public, pg_catalog;

-- Ensure shopify_products_cache uses proper Shopify sort_order for collections
CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_sort_order ON shopify_products_cache(sort_order) WHERE sort_order IS NOT NULL;