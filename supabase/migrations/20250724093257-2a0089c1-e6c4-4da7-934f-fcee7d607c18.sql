-- Security Fix 1: Enable leaked password protection
-- This will be handled via Auth settings

-- Security Fix 2: Add proper RLS policies and fix overly permissive ones
-- First, let's check current policies and improve them

-- Fix affiliate_referrals RLS (currently might be too permissive)
DROP POLICY IF EXISTS "Affiliates can view their referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliates can view their referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE affiliates.id = affiliate_referrals.affiliate_id 
    AND affiliates.user_id = auth.uid()
  )
);

-- Admins can view all referrals (for admin dashboard)
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.affiliate_referrals;
CREATE POLICY "Admins can view all referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()::text
  )
);

-- Fix affiliates table RLS
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON public.affiliates;
CREATE POLICY "Users can view their own affiliate data" 
ON public.affiliates 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own affiliate data" ON public.affiliates;
CREATE POLICY "Users can update their own affiliate data" 
ON public.affiliates 
FOR UPDATE 
USING (user_id = auth.uid());

-- Admin access to affiliates
DROP POLICY IF EXISTS "Admins can view all affiliates" ON public.affiliates;
CREATE POLICY "Admins can view all affiliates" 
ON public.affiliates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()::text
  )
);

-- Secure admin_users table with proper RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can view themselves" ON public.admin_users;
CREATE POLICY "Admin users can view themselves" 
ON public.admin_users 
FOR SELECT 
USING (id = auth.uid()::text);

-- Secure customer_profiles with user-specific access
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.customer_profiles;
CREATE POLICY "Users can manage their own profile" 
ON public.customer_profiles 
FOR ALL 
USING (user_id = auth.uid());

-- Secure delivery_addresses with user-specific access
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.delivery_addresses;
CREATE POLICY "Users can manage their own addresses" 
ON public.delivery_addresses 
FOR ALL 
USING (user_id = auth.uid());

-- Secure recent_orders with user-specific access
DROP POLICY IF EXISTS "Users can manage their own recent orders" ON public.recent_orders;
CREATE POLICY "Users can manage their own recent orders" 
ON public.recent_orders 
FOR ALL 
USING (user_id = auth.uid());

-- Add audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    details,
    created_at
  ) VALUES (
    event_type,
    user_id,
    details,
    now()
  );
END;
$$;

-- Create security audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()::text
  )
);

-- Improve the admin password verification function with better security
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_email text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  stored_hash text;
  admin_id text;
BEGIN
  -- Log the authentication attempt
  SELECT id, password_hash INTO admin_id, stored_hash 
  FROM admin_users 
  WHERE email = input_email;
  
  -- Log security event
  PERFORM log_security_event(
    'admin_login_attempt',
    null,
    jsonb_build_object('email', input_email, 'success', stored_hash IS NOT NULL)
  );
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password
  IF stored_hash = crypt(input_password, stored_hash) THEN
    -- Log successful login
    PERFORM log_security_event(
      'admin_login_success',
      admin_id::uuid,
      jsonb_build_object('email', input_email)
    );
    RETURN true;
  ELSE
    -- Log failed login
    PERFORM log_security_event(
      'admin_login_failed',
      null,
      jsonb_build_object('email', input_email)
    );
    RETURN false;
  END IF;
END;
$$;