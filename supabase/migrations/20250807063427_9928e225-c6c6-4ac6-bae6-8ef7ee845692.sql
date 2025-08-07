-- Update get-dashboard-data function to provide real data for all dashboard types

CREATE OR REPLACE FUNCTION get_dashboard_data_fixed(dashboard_type text, user_email text DEFAULT NULL, affiliate_code text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  admin_data jsonb;
  customer_data jsonb;
  affiliate_data jsonb;
BEGIN
  -- Admin Dashboard Data
  IF dashboard_type = 'admin' THEN
    WITH admin_stats AS (
      SELECT 
        COALESCE(SUM(co.total_amount), 0) as total_revenue,
        COUNT(DISTINCT co.id) as total_orders,
        COUNT(DISTINCT c.id) as total_customers,
        1052 as total_products -- Static count from Shopify
      FROM customer_orders co
      LEFT JOIN customers c ON co.customer_id = c.id
      WHERE co.status != 'cancelled'
    ),
    recent_orders AS (
      SELECT 
        co.*,
        c.first_name,
        c.last_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM customer_orders co
      LEFT JOIN customers c ON co.customer_id = c.id
      ORDER BY co.created_at DESC
      LIMIT 50
    ),
    affiliate_stats AS (
      SELECT 
        COUNT(*) as active_affiliates,
        COALESCE(SUM(commission_unpaid), 0) as pending_commissions
      FROM affiliates 
      WHERE status = 'active'
    )
    SELECT jsonb_build_object(
      'totalRevenue', admin_stats.total_revenue,
      'totalOrders', admin_stats.total_orders,
      'totalCustomers', admin_stats.total_customers,
      'totalProducts', admin_stats.total_products,
      'activeAffiliates', affiliate_stats.active_affiliates,
      'pendingCommissions', affiliate_stats.pending_commissions,
      'orders', (SELECT jsonb_agg(recent_orders.*) FROM recent_orders),
      'customers', (SELECT jsonb_agg(c.*) FROM customers c ORDER BY c.created_at DESC LIMIT 100),
      'affiliateReferrals', (SELECT jsonb_agg(ar.*) FROM affiliate_referrals ar ORDER BY ar.order_date DESC LIMIT 100)
    ) INTO admin_data
    FROM admin_stats, affiliate_stats;
    
    RETURN jsonb_build_object('success', true, 'data', admin_data);
  END IF;

  -- Customer Dashboard Data
  IF dashboard_type = 'customer' AND user_email IS NOT NULL THEN
    WITH customer_info AS (
      SELECT * FROM customers 
      WHERE email = user_email
      LIMIT 1
    ),
    customer_orders AS (
      SELECT co.*
      FROM customer_orders co
      LEFT JOIN customer_info ci ON co.customer_id = ci.id
      WHERE co.customer_id = (SELECT id FROM customer_info)
         OR co.delivery_address->>'email' = user_email
         OR co.session_id = ANY(
           SELECT unnest(session_tokens) 
           FROM customer_info 
           WHERE session_tokens IS NOT NULL
         )
      ORDER BY co.created_at DESC
    ),
    customer_stats AS (
      SELECT 
        COALESCE(SUM(co.total_amount), 0) as total_revenue,
        COUNT(DISTINCT co.id) as total_orders
      FROM customer_orders co
    )
    SELECT jsonb_build_object(
      'totalRevenue', customer_stats.total_revenue,
      'totalOrders', customer_stats.total_orders,
      'orders', (SELECT jsonb_agg(customer_orders.*) FROM customer_orders),
      'customers', (SELECT jsonb_agg(customer_info.*) FROM customer_info)
    ) INTO customer_data
    FROM customer_stats;
    
    RETURN jsonb_build_object('success', true, 'data', customer_data);
  END IF;

  -- Affiliate Dashboard Data
  IF dashboard_type = 'affiliate' AND (user_email IS NOT NULL OR affiliate_code IS NOT NULL) THEN
    WITH affiliate_info AS (
      SELECT * FROM affiliates 
      WHERE (user_email IS NOT NULL AND email = user_email)
         OR (affiliate_code IS NOT NULL AND affiliate_code = affiliate_code)
      LIMIT 1
    ),
    affiliate_referrals AS (
      SELECT ar.*
      FROM affiliate_referrals ar
      INNER JOIN affiliate_info ai ON ar.affiliate_id = ai.id
      ORDER BY ar.order_date DESC
    ),
    affiliate_orders AS (
      SELECT co.*
      FROM customer_orders co
      INNER JOIN affiliate_info ai ON co.affiliate_id = ai.id
      ORDER BY co.created_at DESC
    ),
    affiliate_stats AS (
      SELECT 
        COALESCE(SUM(ar.subtotal), 0) as total_revenue,
        COUNT(DISTINCT ar.id) as total_orders,
        COALESCE(SUM(ar.commission_amount) FILTER (WHERE ar.paid_out = false), 0) as pending_commissions
      FROM affiliate_referrals ar
      INNER JOIN affiliate_info ai ON ar.affiliate_id = ai.id
    )
    SELECT jsonb_build_object(
      'totalRevenue', affiliate_stats.total_revenue,
      'totalOrders', affiliate_stats.total_orders,
      'pendingCommissions', affiliate_stats.pending_commissions,
      'affiliateReferrals', (SELECT jsonb_agg(affiliate_referrals.*) FROM affiliate_referrals),
      'orders', (SELECT jsonb_agg(affiliate_orders.*) FROM affiliate_orders)
    ) INTO affiliate_data
    FROM affiliate_stats;
    
    RETURN jsonb_build_object('success', true, 'data', affiliate_data);
  END IF;

  -- Default case
  RETURN jsonb_build_object('success', false, 'error', 'Invalid dashboard type or missing parameters');
END;
$$;