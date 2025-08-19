-- EMERGENCY SECURITY PATCH: Fix RLS policies for all publicly accessible tables
-- This addresses critical security vulnerabilities where customer and admin data is exposed

-- 1. Fix admin_users table - CRITICAL: Admin credentials are exposed!
DROP POLICY IF EXISTS "admin_users_self_only" ON admin_users;
CREATE POLICY "admin_users_self_access" ON admin_users
  FOR ALL USING (
    email = auth.email() AND 
    email IN (SELECT email FROM admin_users WHERE email = auth.email())
  );

-- 2. Fix abandoned_orders table - Original issue reported
DROP POLICY IF EXISTS "abandoned_orders_admin_access" ON abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_service_access" ON abandoned_orders;

CREATE POLICY "abandoned_orders_admin_only" ON abandoned_orders
  FOR SELECT USING (is_admin_user_safe());

CREATE POLICY "abandoned_orders_admin_manage" ON abandoned_orders  
  FOR ALL USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "abandoned_orders_service_role" ON abandoned_orders
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Fix customer_orders table - Customer order history exposed
DROP POLICY IF EXISTS "customer_orders_owner_access" ON customer_orders;
DROP POLICY IF EXISTS "customer_orders_admin_access" ON customer_orders;  
DROP POLICY IF EXISTS "customer_orders_service_manage" ON customer_orders;

CREATE POLICY "customer_orders_customer_access" ON customer_orders
  FOR SELECT USING (
    auth.email() = (delivery_address->>'email') OR 
    is_admin_user_safe()
  );

CREATE POLICY "customer_orders_admin_manage" ON customer_orders
  FOR ALL USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "customer_orders_service_role" ON customer_orders
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Fix customers table - Complete customer database exposed  
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Customers can manage own data" ON customers;

CREATE POLICY "customers_own_data" ON customers
  FOR ALL USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "customers_admin_access" ON customers
  FOR SELECT USING (is_admin_user_safe());

CREATE POLICY "customers_service_role" ON customers
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Fix customer_profiles table
DROP POLICY IF EXISTS "Users manage own profile" ON customer_profiles;

CREATE POLICY "customer_profiles_own_data" ON customer_profiles
  FOR ALL USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "customer_profiles_admin_view" ON customer_profiles  
  FOR SELECT USING (is_admin_user_safe());

-- 6. Fix delivery_addresses table - Address data exposed
DROP POLICY IF EXISTS "Users manage own addresses" ON delivery_addresses;

CREATE POLICY "delivery_addresses_own_data" ON delivery_addresses
  FOR ALL USING (customer_email = auth.email())
  WITH CHECK (customer_email = auth.email());

CREATE POLICY "delivery_addresses_admin_view" ON delivery_addresses
  FOR SELECT USING (is_admin_user_safe());

-- 7. Fix affiliates table - Keep existing secure policies but verify
DROP POLICY IF EXISTS "affiliates_self_access" ON affiliates;
DROP POLICY IF EXISTS "affiliates_self_update" ON affiliates;
DROP POLICY IF EXISTS "affiliates_admin_manage" ON affiliates;
DROP POLICY IF EXISTS "affiliates_service_manage" ON affiliates;

CREATE POLICY "affiliates_own_data" ON affiliates
  FOR SELECT USING (email = auth.email());

CREATE POLICY "affiliates_own_update" ON affiliates
  FOR UPDATE USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "affiliates_admin_manage" ON affiliates
  FOR ALL USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "affiliates_service_role" ON affiliates
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');