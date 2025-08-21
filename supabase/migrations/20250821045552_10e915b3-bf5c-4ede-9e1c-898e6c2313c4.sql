-- Fix RLS policies for admin dashboard access
-- The issue is that admin context is not properly being recognized by RLS policies

-- Update customer_orders policies to use service role for edge functions and proper admin check
DROP POLICY IF EXISTS "customer_orders_admin_strict" ON public.customer_orders;
DROP POLICY IF EXISTS "customer_orders_service_strict" ON public.customer_orders;

CREATE POLICY "customer_orders_admin_access" ON public.customer_orders
FOR ALL USING (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR
  (auth.email() = (delivery_address ->> 'email'::text))
);

-- Update customers policies  
DROP POLICY IF EXISTS "customers_admin_view_strict" ON public.customers;
DROP POLICY IF EXISTS "customers_service_strict" ON public.customers;

CREATE POLICY "customers_admin_access" ON public.customers
FOR ALL USING (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR
  (email = auth.email())
);

-- Update affiliates policies
DROP POLICY IF EXISTS "affiliates_self_admin_strict" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_service_strict" ON public.affiliates;

CREATE POLICY "affiliates_admin_access" ON public.affiliates  
FOR ALL USING (
  (auth.role() = 'service_role') OR 
  is_admin_user_safe() OR
  (email = auth.email())
);

-- Fix the admin user function to be more reliable
CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  user_email text;
  admin_email text;
BEGIN
  -- Get current user email
  user_email := auth.email();
  
  -- If no email, return false
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Try to get from app context first (set by edge functions)
  admin_email := current_setting('app.admin_email', true);
  
  -- If admin context is set and matches current user, return true
  IF admin_email IS NOT NULL AND admin_email = user_email THEN
    RETURN true;
  END IF;
  
  -- Otherwise check admin_users table directly
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
END;
$function$;