-- Fix RLS policy for delivery_app_variations to allow admin inserts

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Admin users can manage delivery app variations" ON delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active delivery app variations" ON delivery_app_variations;

-- Create proper RLS policies for delivery app variations
CREATE POLICY "Admin users can manage delivery app variations" 
ON delivery_app_variations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
);

-- Public can view active delivery app variations
CREATE POLICY "Public can view active delivery app variations" 
ON delivery_app_variations 
FOR SELECT 
USING (is_active = true);

-- Also ensure service role can manage for edge functions
CREATE POLICY "Service role can manage delivery app variations" 
ON delivery_app_variations 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);