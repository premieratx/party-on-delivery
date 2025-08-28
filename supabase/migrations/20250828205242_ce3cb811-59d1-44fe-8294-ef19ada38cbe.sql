-- Drop existing restrictive policies
DROP POLICY IF EXISTS "cover_pages_admin_full_access" ON cover_pages;
DROP POLICY IF EXISTS "admin_users_admin_access_only" ON admin_users;

-- Create completely open policies for cover pages - no restrictions
CREATE POLICY "cover_pages_public_access" ON cover_pages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Make admin users table accessible  
CREATE POLICY "admin_users_open_access" ON admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);