-- Fix critical security issues by improving RLS policies

-- 1. Fix abandoned_orders table - remove overly permissive policies
DROP POLICY IF EXISTS "abandoned_orders_service_strict" ON public.abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_admin_strict" ON public.abandoned_orders;

-- Create more restrictive policies for abandoned_orders
CREATE POLICY "abandoned_orders_admin_access_only" 
ON public.abandoned_orders 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "abandoned_orders_service_role_only" 
ON public.abandoned_orders 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Fix affiliates table - remove public access
DROP POLICY IF EXISTS "affiliates_admin_access" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_service_role" ON public.affiliates;

-- Create secure affiliate policies (only self and admin access)
CREATE POLICY "affiliates_self_access_only" 
ON public.affiliates 
FOR ALL 
USING ((email = auth.email()) OR is_admin_user_safe())
WITH CHECK ((email = auth.email()) OR is_admin_user_safe());

CREATE POLICY "affiliates_service_role_access" 
ON public.affiliates 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3. Fix admin_users table - secure completely
DROP POLICY IF EXISTS "admin_users_self_only" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_self_strict" ON public.admin_users;

-- Create ultra-secure admin policies
CREATE POLICY "admin_users_self_only_secure" 
ON public.admin_users 
FOR ALL 
USING (email = auth.email() AND is_admin_user_safe())
WITH CHECK (email = auth.email() AND is_admin_user_safe());

-- 4. Fix customer_orders - ensure only customer or admin access
DROP POLICY IF EXISTS "customer_orders_enhanced_access" ON public.customer_orders;

CREATE POLICY "customer_orders_secure_access" 
ON public.customer_orders 
FOR ALL 
USING (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR 
  ((delivery_address ->> 'email') = auth.email())
)
WITH CHECK (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR 
  ((delivery_address ->> 'email') = auth.email())
);

-- 5. Fix customers table
DROP POLICY IF EXISTS "customers_service_and_admin_access" ON public.customers;

CREATE POLICY "customers_secure_access" 
ON public.customers 
FOR ALL 
USING (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR 
  (email = auth.email())
)
WITH CHECK (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR 
  (email = auth.email())
);