-- Fix cover_pages RLS policies to allow service role and simplify admin access
DROP POLICY IF EXISTS "Admins can manage cover pages" ON public.cover_pages;
DROP POLICY IF EXISTS "Cover pages viewable by authorized users" ON public.cover_pages;

-- Create new simplified policies
CREATE POLICY "Service role can manage cover pages" ON public.cover_pages
FOR ALL USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admin users can manage cover pages" ON public.cover_pages
FOR ALL USING (
  auth.role() = 'service_role'::text OR 
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
)
WITH CHECK (
  auth.role() = 'service_role'::text OR 
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
);

CREATE POLICY "Public can view active cover pages" ON public.cover_pages
FOR SELECT USING (is_active = true);