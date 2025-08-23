-- Fix cover_pages permissions for mobile access
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "cover_pages_admin_full_access" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_public_read_access" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_service_full_access" ON public.cover_pages;

-- Create simple, clear policies
CREATE POLICY "cover_pages_public_read" 
ON public.cover_pages 
FOR SELECT 
USING (true);

CREATE POLICY "cover_pages_admin_all" 
ON public.cover_pages 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "cover_pages_service_all" 
ON public.cover_pages 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.cover_pages ENABLE ROW LEVEL SECURITY;