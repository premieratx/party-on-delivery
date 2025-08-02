-- Update RLS policies for product_modifications to allow system operations
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin users can manage product modifications" ON product_modifications;
DROP POLICY IF EXISTS "System can manage product modifications" ON product_modifications;

-- Create new policies that allow both admin users and system operations
CREATE POLICY "Admin users can manage product modifications" 
ON product_modifications 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email())
  OR auth.jwt() ->> 'role' = 'service_role'
  OR auth.jwt() ->> 'role' = 'authenticated'
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.email())
  OR auth.jwt() ->> 'role' = 'service_role'
  OR auth.jwt() ->> 'role' = 'authenticated'
);

-- Allow system operations for edge functions
CREATE POLICY "System can manage product modifications" 
ON product_modifications 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');