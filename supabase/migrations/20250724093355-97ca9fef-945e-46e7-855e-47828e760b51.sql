-- Fix RLS policies based on actual table structure
-- Affiliates table uses email for authentication, not user_id

-- Fix affiliate_referrals RLS
DROP POLICY IF EXISTS "Affiliates can view their referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliates can view their referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE affiliates.id = affiliate_referrals.affiliate_id 
    AND affiliates.email = auth.email()
  )
);

-- Fix affiliates table RLS
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON public.affiliates;
CREATE POLICY "Users can view their own affiliate data" 
ON public.affiliates 
FOR SELECT 
USING (email = auth.email());

DROP POLICY IF EXISTS "Users can update their own affiliate data" ON public.affiliates;
CREATE POLICY "Users can update their own affiliate data" 
ON public.affiliates 
FOR UPDATE 
USING (email = auth.email());

-- Fix customer_profiles RLS (doesn't have user_id, uses email)
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.customer_profiles;
CREATE POLICY "Users can manage their own profile" 
ON public.customer_profiles 
FOR ALL 
USING (email = auth.email());

-- Fix delivery_addresses RLS (uses customer_email)
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.delivery_addresses;
CREATE POLICY "Users can manage their own addresses" 
ON public.delivery_addresses 
FOR ALL 
USING (customer_email = auth.email());

-- Fix recent_orders RLS (uses customer_email)
DROP POLICY IF EXISTS "Users can manage their own recent orders" ON public.recent_orders;
CREATE POLICY "Users can manage their own recent orders" 
ON public.recent_orders 
FOR ALL 
USING (customer_email = auth.email());

-- Add audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_email text,
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
    user_email,
    details,
    created_at
  ) VALUES (
    event_type,
    user_email,
    details,
    now()
  );
END;
$$;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_email text,
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
    WHERE admin_users.email = auth.email()
  )
);

-- Fix cache table RLS - remove overly permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.cache;
DROP POLICY IF EXISTS "Allow service role insert/update" ON public.cache;
DROP POLICY IF EXISTS "Cache is publicly accessible" ON public.cache;
DROP POLICY IF EXISTS "Cache is publicly readable" ON public.cache;

-- Keep only the service role policy for cache management
-- Cache should only be managed by edge functions
CREATE POLICY "Edge functions can manage cache" 
ON public.cache 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

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
    input_email,
    jsonb_build_object('success', stored_hash IS NOT NULL)
  );
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password
  IF stored_hash = crypt(input_password, stored_hash) THEN
    -- Log successful login
    PERFORM log_security_event(
      'admin_login_success',
      input_email,
      jsonb_build_object('admin_id', admin_id)
    );
    RETURN true;
  ELSE
    -- Log failed login
    PERFORM log_security_event(
      'admin_login_failed',
      input_email,
      jsonb_build_object('reason', 'invalid_password')
    );
    RETURN false;
  END IF;
END;
$$;