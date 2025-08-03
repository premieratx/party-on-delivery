-- =====================================================
-- PARTY ON DELIVERY - MODIFIED QUICK FIX SCRIPT
-- Adapted for your existing schema
-- =====================================================

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
-- PART 2: SHOPIFY PRODUCT CACHE OPTIMIZATIONS
-- =====================================================

-- Add indexes to existing shopify_products_cache table
CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_handle 
ON shopify_products_cache(handle);

CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_title 
ON shopify_products_cache(title);

CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_price 
ON shopify_products_cache(price);

CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_updated 
ON shopify_products_cache(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_created 
ON shopify_products_cache(created_at DESC);

-- Add index for collections if they exist
CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_collections 
ON shopify_products_cache USING GIN(collections);

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

-- Function to get products with caching (using shopify_products_cache)
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
  v_cache_key := COALESCE('shopify_products_' || p_category, 'shopify_products_all') || '_' || p_limit;
  
  -- Try to get from cache
  SELECT data INTO v_cached_data
  FROM products_cache_simple
  WHERE cache_key = v_cache_key
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_cached_data IS NOT NULL THEN
    RETURN v_cached_data;
  END IF;
  
  -- Get fresh data from shopify_products_cache
  IF p_category IS NULL THEN
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM shopify_products_cache
      ORDER BY updated_at DESC
      LIMIT p_limit
    ) p;
  ELSE
    -- Try to filter by collections containing the category
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM shopify_products_cache
      WHERE collections @> jsonb_build_array(p_category)
         OR collections::text ILIKE '%' || p_category || '%'
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
  ('tonic', 'mixers'),
  ('cocktails', 'cocktails'),
  ('cocktail', 'cocktails'),
  ('party-supplies', 'party-supplies'),
  ('supplies', 'party-supplies'),
  ('seltzers', 'seltzers'),
  ('seltzer', 'seltzers')
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
      WHEN 'cocktails' THEN 4
      WHEN 'seltzers' THEN 5
      WHEN 'mixers' THEN 6
      WHEN 'party-supplies' THEN 7
      ELSE 8
    END
  LIMIT 1;
  
  RETURN COALESCE(v_category, 'other');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: ADDITIONAL PERFORMANCE HELPERS
-- =====================================================

-- Function to get categories with counts (using shopify_products_cache)
CREATE OR REPLACE FUNCTION get_categories_with_counts() 
RETURNS TABLE (
  category VARCHAR,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    get_product_category(
      ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(spc.collections, '[]'::jsonb))
      )
    ) as category,
    COUNT(*) as product_count
  FROM shopify_products_cache spc
  GROUP BY get_product_category(
    ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(spc.collections, '[]'::jsonb))
    )
  )
  ORDER BY 
    CASE get_product_category(
      ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(spc.collections, '[]'::jsonb))
      )
    )
      WHEN 'beer' THEN 1
      WHEN 'wine' THEN 2
      WHEN 'spirits' THEN 3
      WHEN 'cocktails' THEN 4
      WHEN 'seltzers' THEN 5
      WHEN 'mixers' THEN 6
      WHEN 'party-supplies' THEN 7
      ELSE 8
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
ANALYZE shopify_products_cache;
ANALYZE customer_orders;
ANALYZE custom_product_categories;

-- Grant necessary permissions
GRANT SELECT ON products_cache_simple TO anon;
GRANT SELECT ON category_mappings_simple TO anon;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'All optimizations applied successfully!';
  RAISE NOTICE 'Your app should now be significantly faster.';
  RAISE NOTICE 'Group orders should work more reliably.';
  RAISE NOTICE 'Categories should persist better.';
  RAISE NOTICE 'Product caching is now optimized.';
END $$;

COMMIT;