-- SECURITY FIXES PART 3 - Final cleanup

-- 1. Fix tables that don't have proper policies (skip ones that already exist)

-- Check and fix order_drafts if policy doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_drafts' 
    AND policyname = 'Admin users can manage order drafts'
  ) THEN
    CREATE POLICY "Admin users can manage order drafts" 
    ON public.order_drafts 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ));
  END IF;
END $$;

-- Check and fix master_automation_sessions if policy doesn't exist  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'master_automation_sessions' 
    AND policyname = 'Admin users can manage automation sessions'
  ) THEN
    CREATE POLICY "Admin users can manage automation sessions" 
    ON public.master_automation_sessions 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ));
  END IF;
END $$;

-- 2. Fix any remaining function search path issues
CREATE OR REPLACE FUNCTION public.get_post_checkout_url(app_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  app_config RECORD;
BEGIN
  -- Get app configuration
  SELECT * INTO app_config
  FROM public.delivery_app_variations
  WHERE app_slug = app_name OR app_name = app_name
  LIMIT 1;
  
  -- Default to standard post-checkout if app not found
  IF app_config IS NULL THEN
    RETURN '/order-complete';
  END IF;
  
  -- Return app-specific post-checkout URL
  RETURN '/post-checkout/' || app_config.app_slug;
END;
$function$;

-- 3. Ensure all sensitive functions have proper search_path
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_email text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash text;
  admin_id text;
BEGIN
  -- Log the authentication attempt
  SELECT id, password_hash INTO admin_id, stored_hash 
  FROM public.admin_users 
  WHERE email = input_email;
  
  -- Log security event
  PERFORM public.log_security_event(
    'admin_login_attempt',
    input_email,
    jsonb_build_object('success', stored_hash IS NOT NULL)
  );
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password using crypt function
  IF stored_hash = crypt(input_password, stored_hash) THEN
    -- Log successful login
    PERFORM public.log_security_event(
      'admin_login_success',
      input_email,
      jsonb_build_object('admin_id', admin_id)
    );
    RETURN true;
  ELSE
    -- Log failed login
    PERFORM public.log_security_event(
      'admin_login_failed',
      input_email,
      jsonb_build_object('reason', 'invalid_password')
    );
    RETURN false;
  END IF;
END;
$function$;

-- 4. Add missing RLS policies for sensitive tables that might be exposed

-- Secure recent_orders table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recent_orders') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.recent_orders ENABLE ROW LEVEL SECURITY;
    
    -- Add admin-only policy
    CREATE POLICY "Admin users can manage recent orders" 
    ON public.recent_orders 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    ));
  END IF;
END $$;

-- Secure user_session_progress table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_session_progress') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.user_session_progress ENABLE ROW LEVEL SECURITY;
    
    -- Users can only access their own session progress
    CREATE POLICY "Users can manage their own session progress" 
    ON public.user_session_progress 
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Secure saved_carts table if it exists  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_carts') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
    
    -- Users can only access their own saved carts
    CREATE POLICY "Users can manage their own saved carts" 
    ON public.saved_carts 
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;