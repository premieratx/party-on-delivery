-- Fix security issues from the new tables
BEGIN;

-- Enable RLS on new tables
ALTER TABLE products_cache_simple ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mappings_simple ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_log_simple ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for products_cache_simple
CREATE POLICY "Anyone can read product cache" ON products_cache_simple
  FOR SELECT USING (true);

CREATE POLICY "System can manage product cache" ON products_cache_simple
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add RLS policies for category_mappings_simple  
CREATE POLICY "Anyone can read category mappings" ON category_mappings_simple
  FOR SELECT USING (true);

CREATE POLICY "System can manage category mappings" ON category_mappings_simple
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add RLS policies for performance_log_simple
CREATE POLICY "System can manage performance logs" ON performance_log_simple
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION join_group_order_fixed(
  p_share_token UUID,
  p_user_email TEXT,
  p_user_name TEXT
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION cleanup_product_cache() 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM products_cache_simple 
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION get_products_cached(
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- Try to filter by collection_id or data containing category info
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM shopify_products_cache
      WHERE data::text ILIKE '%' || p_category || '%'
         OR title ILIKE '%' || p_category || '%'
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
$$;

CREATE OR REPLACE FUNCTION log_slow_operation(
  p_operation VARCHAR,
  p_duration_ms INTEGER
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_duration_ms > 1000 THEN -- Log operations over 1 second
    INSERT INTO performance_log_simple (operation, duration_ms)
    VALUES (p_operation, p_duration_ms);
  END IF;
END;
$$;

COMMIT;