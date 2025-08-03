-- =====================================================
-- PARTY ON DELIVERY - ALL-IN-ONE QUICK FIX SCRIPT
-- Run this entire script in Supabase SQL Editor
-- It will significantly improve performance immediately
-- =====================================================

-- BACKUP REMINDER: Make sure you've backed up your database first!

BEGIN;

-- =====================================================
-- PART 1: GROUP ORDER FIXES
-- =====================================================

-- Add index for faster group order lookups
CREATE INDEX IF NOT EXISTS idx_customer_orders_share_token 
ON customer_orders(share_token) 
WHERE share_token IS NOT NULL;

-- Add index for group order queries
CREATE INDEX IF NOT EXISTS idx_customer_orders_group 
ON customer_orders(is_group_order) 
WHERE is_group_order = true;

-- Fix the join function to properly track participants
CREATE OR REPLACE FUNCTION join_group_order_fixed(
  p_share_token UUID,
  p_user_email TEXT,
  p_user_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_participants JSONB;
BEGIN
  -- Find the group order with lock
  SELECT * INTO v_order 
  FROM customer_orders 
  WHERE share_token = p_share_token 
    AND is_group_order = true
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired group order');
  END IF;
  
  -- Initialize or get current participants
  v_participants = COALESCE(v_order.group_participants, '[]'::jsonb);
  
  -- Check if already joined
  IF v_participants @> jsonb_build_array(jsonb_build_object('email', p_user_email)) THEN
    RETURN jsonb_build_object(
      'success', true, 
      'order_id', v_order.id,
      'already_joined', true
    );
  END IF;
  
  -- Add new participant with timestamp
  v_participants = v_participants || jsonb_build_object(
    'email', p_user_email,
    'name', p_user_name,
    'joined_at', NOW(),
    'items', '[]'::jsonb
  );
  
  -- Update the order
  UPDATE customer_orders 
  SET 
    group_participants = v_participants,
    updated_at = NOW()
  WHERE id = v_order.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'share_token', v_order.share_token
  );
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for group orders (if not already enabled)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE customer_orders;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already exists, ignore
END $$;

-- =====================================================
-- PART 2: PRODUCT PERFORMANCE FIXES
-- =====================================================

