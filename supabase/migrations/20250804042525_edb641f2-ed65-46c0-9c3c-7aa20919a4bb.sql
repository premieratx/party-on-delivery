-- Fix delivery_app_variations RLS policies for reliable admin access

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin users can manage delivery app variations" ON delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active delivery app variations" ON delivery_app_variations;
DROP POLICY IF EXISTS "Service role can manage delivery app variations" ON delivery_app_variations;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user email exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create proper RLS policies using the security definer function
CREATE POLICY "Admin users can manage delivery app variations" 
ON delivery_app_variations 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Public can view active delivery app variations
CREATE POLICY "Public can view active delivery app variations" 
ON delivery_app_variations 
FOR SELECT 
USING (is_active = true);

-- Service role can manage all
CREATE POLICY "Service role can manage delivery app variations" 
ON delivery_app_variations 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Also ensure there's an admin user record for testing
-- This will only insert if the email doesn't already exist
INSERT INTO public.admin_users (email, name) 
VALUES ('brian@partyondelivery.com', 'Brian Admin')
ON CONFLICT (email) DO NOTHING;