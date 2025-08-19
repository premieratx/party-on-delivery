-- SECURITY FIX: Remove all public access and implement strict policies
-- Fix the critical security vulnerabilities step by step

-- 1. Get all current policies and drop them cleanly
DO $$ 
BEGIN
  -- Drop all existing policies for abandoned_orders
  DROP POLICY IF EXISTS "abandoned_orders_admin_access" ON abandoned_orders;
  DROP POLICY IF EXISTS "abandoned_orders_service_access" ON abandoned_orders;
  DROP POLICY IF EXISTS "abandoned_orders_admin_only" ON abandoned_orders;
  DROP POLICY IF EXISTS "abandoned_orders_admin_manage" ON abandoned_orders;  
  DROP POLICY IF EXISTS "abandoned_orders_service_role" ON abandoned_orders;

  -- Drop policies for customer_orders
  DROP POLICY IF EXISTS "customer_orders_owner_access" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_admin_access" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_service_manage" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_customer_access" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_admin_manage" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_service_role" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_customer_own" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_admin_all" ON customer_orders;
  DROP POLICY IF EXISTS "customer_orders_service_all" ON customer_orders;

  -- Drop policies for admin_users  
  DROP POLICY IF EXISTS "admin_users_self_only" ON admin_users;
  DROP POLICY IF EXISTS "admin_users_self_access" ON admin_users;
END $$;

-- 2. Revoke public access completely
REVOKE ALL ON abandoned_orders FROM PUBLIC, anon;
REVOKE ALL ON customer_orders FROM PUBLIC, anon;
REVOKE ALL ON admin_users FROM PUBLIC, anon;

-- 3. Create new secure policies

-- Abandoned Orders: ONLY admins and service role can access
CREATE POLICY "secure_abandoned_orders_admin" ON abandoned_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "secure_abandoned_orders_service" ON abandoned_orders  
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Customer Orders: Customers see their own, admins see all, service role manages
CREATE POLICY "secure_customer_orders_own" ON customer_orders
  FOR SELECT TO authenticated  
  USING (auth.email() = (delivery_address->>'email'));

CREATE POLICY "secure_customer_orders_admin" ON customer_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "secure_customer_orders_service" ON customer_orders
  FOR ALL TO service_role
  USING (true) 
  WITH CHECK (true);

-- Admin Users: Only authenticated users can see their own record
CREATE POLICY "secure_admin_users_self" ON admin_users
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Log the security fix
INSERT INTO security_audit_log (event_type, user_email, details, created_at)
VALUES (
  'emergency_security_patch_applied',
  'system',
  jsonb_build_object(
    'action', 'comprehensive_rls_lockdown',
    'tables_secured', array['abandoned_orders', 'customer_orders', 'admin_users'],
    'timestamp', now()
  ),
  now()
);