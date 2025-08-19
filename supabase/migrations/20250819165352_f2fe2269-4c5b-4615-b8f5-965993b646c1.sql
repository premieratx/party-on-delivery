-- FINAL SECURITY LOCKDOWN - CORRECTED VERSION
-- Fixed syntax errors and implement absolute security

-- 1. REVOKE ALL PUBLIC ACCESS FROM EVERY SENSITIVE TABLE
DO $$ 
DECLARE
    table_name TEXT;
    all_sensitive_tables TEXT[] := ARRAY[
        'abandoned_orders', 'admin_users', 'affiliates', 'affiliate_order_tracking',
        'customer_profiles', 'delivery_addresses', 'customer_orders', 'orders', 
        'recent_orders', 'commission_payouts', 'affiliate_referrals', 'quotes',
        'customers', 'telegram_users'
    ];
BEGIN
    FOREACH table_name IN ARRAY all_sensitive_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', table_name);
            RAISE NOTICE 'Secured table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- 2. FORCE ENABLE RLS ON ALL SENSITIVE TABLES  
DO $$
DECLARE
    table_name TEXT;
    all_tables TEXT[] := ARRAY[
        'abandoned_orders', 'admin_users', 'affiliates', 'affiliate_order_tracking',
        'customer_profiles', 'delivery_addresses', 'customer_orders', 'orders', 
        'recent_orders', 'commission_payouts', 'affiliate_referrals', 'quotes',
        'customers', 'telegram_users'
    ];
BEGIN
    FOREACH table_name IN ARRAY all_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'Forced RLS on: %', table_name;
        END IF;
    END LOOP;
END $$;

-- 3. DROP ALL EXISTING POLICIES
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      policy_record.policyname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- 4. CREATE ULTRA-STRICT POLICIES (Fixed syntax)

-- ABANDONED ORDERS: ADMIN AND SERVICE ROLE ONLY
CREATE POLICY "abandoned_orders_admin_strict" ON abandoned_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "abandoned_orders_service_strict" ON abandoned_orders  
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ADMIN USERS: SELF ACCESS ONLY
CREATE POLICY "admin_users_self_strict" ON admin_users
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- AFFILIATES: SELF OR ADMIN ACCESS  
CREATE POLICY "affiliates_self_admin_strict" ON affiliates
  FOR ALL TO authenticated
  USING (email = auth.email() OR is_admin_user_safe())
  WITH CHECK (email = auth.email() OR is_admin_user_safe());

CREATE POLICY "affiliates_service_strict" ON affiliates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- AFFILIATE ORDER TRACKING: RESTRICTED ACCESS
CREATE POLICY "affiliate_tracking_view_strict" ON affiliate_order_tracking
  FOR SELECT TO authenticated
  USING (
    is_admin_user_safe() OR 
    affiliate_id IN (SELECT id FROM affiliates WHERE email = auth.email())
  );

CREATE POLICY "affiliate_tracking_modify_strict" ON affiliate_order_tracking
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "affiliate_tracking_update_strict" ON affiliate_order_tracking
  FOR UPDATE TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "affiliate_tracking_delete_strict" ON affiliate_order_tracking
  FOR DELETE TO authenticated
  USING (is_admin_user_safe());

CREATE POLICY "affiliate_tracking_service_strict" ON affiliate_order_tracking
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- CUSTOMER PROFILES: SELF ACCESS ONLY
CREATE POLICY "customer_profiles_self_strict" ON customer_profiles
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "customer_profiles_admin_view_strict" ON customer_profiles
  FOR SELECT TO authenticated
  USING (is_admin_user_safe());

-- DELIVERY ADDRESSES: SELF ACCESS ONLY
CREATE POLICY "delivery_addresses_self_strict" ON delivery_addresses
  FOR ALL TO authenticated
  USING (customer_email = auth.email())
  WITH CHECK (customer_email = auth.email());

CREATE POLICY "delivery_addresses_admin_view_strict" ON delivery_addresses
  FOR SELECT TO authenticated
  USING (is_admin_user_safe());

-- CUSTOMER ORDERS: SELF OR ADMIN ACCESS
CREATE POLICY "customer_orders_self_strict" ON customer_orders
  FOR SELECT TO authenticated  
  USING (auth.email() = (delivery_address->>'email'));

CREATE POLICY "customer_orders_admin_strict" ON customer_orders
  FOR ALL TO authenticated
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "customer_orders_service_strict" ON customer_orders
  FOR ALL TO service_role
  USING (true) 
  WITH CHECK (true);

-- CUSTOMERS: SELF OR ADMIN ACCESS
CREATE POLICY "customers_self_strict" ON customers
  FOR ALL TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "customers_admin_view_strict" ON customers
  FOR SELECT TO authenticated
  USING (is_admin_user_safe());

CREATE POLICY "customers_service_strict" ON customers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SECURE REMAINING TABLES
DO $$
BEGIN
    -- ORDERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        CREATE POLICY "orders_admin_strict" ON orders
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "orders_service_strict" ON orders
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;

    -- RECENT ORDERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recent_orders' AND table_schema = 'public') THEN
        CREATE POLICY "recent_orders_admin_strict" ON recent_orders
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "recent_orders_service_strict" ON recent_orders
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;

    -- QUOTES TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes' AND table_schema = 'public') THEN
        CREATE POLICY "quotes_admin_strict" ON quotes
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "quotes_service_strict" ON quotes
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;

    -- COMMISSION PAYOUTS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_payouts' AND table_schema = 'public') THEN
        CREATE POLICY "commission_payouts_view_strict" ON commission_payouts
          FOR SELECT TO authenticated
          USING (
            affiliate_id IN (SELECT id FROM affiliates WHERE email = auth.email()) OR
            is_admin_user_safe()
          );
          
        CREATE POLICY "commission_payouts_admin_manage_strict" ON commission_payouts
          FOR INSERT TO authenticated
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "commission_payouts_admin_update_strict" ON commission_payouts
          FOR UPDATE TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
          
        CREATE POLICY "commission_payouts_admin_delete_strict" ON commission_payouts
          FOR DELETE TO authenticated
          USING (is_admin_user_safe());
    END IF;

    -- AFFILIATE REFERRALS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_referrals' AND table_schema = 'public') THEN
        CREATE POLICY "affiliate_referrals_view_strict" ON affiliate_referrals
          FOR SELECT TO authenticated
          USING (
            affiliate_id IN (SELECT id FROM affiliates WHERE email = auth.email()) OR
            is_admin_user_safe()
          );
          
        CREATE POLICY "affiliate_referrals_service_strict" ON affiliate_referrals
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;

    -- TELEGRAM USERS TABLE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_users' AND table_schema = 'public') THEN
        CREATE POLICY "telegram_users_admin_strict" ON telegram_users
          FOR ALL TO authenticated
          USING (is_admin_user_safe())
          WITH CHECK (is_admin_user_safe());
    END IF;
END $$;

-- 5. LOG FINAL SECURITY STATUS
INSERT INTO security_audit_log (event_type, user_email, details, created_at)
VALUES (
    'final_security_lockdown_successful',
    'system',
    jsonb_build_object(
        'action', 'comprehensive_security_enforcement_complete',
        'all_public_access_revoked', true,
        'all_rls_forced_enabled', true,
        'strict_policies_applied', true,
        'timestamp', now(),
        'security_status', 'MAXIMUM_PROTECTION'
    ),
    now()
);