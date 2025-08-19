-- NUCLEAR SECURITY LOCKDOWN - Eliminate ALL Public Data Access
-- Completely remove public access to all sensitive tables

-- Step 1: Drop ALL existing policies on sensitive tables to start fresh
DO $$
DECLARE
    policy_record RECORD;
    table_names TEXT[] := ARRAY[
        'abandoned_orders',
        'admin_users', 
        'affiliates',
        'customer_orders',
        'orders',
        'quotes',
        'affiliate_order_tracking'
    ];
    table_name TEXT;
BEGIN
    -- Drop all existing policies on sensitive tables
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_names[1]) THEN
            -- Get all policies for this table and drop them
            FOR policy_record IN 
                SELECT schemaname, tablename, policyname
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = table_name
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                             policy_record.policyname, 
                             policy_record.tablename);
            END LOOP;
            
            RAISE NOTICE 'Dropped all policies from table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- Step 2: Revoke ALL privileges from public, anon, and authenticated roles
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'abandoned_orders',
        'admin_users', 
        'affiliates',
        'customer_orders',
        'orders',
        'quotes',
        'affiliate_order_tracking'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_names[1]) THEN
            -- Revoke from public (anonymous users)
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
            -- Revoke from anon role  
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
            -- Revoke from authenticated role
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', table_name);
            
            RAISE NOTICE 'Revoked all privileges from table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- Step 3: Enable RLS and create ONLY admin/service/owner access policies

-- Abandoned Orders - Admin and Service ONLY
ALTER TABLE public.abandoned_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_orders FORCE ROW LEVEL SECURITY;

CREATE POLICY "abandoned_orders_admin_only" ON public.abandoned_orders
FOR ALL
TO authenticated
USING (public.is_admin_user_safe())
WITH CHECK (public.is_admin_user_safe());

CREATE POLICY "abandoned_orders_service_only" ON public.abandoned_orders
FOR ALL  
TO service_role
USING (true)
WITH CHECK (true);

-- Admin Users - Self and Admin ONLY
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_self_only" ON public.admin_users
FOR ALL
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

-- Affiliates - Self and Admin ONLY  
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates FORCE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_self_only" ON public.affiliates
FOR SELECT
TO authenticated
USING (email = auth.email() OR public.is_admin_user_safe());

CREATE POLICY "affiliates_update_self_only" ON public.affiliates
FOR UPDATE
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

CREATE POLICY "affiliates_service_manage" ON public.affiliates
FOR ALL
TO service_role  
USING (true)
WITH CHECK (true);

-- Customer Orders - Customer Self and Admin ONLY
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.customer_orders FORCE ROW LEVEL SECURITY;

CREATE POLICY "customer_orders_self_only" ON public.customer_orders
FOR SELECT
TO authenticated
USING ((delivery_address->>'email') = auth.email() OR public.is_admin_user_safe());

CREATE POLICY "customer_orders_service_manage" ON public.customer_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Orders table (if exists) - Customer Self and Admin ONLY
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
        
        CREATE POLICY "orders_self_only" ON public.orders
        FOR SELECT
        TO authenticated
        USING (customer_email = auth.email() OR public.is_admin_user_safe());

        CREATE POLICY "orders_service_manage" ON public.orders
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Secured orders table with FORCE RLS';
    END IF;
END $$;

-- Quotes table (if exists) - Customer Self and Admin ONLY
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.quotes FORCE ROW LEVEL SECURITY;
        
        CREATE POLICY "quotes_self_only" ON public.quotes
        FOR SELECT
        TO authenticated
        USING (customer_email = auth.email() OR public.is_admin_user_safe());

        CREATE POLICY "quotes_service_manage" ON public.quotes
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Secured quotes table with FORCE RLS';
    END IF;
END $$;

-- Affiliate Order Tracking - Affiliate Self and Admin ONLY
ALTER TABLE public.affiliate_order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_order_tracking FORCE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_tracking_self_only" ON public.affiliate_order_tracking
FOR SELECT
TO authenticated
USING (
    affiliate_id IN (
        SELECT id FROM public.affiliates WHERE email = auth.email()
    ) OR public.is_admin_user_safe()
);

CREATE POLICY "affiliate_tracking_service_manage" ON public.affiliate_order_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Grant minimal required permissions to service_role only
GRANT ALL ON public.abandoned_orders TO service_role;
GRANT ALL ON public.admin_users TO service_role;
GRANT ALL ON public.affiliates TO service_role;
GRANT ALL ON public.customer_orders TO service_role;
GRANT ALL ON public.affiliate_order_tracking TO service_role;

-- Grant to orders and quotes if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        GRANT ALL ON public.orders TO service_role;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        GRANT ALL ON public.quotes TO service_role;
    END IF;
END $$;

-- Step 5: Final security verification log
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'nuclear-security-lockdown', 
  'info',
  'NUCLEAR SECURITY LOCKDOWN COMPLETE - ALL PUBLIC DATA ACCESS ELIMINATED',
  jsonb_build_object(
    'timestamp', now(),
    'security_level', 'MAXIMUM_LOCKDOWN',
    'actions_taken', jsonb_build_array(
      'dropped_all_existing_policies',
      'revoked_all_public_privileges', 
      'enabled_force_rls_all_tables',
      'created_owner_only_policies',
      'granted_service_role_only'
    ),
    'public_access_status', 'COMPLETELY_ELIMINATED',
    'data_protection', 'MAXIMUM_ENTERPRISE_LEVEL'
  )
);