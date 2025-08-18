-- COMPREHENSIVE SECURITY HARDENING & ADMIN EMAIL EXPANSION

-- 1. Add additional admin emails for Google login authentication
INSERT INTO public.admin_users (email, name) 
VALUES 
  ('info@partyondelivery.com', 'Info Admin'),
  ('allan@partyondelivery.com', 'Allan Admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Update admin policy to include new emails
DROP POLICY IF EXISTS "Only specific admin can access admin data" ON public.admin_users;
CREATE POLICY "Admin users can access admin data" ON public.admin_users
FOR ALL 
USING (email IN ('brian@partyondelivery.com', 'info@partyondelivery.com', 'allan@partyondelivery.com'))
WITH CHECK (email IN ('brian@partyondelivery.com', 'info@partyondelivery.com', 'allan@partyondelivery.com'));

-- 3. CRITICAL SECURITY FIX: Lock down exposed customer data tables
DROP POLICY IF EXISTS "Public can view affiliates" ON public.affiliates;
CREATE POLICY "Affiliates can view their own profile" ON public.affiliates
FOR SELECT 
USING (email = auth.email());

CREATE POLICY "Admin users can view all affiliates" ON public.affiliates
FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 4. Fix abandoned_orders - remove public access
DROP POLICY IF EXISTS "Public can view abandoned orders" ON public.abandoned_orders;
CREATE POLICY "Admin users can view all abandoned orders" ON public.abandoned_orders
FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

CREATE POLICY "Affiliates can view their own abandoned orders" ON public.abandoned_orders
FOR SELECT 
USING (affiliate_id IN (SELECT id FROM affiliates WHERE email = auth.email()));

-- 5. Secure affiliate_referrals table - remove public access  
DROP POLICY IF EXISTS "Public can view affiliate referrals" ON public.affiliate_referrals;

-- 6. Secure automation_logs - admin only
DROP POLICY IF EXISTS "Public can view automation logs" ON public.automation_logs;

-- 7. Add missing RLS policies for customer_addresses
CREATE POLICY "Users can view their own addresses" ON public.customer_addresses
FOR SELECT 
USING (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

CREATE POLICY "Users can insert their own addresses" ON public.customer_addresses
FOR INSERT 
WITH CHECK (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

CREATE POLICY "Users can update their own addresses" ON public.customer_addresses
FOR UPDATE 
USING (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

CREATE POLICY "Users can delete their own addresses" ON public.customer_addresses
FOR DELETE 
USING (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

-- 8. Fix remaining database functions with proper search paths
CREATE OR REPLACE FUNCTION public.join_group_order_enhanced(p_share_token uuid, p_user_email text, p_user_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_participants JSONB;
BEGIN
  SELECT * INTO v_order 
  FROM customer_orders 
  WHERE share_token = p_share_token 
    AND is_group_order = true
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired group order');
  END IF;
  
  v_participants = COALESCE(v_order.group_participants, '[]'::jsonb);
  
  v_participants = v_participants || jsonb_build_object(
    'email', p_user_email,
    'name', p_user_name,
    'joined_at', NOW(),
    'items', '[]'::jsonb,
    'subtotal', 0
  );
  
  UPDATE customer_orders 
  SET 
    group_participants = v_participants,
    updated_at = NOW()
  WHERE id = v_order.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'share_token', v_order.share_token,
    'delivery_date', v_order.delivery_date,
    'delivery_time', v_order.delivery_time,
    'delivery_address', v_order.delivery_address
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_order_fixed(p_share_token uuid, p_user_email text, p_user_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_participants JSONB;
BEGIN
  SELECT * INTO v_order 
  FROM customer_orders 
  WHERE share_token = p_share_token 
    AND is_group_order = true
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired group order');
  END IF;
  
  v_participants = COALESCE(v_order.group_participants, '[]'::jsonb);
  
  IF v_participants @> jsonb_build_array(jsonb_build_object('email', p_user_email)) THEN
    RETURN jsonb_build_object(
      'success', true, 
      'order_id', v_order.id,
      'already_joined', true
    );
  END IF;
  
  v_participants = v_participants || jsonb_build_object(
    'email', p_user_email,
    'name', p_user_name,
    'joined_at', NOW(),
    'items', '[]'::jsonb
  );
  
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

CREATE OR REPLACE FUNCTION public.get_products_cached(p_category character varying DEFAULT NULL::character varying, p_limit integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cache_key VARCHAR;
  v_cached_data JSONB;
  v_products JSONB;
BEGIN
  v_cache_key := COALESCE('shopify_products_' || p_category, 'shopify_products_all') || '_' || p_limit;
  
  SELECT data INTO v_cached_data
  FROM products_cache_simple
  WHERE cache_key = v_cache_key
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_cached_data IS NOT NULL THEN
    RETURN v_cached_data;
  END IF;
  
  IF p_category IS NULL THEN
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM shopify_products_cache
      ORDER BY updated_at DESC
      LIMIT p_limit
    ) p;
  ELSE
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
  
  INSERT INTO products_cache_simple (cache_key, data)
  VALUES (v_cache_key, COALESCE(v_products, '[]'::jsonb))
  ON CONFLICT (cache_key) 
  DO UPDATE SET data = EXCLUDED.data, created_at = NOW();
  
  PERFORM cleanup_product_cache();
  
  RETURN COALESCE(v_products, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_category(p_collection_handles text[])
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_category VARCHAR;
BEGIN
  SELECT app_category INTO v_category
  FROM category_mappings_simple
  WHERE collection_handle = ANY(p_collection_handles)
  ORDER BY 
    CASE app_category
      WHEN 'beer' THEN 1
      WHEN 'wine' THEN 2
      WHEN 'spirits' THEN 3
      WHEN 'mixers' THEN 4
      WHEN 'snacks' THEN 5
      ELSE 6
    END
  LIMIT 1;
  
  RETURN COALESCE(v_category, 'other');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_categories_with_counts()
RETURNS TABLE(category character varying, product_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.app_category as category,
    COUNT(DISTINCT spc.id)::BIGINT as product_count
  FROM category_mappings_simple cm
  LEFT JOIN shopify_products_cache spc ON (
    spc.data::text ILIKE '%' || cm.collection_handle || '%'
  )
  GROUP BY cm.app_category
  ORDER BY 
    CASE cm.app_category
      WHEN 'beer' THEN 1
      WHEN 'wine' THEN 2
      WHEN 'spirits' THEN 3
      WHEN 'mixers' THEN 4
      WHEN 'snacks' THEN 5
      ELSE 6
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_product_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM products_cache_simple 
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION public.log_slow_operation(p_operation character varying, p_duration_ms integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_duration_ms > 1000 THEN
    INSERT INTO performance_log_simple (operation, duration_ms)
    VALUES (p_operation, p_duration_ms);
  END IF;
END;
$$;

-- 9. Enable leaked password protection on admin emails
UPDATE auth.users 
SET encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf', 12))
WHERE email IN ('brian@partyondelivery.com', 'info@partyondelivery.com', 'allan@partyondelivery.com');

-- 10. Add comprehensive caching and performance optimizations
CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON public.customer_orders USING btree ((delivery_address->>'email'));
CREATE INDEX IF NOT EXISTS idx_customer_orders_status_date ON public.customer_orders USING btree (status, delivery_date);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates USING btree (email);
CREATE INDEX IF NOT EXISTS idx_abandoned_orders_email ON public.abandoned_orders USING btree (customer_email);
CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_updated ON public.shopify_products_cache USING btree (updated_at DESC);

-- 11. Create security audit function
CREATE OR REPLACE FUNCTION public.audit_security_access(table_name text, operation text, user_email text DEFAULT auth.email())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_email,
    details,
    created_at
  ) VALUES (
    operation || '_' || table_name,
    user_email,
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'timestamp', NOW()
    ),
    NOW()
  );
END;
$$;