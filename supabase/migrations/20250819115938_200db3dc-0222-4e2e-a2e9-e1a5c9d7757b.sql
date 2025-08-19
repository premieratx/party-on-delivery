-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Phase 1: Drop all existing problematic policies and create secure ones

-- Drop existing policies that are causing issues
DROP POLICY IF EXISTS "abandoned_orders_admin_only" ON public.abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_block_anon" ON public.abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_block_public" ON public.abandoned_orders;
DROP POLICY IF EXISTS "abandoned_orders_service_only" ON public.abandoned_orders;

DROP POLICY IF EXISTS "customer_orders_block_anon" ON public.customer_orders;
DROP POLICY IF EXISTS "customer_orders_block_public" ON public.customer_orders;
DROP POLICY IF EXISTS "customer_orders_self_only" ON public.customer_orders;
DROP POLICY IF EXISTS "customer_orders_service_manage" ON public.customer_orders;

DROP POLICY IF EXISTS "affiliates_block_anon" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_block_public" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_self_only" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_service_manage" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_update_self_only" ON public.affiliates;

DROP POLICY IF EXISTS "affiliate_tracking_block_anon" ON public.affiliate_order_tracking;
DROP POLICY IF EXISTS "affiliate_tracking_block_public" ON public.affiliate_order_tracking;
DROP POLICY IF EXISTS "affiliate_tracking_self_only" ON public.affiliate_order_tracking;
DROP POLICY IF EXISTS "affiliate_tracking_service_manage" ON public.affiliate_order_tracking;

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

-- Secure quotes table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes' AND table_schema = 'public') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "quotes_public_read" ON public.quotes;
    
    -- Create secure policies
    EXECUTE 'CREATE POLICY "quotes_admin_only" ON public.quotes
    FOR ALL USING (is_admin_user_safe())
    WITH CHECK (is_admin_user_safe())';
    
    EXECUTE 'CREATE POLICY "quotes_service_manage" ON public.quotes
    FOR ALL USING (auth.jwt() ->> ''role'' = ''service_role'')
    WITH CHECK (auth.jwt() ->> ''role'' = ''service_role'')';
  END IF;
END $$;

-- Secure orders table if it exists  
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    -- Drop any existing policies
    DROP POLICY IF EXISTS "orders_public_read" ON public.orders;
    
    -- Create secure policies
    EXECUTE 'CREATE POLICY "orders_admin_only" ON public.orders
    FOR ALL USING (is_admin_user_safe())
    WITH CHECK (is_admin_user_safe())';
    
    EXECUTE 'CREATE POLICY "orders_service_manage" ON public.orders
    FOR ALL USING (auth.jwt() ->> ''role'' = ''service_role'')
    WITH CHECK (auth.jwt() ->> ''role'' = ''service_role'')';
  END IF;
END $$;

-- Revoke any remaining public access from sensitive tables
REVOKE ALL ON public.abandoned_orders FROM public;
REVOKE ALL ON public.abandoned_orders FROM anon;
REVOKE ALL ON public.customer_orders FROM public;  
REVOKE ALL ON public.customer_orders FROM anon;
REVOKE ALL ON public.affiliates FROM public;
REVOKE ALL ON public.affiliates FROM anon;
REVOKE ALL ON public.affiliate_order_tracking FROM public;
REVOKE ALL ON public.affiliate_order_tracking FROM anon;

-- Secure admin_users table access
REVOKE ALL ON public.admin_users FROM public;
REVOKE ALL ON public.admin_users FROM anon;

-- Fix any potential security definer issues by ensuring proper function security
ALTER FUNCTION public.is_admin_user_safe() SECURITY DEFINER;
ALTER FUNCTION public.get_dashboard_data_fixed(text, text, text) SECURITY DEFINER;

-- Add security logging for critical operations
CREATE OR REPLACE FUNCTION public.log_critical_access(
  operation_type text,
  table_name text,
  user_email text DEFAULT auth.email(),
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
    operation_type || '_' || table_name,
    user_email,
    jsonb_build_object(
      'table', table_name,
      'operation', operation_type,
      'additional_details', details
    ),
    now()
  );
END;
$$;

-- Update any views that might be causing security definer issues
-- Remove or fix any problematic security definer views
DROP VIEW IF EXISTS public.instant_products_view CASCADE;

-- Ensure all tables have proper RLS enabled
ALTER TABLE public.abandoned_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create audit triggers for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any changes to sensitive tables
  PERFORM public.log_critical_access(
    TG_OP,
    TG_TABLE_NAME,
    auth.email(),
    jsonb_build_object(
      'old_record', to_jsonb(OLD),
      'new_record', to_jsonb(NEW)
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_customer_orders_changes ON public.customer_orders;
CREATE TRIGGER audit_customer_orders_changes
AFTER INSERT OR UPDATE OR DELETE ON public.customer_orders
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_affiliate_changes ON public.affiliates;  
CREATE TRIGGER audit_affiliate_changes
AFTER INSERT OR UPDATE OR DELETE ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- Ensure proper permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin_user_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_critical_access(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data_fixed(text, text, text) TO authenticated;