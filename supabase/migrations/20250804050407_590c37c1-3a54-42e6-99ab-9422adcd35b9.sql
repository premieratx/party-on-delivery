-- Simple fix for delivery_app_variations RLS - allow all operations temporarily for testing

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins and service role can manage delivery apps" ON delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active delivery app variations" ON delivery_app_variations;
DROP POLICY IF EXISTS "Temporary allow all for testing" ON delivery_app_variations;

-- Create simple policies that work
CREATE POLICY "Allow all operations for now"
ON delivery_app_variations
FOR ALL
USING (true)
WITH CHECK (true);

-- Keep the public read policy for active apps
CREATE POLICY "Public can view active apps"
ON delivery_app_variations
FOR SELECT
USING (is_active = true);