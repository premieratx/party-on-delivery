-- COMPREHENSIVE SECURITY FIX MIGRATION - PART 2
-- Fix the policy conflicts and complete the security implementation

-- Drop ALL existing policies more comprehensively
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    -- Drop all policies on sensitive tables
    FOR pol_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('abandoned_orders', 'customer_orders', 'affiliates', 'affiliate_order_tracking', 'quotes', 'orders', 'admin_users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol_record.policyname, pol_record.schemaname, pol_record.tablename);
    END LOOP;
END $$;

-- Create secure RLS policies for abandoned_orders
CREATE POLICY "abandoned_orders_admin_access" ON public.abandoned_orders
FOR ALL USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "abandoned_orders_service_access" ON public.abandoned_orders
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create secure RLS policies for customer_orders
CREATE POLICY "customer_orders_owner_access" ON public.customer_orders
FOR SELECT USING (
  (delivery_address ->> 'email' = auth.email()) OR 
  is_admin_user_safe()
);

CREATE POLICY "customer_orders_service_manage" ON public.customer_orders
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "customer_orders_admin_access" ON public.customer_orders
FOR ALL USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Create secure RLS policies for affiliates
CREATE POLICY "affiliates_self_access" ON public.affiliates
FOR SELECT USING (
  email = auth.email() OR 
  is_admin_user_safe()
);

CREATE POLICY "affiliates_self_update" ON public.affiliates
FOR UPDATE USING (email = auth.email())
WITH CHECK (email = auth.email());

CREATE POLICY "affiliates_admin_manage" ON public.affiliates
FOR ALL USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "affiliates_service_manage" ON public.affiliates
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create secure RLS policies for affiliate_order_tracking
CREATE POLICY "affiliate_tracking_self_access" ON public.affiliate_order_tracking
FOR SELECT USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE email = auth.email()
  ) OR 
  is_admin_user_safe()
);

CREATE POLICY "affiliate_tracking_service_manage" ON public.affiliate_order_tracking
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "affiliate_tracking_admin_access" ON public.affiliate_order_tracking
FOR ALL USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Secure quotes table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "quotes_admin_only" ON public.quotes
    FOR ALL USING (is_admin_user_safe())
    WITH CHECK (is_admin_user_safe())';
    
    EXECUTE 'CREATE POLICY "quotes_service_access" ON public.quotes
    FOR ALL USING (auth.jwt() ->> ''role'' = ''service_role'')
    WITH CHECK (auth.jwt() ->> ''role'' = ''service_role'')';
  END IF;
END $$;

-- Secure orders table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "orders_admin_only" ON public.orders
    FOR ALL USING (is_admin_user_safe())
    WITH CHECK (is_admin_user_safe())';
    
    EXECUTE 'CREATE POLICY "orders_service_access" ON public.orders
    FOR ALL USING (auth.jwt() ->> ''role'' = ''service_role'')
    WITH CHECK (auth.jwt() ->> ''role'' = ''service_role'')';
  END IF;
END $$;

-- Secure admin_users table
CREATE POLICY "admin_users_self_only" ON public.admin_users
FOR ALL USING (email = auth.email())
WITH CHECK (email = auth.email());

-- Revoke public access from all sensitive tables
REVOKE ALL ON public.abandoned_orders FROM public, anon;
REVOKE ALL ON public.customer_orders FROM public, anon;
REVOKE ALL ON public.affiliates FROM public, anon;
REVOKE ALL ON public.affiliate_order_tracking FROM public, anon;
REVOKE ALL ON public.admin_users FROM public, anon;

-- Fix security definer functions
ALTER FUNCTION public.is_admin_user_safe() SECURITY DEFINER;

-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.abandoned_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop the problematic view that was causing security definer issues
DROP VIEW IF EXISTS public.instant_products_view CASCADE;

-- Create enhanced security audit function
CREATE OR REPLACE FUNCTION public.log_security_access(
  event_type text,
  table_name text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_email,
    details,
    created_at
  ) VALUES (
    event_type,
    auth.email(),
    jsonb_build_object(
      'table', table_name,
      'user_role', auth.role(),
      'jwt_claims', auth.jwt(),
      'details', details
    ),
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If audit logging fails, don't block the operation
    NULL;
END;
$$;