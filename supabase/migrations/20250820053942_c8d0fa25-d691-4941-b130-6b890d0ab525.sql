-- Fix admin authentication context and RLS policies

-- Create function to set admin context from edge function
CREATE OR REPLACE FUNCTION public.set_admin_context(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  -- Store admin email in a way that RLS policies can access
  PERFORM set_config('app.admin_email', admin_email, false);
END;
$$;

-- Enhanced admin check function that works with edge function auth
CREATE OR REPLACE FUNCTION public.is_admin_user_enhanced()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  admin_email text;
BEGIN
  -- First try to get from app context (set by edge function)
  admin_email := current_setting('app.admin_email', true);
  
  IF admin_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = admin_email
    );
  END IF;
  
  -- Fallback to auth.email() for direct auth
  IF auth.email() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Update cover_pages RLS policies
DROP POLICY IF EXISTS "Admin users can manage cover pages" ON public.cover_pages;
DROP POLICY IF EXISTS "Public can view active cover pages" ON public.cover_pages;
DROP POLICY IF EXISTS "Service role can manage cover pages" ON public.cover_pages;

CREATE POLICY "Enhanced admin access for cover pages"
ON public.cover_pages
FOR ALL
USING (is_admin_user_enhanced() OR auth.role() = 'service_role')
WITH CHECK (is_admin_user_enhanced() OR auth.role() = 'service_role');

CREATE POLICY "Public can view active cover pages"
ON public.cover_pages
FOR SELECT
USING (is_active = true);

-- Update delivery_app_variations RLS policies  
DROP POLICY IF EXISTS "Admin users can manage delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Service role can manage delivery apps" ON public.delivery_app_variations;

CREATE POLICY "Enhanced admin access for delivery apps"
ON public.delivery_app_variations
FOR ALL
USING (is_admin_user_enhanced() OR auth.role() = 'service_role')
WITH CHECK (is_admin_user_enhanced() OR auth.role() = 'service_role');

CREATE POLICY "Public can view active delivery apps"
ON public.delivery_app_variations
FOR SELECT
USING (is_active = true);

-- Update post_checkout_pages RLS policies
DROP POLICY IF EXISTS "Admin users can manage post checkout pages" ON public.post_checkout_pages;
DROP POLICY IF EXISTS "Public can view active post checkout pages" ON public.post_checkout_pages;
DROP POLICY IF EXISTS "Service role can manage post checkout pages" ON public.post_checkout_pages;

CREATE POLICY "Enhanced admin access for post checkout pages"
ON public.post_checkout_pages
FOR ALL
USING (is_admin_user_enhanced() OR auth.role() = 'service_role')
WITH CHECK (is_admin_user_enhanced() OR auth.role() = 'service_role');

CREATE POLICY "Public can view active post checkout pages"
ON public.post_checkout_pages
FOR SELECT
USING (is_active = true);