-- Critical indexes for product queries
CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_category 
ON products(is_active, category) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_updated 
ON products(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_name 
ON products(name);

-- Shopify-specific indexes
CREATE INDEX IF NOT EXISTS idx_products_shopify_id 
ON products(shopify_product_id);

CREATE INDEX IF NOT EXISTS idx_products_shopify_collection 
ON products(shopify_collection_id) 
WHERE shopify_collection_id IS NOT NULL;

-- Create a simple cache table for frequently accessed data
CREATE TABLE IF NOT EXISTS products_cache_simple (
  cache_key VARCHAR PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_cache_created 
ON products_cache_simple(created_at);

-- Auto-cleanup function for cache
CREATE OR REPLACE FUNCTION cleanup_product_cache() RETURNS void AS $$
BEGIN
  DELETE FROM products_cache_simple 
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get products with caching
CREATE OR REPLACE FUNCTION get_products_cached(
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_cache_key VARCHAR;
  v_cached_data JSONB;
  v_products JSONB;
BEGIN
  -- Generate cache key
  v_cache_key := COALESCE('products_' || p_category, 'products_all') || '_' || p_limit;
  
  -- Try to get from cache
  SELECT data INTO v_cached_data
  FROM products_cache_simple
  WHERE cache_key = v_cache_key
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_cached_data IS NOT NULL THEN
    RETURN v_cached_data;
  END IF;
  
  -- Get fresh data
  IF p_category IS NULL THEN
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM products
      WHERE is_active = true
      ORDER BY updated_at DESC
      LIMIT p_limit
    ) p;
  ELSE
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM products
      WHERE is_active = true
        AND category = p_category
      ORDER BY updated_at DESC
      LIMIT p_limit
    ) p;
  END IF;
  
  -- Cache the result
  INSERT INTO products_cache_simple (cache_key, data)
  VALUES (v_cache_key, COALESCE(v_products, '[]'::jsonb))
  ON CONFLICT (cache_key) 
  DO UPDATE SET data = EXCLUDED.data, created_at = NOW();
  
  -- Cleanup old cache entries
  PERFORM cleanup_product_cache();
  
  RETURN COALESCE(v_products, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 3: CATEGORY MAPPING FIXES
-- =====================================================

-- Simple category mapping table
CREATE TABLE IF NOT EXISTS category_mappings_simple (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_handle VARCHAR UNIQUE,
  app_category VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common mappings (adjust these based on your Shopify collections)
INSERT INTO category_mappings_simple (collection_handle, app_category) VALUES
  ('beer', 'beer'),
  ('beers', 'beer'),
  ('beer-selection', 'beer'),
  ('craft-beer', 'beer'),
  ('domestic-beer', 'beer'),
  ('wine', 'wine'),
  ('wines', 'wine'),
  ('red-wine', 'wine'),
  ('white-wine', 'wine'),
  ('spirits', 'spirits'),
  ('liquor', 'spirits'),
  ('whiskey', 'spirits'),
  ('vodka', 'spirits'),
  ('rum', 'spirits'),
  ('tequila', 'spirits'),
  ('mixers', 'mixers'),
  ('mixer', 'mixers'),
  ('soda', 'mixers'),
  ('tonic', 'mixers')
ON CONFLICT (collection_handle) DO NOTHING;

-- Function to determine category from collection
CREATE OR REPLACE FUNCTION get_product_category(p_collection_handles TEXT[]) 
RETURNS VARCHAR AS $$
DECLARE
  v_category VARCHAR;
BEGIN
  -- Try to match collection handles
  SELECT app_category INTO v_category
  FROM category_mappings_simple
  WHERE collection_handle = ANY(p_collection_handles)
  ORDER BY 
    CASE app_category
      WHEN 'beer' THEN 1
      WHEN 'wine' THEN 2
      WHEN 'spirits' THEN 3
      WHEN 'mixers' THEN 4
      ELSE 5
    END
  LIMIT 1;
  
  RETURN COALESCE(v_category, 'other');
END;
$$ LANGUAGE plpgsql;

-- Update products with better categories (one-time fix)
UPDATE products p
SET category = get_product_category(
  ARRAY(
    SELECT LOWER(handle) 
    FROM jsonb_array_elements_text(
      COALESCE(p.shopify_collections, '[]'::jsonb)
    ) AS handle
  )
)
WHERE category IS NULL OR category = 'other';

-- =====================================================
-- PART 4: ADDITIONAL PERFORMANCE HELPERS
-- =====================================================

-- Create a view for faster category counts
CREATE OR REPLACE VIEW product_category_counts AS
SELECT 
  category,
  COUNT(*) as product_count
FROM products
WHERE is_active = true
GROUP BY category;

-- Function to get categories with counts
CREATE OR REPLACE FUNCTION get_categories_with_counts() 
RETURNS TABLE (
  category VARCHAR,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.category, p.product_count
  FROM product_category_counts p
  ORDER BY 
    CASE p.category
      WHEN 'beer' THEN 1
      WHEN 'wine' THEN 2
      WHEN 'spirits' THEN 3
      WHEN 'mixers' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: ANALYTICS & MONITORING
-- =====================================================

-- Simple performance tracking
CREATE TABLE IF NOT EXISTS performance_log_simple (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation VARCHAR NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log slow operations
CREATE OR REPLACE FUNCTION log_slow_operation(
  p_operation VARCHAR,
  p_duration_ms INTEGER
) RETURNS void AS $$
BEGIN
  IF p_duration_ms > 1000 THEN -- Log operations over 1 second
    INSERT INTO performance_log_simple (operation, duration_ms)
    VALUES (p_operation, p_duration_ms);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: FINAL OPTIMIZATIONS
-- =====================================================

-- Update table statistics for query planner
ANALYZE products;
ANALYZE customer_orders;

-- Grant necessary permissions
GRANT SELECT ON products_cache_simple TO anon;
GRANT SELECT ON category_mappings_simple TO anon;
GRANT SELECT ON product_category_counts TO anon;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'All optimizations applied successfully!';
  RAISE NOTICE 'Your app should now be significantly faster.';
  RAISE NOTICE 'Group orders should work more reliably.';
  RAISE NOTICE 'Categories should persist better.';
END $$;

COMMIT;