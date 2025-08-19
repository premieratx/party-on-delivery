-- COMPREHENSIVE SECURITY LOCKDOWN - Phase 2
-- Implement strict RLS policies and remove public access entirely

-- First, revoke ALL public access from ALL sensitive tables
REVOKE ALL ON abandoned_orders FROM PUBLIC;
REVOKE ALL ON abandoned_orders FROM anon;
REVOKE ALL ON abandoned_orders FROM authenticated;

REVOKE ALL ON customer_orders FROM PUBLIC;
REVOKE ALL ON customer_orders FROM anon;
REVOKE ALL ON customer_orders FROM authenticated;

REVOKE ALL ON customers FROM PUBLIC;
REVOKE ALL ON customers FROM anon;
REVOKE ALL ON customers FROM authenticated;

REVOKE ALL ON admin_users FROM PUBLIC;
REVOKE ALL ON admin_users FROM anon;
REVOKE ALL ON admin_users FROM authenticated;

REVOKE ALL ON affiliates FROM PUBLIC;
REVOKE ALL ON affiliates FROM anon;
REVOKE ALL ON affiliates FROM authenticated;

REVOKE ALL ON customer_profiles FROM PUBLIC;
REVOKE ALL ON customer_profiles FROM anon;
REVOKE ALL ON customer_profiles FROM authenticated;

REVOKE ALL ON delivery_addresses FROM PUBLIC;
REVOKE ALL ON delivery_addresses FROM anon;
REVOKE ALL ON delivery_addresses FROM authenticated;

REVOKE ALL ON affiliate_referrals FROM PUBLIC;
REVOKE ALL ON affiliate_referrals FROM anon;
REVOKE ALL ON affiliate_referrals FROM authenticated;

REVOKE ALL ON affiliate_order_tracking FROM PUBLIC;
REVOKE ALL ON affiliate_order_tracking FROM anon;
REVOKE ALL ON affiliate_order_tracking FROM authenticated;

-- Grant specific access only to service_role for all operations
GRANT ALL ON abandoned_orders TO service_role;
GRANT ALL ON customer_orders TO service_role;
GRANT ALL ON customers TO service_role;
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON affiliates TO service_role;
GRANT ALL ON customer_profiles TO service_role;
GRANT ALL ON delivery_addresses TO service_role;
GRANT ALL ON affiliate_referrals TO service_role;
GRANT ALL ON affiliate_order_tracking TO service_role;

-- Re-create restrictive RLS policies for authenticated users only
-- These will work with the revoked public access

-- Abandoned Orders: Only admins and service role
DROP POLICY IF EXISTS "abandoned_orders_admin_only" ON abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_admin_manage" ON abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_service_role" ON abandoned_orders;

CREATE POLICY "abandoned_orders_admin_access" ON abandoned_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "abandoned_orders_service_access" ON abandoned_orders
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Customer Orders: Customers see own, admins see all
DROP POLICY IF EXISTS "customer_orders_customer_access" ON customer_orders;
DROP POLICY IF EXISTS "customer_orders_admin_manage" ON customer_orders;
DROP POLICY IF EXISTS "customer_orders_service_role" ON customer_orders;

CREATE POLICY "customer_orders_customer_own" ON customer_orders
  FOR SELECT TO authenticated
  USING (auth.email() = (delivery_address->>'email'));

CREATE POLICY "customer_orders_admin_all" ON customer_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "customer_orders_service_all" ON customer_orders
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin Users: Only self access
DROP POLICY IF EXISTS "admin_users_self_access" ON admin_users;

CREATE POLICY "admin_users_self_only" ON admin_users
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Customers: Own data only, admins can view
DROP POLICY IF EXISTS "customers_own_data" ON customers;
DROP POLICY IF EXISTS "customers_admin_access" ON customers; 
DROP POLICY IF EXISTS "customers_service_role" ON customers;

CREATE POLICY "customers_own_access" ON customers
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "customers_admin_view" ON customers
  FOR SELECT TO authenticated
  USING (is_admin_user_safe());

CREATE POLICY "customers_service_all" ON customers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Lock down all other tables similarly
-- Affiliates: Self access only
DROP POLICY IF EXISTS "affiliates_own_data" ON affiliates;
DROP POLICY IF EXISTS "affiliates_own_update" ON affiliates;
DROP POLICY IF EXISTS "affiliates_admin_manage" ON affiliates;
DROP POLICY IF EXISTS "affiliates_service_role" ON affiliates;

CREATE POLICY "affiliates_own_access" ON affiliates
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "affiliates_admin_access" ON affiliates
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "affiliates_service_access" ON affiliates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);