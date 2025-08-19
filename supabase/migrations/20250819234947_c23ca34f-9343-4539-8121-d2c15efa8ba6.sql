-- Fix critical security vulnerabilities by implementing proper RLS policies

-- 1. Fix abandoned_orders table
DROP POLICY IF EXISTS "Admins can view all abandoned orders" ON public.abandoned_orders;
CREATE POLICY "Admins can view all abandoned orders" 
ON public.abandoned_orders FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 2. Fix affiliates table 
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view their own data" ON public.affiliates;
CREATE POLICY "Admins can manage affiliates" 
ON public.affiliates FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

CREATE POLICY "Affiliates can view their own data" 
ON public.affiliates FOR SELECT
TO authenticated
USING (email = auth.email());

-- 3. Fix automation_logs table
DROP POLICY IF EXISTS "Admins can view automation logs" ON public.automation_logs;
CREATE POLICY "Admins can view automation logs" 
ON public.automation_logs FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 4. Fix cart_sessions table
DROP POLICY IF EXISTS "Users can manage their own cart sessions" ON public.cart_sessions;
DROP POLICY IF EXISTS "Admins can view all cart sessions" ON public.cart_sessions;
CREATE POLICY "Users can manage their own cart sessions" 
ON public.cart_sessions FOR ALL
TO authenticated
USING (user_email = auth.email());

CREATE POLICY "Admins can view all cart sessions" 
ON public.cart_sessions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 5. Fix customer_orders table 
DROP POLICY IF EXISTS "Users can view their own orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.customer_orders;
CREATE POLICY "Users can view their own orders" 
ON public.customer_orders FOR SELECT
TO authenticated
USING (
  delivery_address->>'email' = auth.email() 
  OR customer_id IN (SELECT id FROM customers WHERE email = auth.email())
);

CREATE POLICY "Admins can manage all orders" 
ON public.customer_orders FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 6. Fix customer_profiles table
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.customer_profiles;
CREATE POLICY "Users can manage their own profile" 
ON public.customer_profiles FOR ALL
TO authenticated
USING (email = auth.email());

CREATE POLICY "Admins can view all profiles" 
ON public.customer_profiles FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 7. Fix customers table
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Users can view their own customer data" 
ON public.customers FOR ALL
TO authenticated
USING (email = auth.email());

CREATE POLICY "Admins can view all customers" 
ON public.customers FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 8. Fix delivery_addresses table
DROP POLICY IF EXISTS "Users can manage their delivery addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Admins can view all delivery addresses" ON public.delivery_addresses;
CREATE POLICY "Users can manage their delivery addresses" 
ON public.delivery_addresses FOR ALL
TO authenticated
USING (customer_email = auth.email());

CREATE POLICY "Admins can view all delivery addresses" 
ON public.delivery_addresses FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 9. Fix quotes table
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
CREATE POLICY "Users can view their own quotes" 
ON public.quotes FOR ALL
TO authenticated
USING (customer_email = auth.email());

CREATE POLICY "Admins can view all quotes" 
ON public.quotes FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 10. Ensure admin_users table is properly secured
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
CREATE POLICY "Admins can manage admin users" 
ON public.admin_users FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()));

-- 11. Security audit logging
INSERT INTO public.security_audit_log (event_type, user_email, details, created_at)
VALUES ('critical_rls_policies_implemented', 'system', 
  jsonb_build_object(
    'tables_secured', ARRAY[
      'abandoned_orders', 'affiliates', 'automation_logs', 'cart_sessions',
      'customer_orders', 'customer_profiles', 'customers', 'delivery_addresses', 
      'quotes', 'admin_users'
    ],
    'timestamp', now()
  ), now());