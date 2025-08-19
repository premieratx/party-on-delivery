-- COMPREHENSIVE SECURITY LOCKDOWN - PERMANENT FIX
-- This migration addresses all 12 security vulnerabilities found in the security scan

-- 1. First, revoke ALL public access from ALL sensitive tables
DO $$ 
DECLARE
    table_record RECORD;
    sensitive_tables TEXT[] := ARRAY[
        'abandoned_orders', 'admin_users', 'affiliates', 'customer_profiles', 
        'delivery_addresses', 'customer_orders', 'orders', 'customers', 
        'quotes', 'telegram_users', 'commission_payouts', 'affiliate_referrals',
        'admin_notifications', 'user_preferences', 'vouchers', 'voucher_usage',
        'testing_sessions', 'user_session_progress', 'testing_issues',
        'system_health', 'security_audit_log', 'saved_carts', 'recent_orders',
        'order_drafts', 'app_state_snapshots'
    ];
BEGIN
    -- Revoke public access from all sensitive tables
    FOR table_record IN 
        SELECT unnest(sensitive_tables) AS table_name
    LOOP
        -- Skip if table doesn't exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_record.table_name AND table_schema = 'public') THEN
            EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_record.table_name);
            RAISE NOTICE 'Revoked public access from %', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- 2. Drop all existing policies to start fresh
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies and drop them
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('abandoned_orders', 'admin_users', 'affiliates', 'customer_profiles', 
                         'delivery_addresses', 'customer_orders', 'orders', 'customers', 'quotes', 'telegram_users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- 3. Ensure RLS is enabled on all sensitive tables
ALTER TABLE abandoned_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes' AND table_schema = 'public') THEN
        ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_users' AND table_schema = 'public') THEN
        ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Create comprehensive, secure policies

-- ABANDONED ORDERS: Only admins and service role
CREATE POLICY "secure_abandoned_orders_admin" ON abandoned_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "secure_abandoned_orders_service" ON abandoned_orders  
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ADMIN USERS: Only self-access
CREATE POLICY "secure_admin_users_self" ON admin_users
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- AFFILIATES: Own data + admin access
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

-- CUSTOMER PROFILES: Own data + admin view
CREATE POLICY "customer_profiles_own_data" ON customer_profiles
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "customer_profiles_admin_view" ON customer_profiles
  FOR SELECT TO authenticated
  USING (is_admin_user_safe());

-- DELIVERY ADDRESSES: Own data + admin view
CREATE POLICY "delivery_addresses_own_data" ON delivery_addresses
  FOR ALL TO authenticated
  USING (customer_email = auth.email())
  WITH CHECK (customer_email = auth.email());

CREATE POLICY "delivery_addresses_admin_view" ON delivery_addresses
  FOR SELECT TO authenticated
  USING (is_admin_user_safe());

-- CUSTOMER ORDERS: Own orders + admin access
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

-- CUSTOMERS: Own data + admin view + service access
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

-- 5. Secure additional tables if they exist
DO $$
BEGIN
    -- ORDERS table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        CREATE POLICY "orders_admin_only" ON orders
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "orders_service_access" ON orders
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;

    -- QUOTES table  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes' AND table_schema = 'public') THEN
        CREATE POLICY "quotes_admin_only" ON quotes
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "quotes_service_access" ON quotes
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;

    -- TELEGRAM USERS table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_users' AND table_schema = 'public') THEN
        CREATE POLICY "telegram_users_admin_only" ON telegram_users
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
    END IF;
END $$;

-- 6. Fix the extension in public schema issue
-- Move pg_net extension out of public schema
DO $$
BEGIN
    -- Check if pg_net exists in public schema
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Create extensions schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS extensions;
        
        -- Move pg_net to extensions schema
        ALTER EXTENSION pg_net SET SCHEMA extensions;
        
        -- Log the fix
        INSERT INTO security_audit_log (event_type, user_email, details, created_at)
        VALUES (
            'extension_schema_security_fix',
            'system',
            jsonb_build_object(
                'action', 'moved_pg_net_from_public_to_extensions_schema',
                'extension', 'pg_net',
                'from_schema', 'public',
                'to_schema', 'extensions'
            ),
            now()
        );
    END IF;
END $$;

-- 7. Log comprehensive security fix
INSERT INTO security_audit_log (event_type, user_email, details, created_at)
VALUES (
    'comprehensive_security_lockdown_complete',
    'system',
    jsonb_build_object(
        'action', 'permanent_security_fix_all_vulnerabilities',
        'tables_secured', array[
            'abandoned_orders', 'admin_users', 'affiliates', 'customer_profiles',
            'delivery_addresses', 'customer_orders', 'customers', 'orders', 'quotes', 'telegram_users'
        ],
        'vulnerabilities_fixed', 12,
        'rls_enabled', true,
        'public_access_revoked', true,
        'extension_schema_fixed', true,
        'timestamp', now()
    ),
    now()
);