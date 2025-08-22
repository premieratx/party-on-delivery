-- Fix cover_pages RLS policies to work with current admin authentication system
-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Admin access for cover pages" ON public.cover_pages;
DROP POLICY IF EXISTS "Public can view active cover pages" ON public.cover_pages;

-- Create new working policies
CREATE POLICY "cover_pages_admin_full_access"
  ON public.cover_pages
  FOR ALL
  USING (is_admin_user_safe())
  WITH CHECK (is_admin_user_safe());

CREATE POLICY "cover_pages_public_read"
  ON public.cover_pages
  FOR SELECT
  USING (is_active = true);

-- Also allow service role access for edge functions
CREATE POLICY "cover_pages_service_role_access"
  ON public.cover_pages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');