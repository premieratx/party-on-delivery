-- Fix get_dashboard_data to align with current schema and avoid uuid/bigint comparisons
-- Also add explicit EXECUTE grants to prevent 404 due to permissions

CREATE OR REPLACE FUNCTION public.get_dashboard_data_fixed(
  dashboard_type text,
  user_email text DEFAULT NULL::text,
  affiliate_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_data jsonb;
  customer_data jsonb;
  affiliate_data jsonb;
  v_user_email text := user_email;
  v_affiliate_code text := affiliate_code;
BEGIN
  -- Admin Dashboard Data (no uuid/bigint joins)
  IF dashboard_type = 'admin' THEN
    WITH admin_stats AS (
      SELECT 
        COALESCE(SUM(co.total_amount), 0) AS total_revenue,
        COUNT(DISTINCT co.id) AS total_orders,
        (SELECT COUNT(*) FROM customers) AS total_customers,
        1052 AS total_products
      FROM customer_orders co
      WHERE co.status != 'cancelled'
    ),
    recent_orders AS (
      SELECT 
        co.*,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone
      FROM customer_orders co
      LEFT JOIN customers c 
        ON c.email = co.delivery_address->>'email'
      ORDER BY co.created_at DESC
      LIMIT 50
    )
    SELECT jsonb_build_object(
      'totalRevenue', admin_stats.total_revenue,
      'totalOrders', admin_stats.total_orders,
      'totalCustomers', admin_stats.total_customers,
      'totalProducts', admin_stats.total_products,
      'activeAffiliates', (SELECT COUNT(*) FROM affiliates WHERE status = 'active'),
      'pendingCommissions', COALESCE((SELECT SUM(commission_unpaid) FROM affiliates WHERE status = 'active'), 0),
      'orders', COALESCE((SELECT jsonb_agg(row_to_json(ro.*)) FROM recent_orders ro), '[]'::jsonb),
      'customers', COALESCE((SELECT jsonb_agg(row_to_json(c.*)) FROM (SELECT * FROM customers ORDER BY created_at DESC LIMIT 100) c), '[]'::jsonb),
      'affiliateReferrals', COALESCE((SELECT jsonb_agg(row_to_json(ar.*)) FROM (SELECT * FROM affiliate_referrals ORDER BY order_date DESC LIMIT 100) ar), '[]'::jsonb)
    )
    INTO admin_data
    FROM admin_stats;
    
    RETURN jsonb_build_object('success', true, 'data', admin_data);
  END IF;

  -- Customer Dashboard Data (filter by email present in orders)
  IF dashboard_type = 'customer' AND v_user_email IS NOT NULL THEN
    WITH customer_orders_cte AS (
      SELECT *
      FROM customer_orders
      WHERE delivery_address->>'email' = v_user_email
      ORDER BY created_at DESC
    ),
    customer_stats AS (
      SELECT 
        COALESCE(SUM(co.total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders
      FROM customer_orders_cte co
    ),
    customer_info AS (
      SELECT *
      FROM customers
      WHERE email = v_user_email
      LIMIT 1
    )
    SELECT jsonb_build_object(
      'totalRevenue', COALESCE((SELECT total_revenue FROM customer_stats), 0),
      'totalOrders', COALESCE((SELECT total_orders FROM customer_stats), 0),
      'orders', COALESCE((SELECT jsonb_agg(row_to_json(co.*)) FROM customer_orders_cte co), '[]'::jsonb),
      'customers', COALESCE((SELECT jsonb_agg(row_to_json(ci.*)) FROM customer_info ci), '[]'::jsonb)
    )
    INTO customer_data;

    RETURN jsonb_build_object('success', true, 'data', customer_data);
  END IF;

  -- Affiliate Dashboard Data (fix parameter naming conflict)
  IF dashboard_type = 'affiliate' AND (v_user_email IS NOT NULL OR v_affiliate_code IS NOT NULL) THEN
    WITH affiliate_info AS (
      SELECT * FROM affiliates 
      WHERE (v_user_email IS NOT NULL AND email = v_user_email)
         OR (v_affiliate_code IS NOT NULL AND affiliate_code = v_affiliate_code)
      LIMIT 1
    ),
    affiliate_referrals_cte AS (
      SELECT ar.*
      FROM affiliate_referrals ar
      JOIN affiliate_info ai ON ar.affiliate_id = ai.id
      ORDER BY ar.order_date DESC
    ),
    affiliate_orders_cte AS (
      SELECT co.*
      FROM customer_orders co
      JOIN affiliate_info ai ON co.affiliate_id = ai.id
      ORDER BY co.created_at DESC
    ),
    affiliate_stats AS (
      SELECT 
        COALESCE(SUM(ar.subtotal), 0) AS total_revenue,
        COUNT(*) AS total_orders,
        COALESCE(SUM(ar.commission_amount) FILTER (WHERE ar.paid_out = false), 0) AS pending_commissions
      FROM affiliate_referrals_cte ar
    )
    SELECT jsonb_build_object(
      'totalRevenue', COALESCE((SELECT total_revenue FROM affiliate_stats), 0),
      'totalOrders', COALESCE((SELECT total_orders FROM affiliate_stats), 0),
      'pendingCommissions', COALESCE((SELECT pending_commissions FROM affiliate_stats), 0),
      'affiliateReferrals', COALESCE((SELECT jsonb_agg(row_to_json(r.*)) FROM affiliate_referrals_cte r), '[]'::jsonb),
      'orders', COALESCE((SELECT jsonb_agg(row_to_json(o.*)) FROM affiliate_orders_cte o), '[]'::jsonb)
    )
    INTO affiliate_data;

    IF affiliate_data IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Affiliate not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'data', affiliate_data);
  END IF;

  -- Default case
  RETURN jsonb_build_object('success', false, 'error', 'Invalid dashboard type or missing parameters');
END;
$function$;

-- Ensure wrapper delegates to the fixed function
CREATE OR REPLACE FUNCTION public.get_dashboard_data(
  dashboard_type text,
  user_email text DEFAULT NULL::text,
  affiliate_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN get_dashboard_data_fixed(dashboard_type, user_email, affiliate_code);
END;
$function$;

-- Explicitly grant execute to API roles
GRANT EXECUTE ON FUNCTION public.get_dashboard_data(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data_fixed(text, text, text) TO anon, authenticated, service_role;