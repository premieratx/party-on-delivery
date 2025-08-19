-- FINAL SECURITY LOCKDOWN: Complete the protection of the last 2 critical vulnerabilities

-- Additional tables that need protection based on security scan
REVOKE ALL ON orders FROM PUBLIC;
REVOKE ALL ON orders FROM anon; 
REVOKE ALL ON orders FROM authenticated;
GRANT ALL ON orders TO service_role;

REVOKE ALL ON quotes FROM PUBLIC;
REVOKE ALL ON quotes FROM anon;
REVOKE ALL ON quotes FROM authenticated; 
GRANT ALL ON quotes TO service_role;

REVOKE ALL ON recent_orders FROM PUBLIC;
REVOKE ALL ON recent_orders FROM anon;
REVOKE ALL ON recent_orders FROM authenticated;
GRANT ALL ON recent_orders TO service_role;

-- Create additional restrictive policies for remaining vulnerable tables
-- Orders table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE orders ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY "orders_admin_only" ON orders
      FOR ALL TO authenticated
      USING (is_admin_user_safe())
      WITH CHECK (is_admin_user_safe())';
      
    EXECUTE 'CREATE POLICY "orders_service_access" ON orders
      FOR ALL TO service_role  
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

-- Quotes table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quotes' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE quotes ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY "quotes_admin_only" ON quotes
      FOR ALL TO authenticated
      USING (is_admin_user_safe())  
      WITH CHECK (is_admin_user_safe())';
      
    EXECUTE 'CREATE POLICY "quotes_service_access" ON quotes
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

-- Recent orders table (if it exists)  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'recent_orders' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE recent_orders ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY "recent_orders_admin_only" ON recent_orders
      FOR ALL TO authenticated
      USING (is_admin_user_safe())
      WITH CHECK (is_admin_user_safe())';
      
    EXECUTE 'CREATE POLICY "recent_orders_service_access" ON recent_orders  
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

-- Ensure no default privileges grant public access to new tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- Log security improvements
INSERT INTO security_audit_log (event_type, user_email, details, created_at)
VALUES (
  'emergency_security_patch_applied',
  'system',
  jsonb_build_object(
    'action', 'revoked_public_access_from_sensitive_tables',
    'tables_secured', ARRAY['abandoned_orders', 'customer_orders', 'customers', 'admin_users', 'affiliates', 'customer_profiles', 'delivery_addresses', 'affiliate_referrals', 'affiliate_order_tracking'],
    'timestamp', now()
  ),
  now()
);