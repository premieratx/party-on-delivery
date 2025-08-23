-- Remove ALL restrictions on cover_pages table
DROP POLICY IF EXISTS "cover_pages_public_read" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_admin_all" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_service_all" ON public.cover_pages;

-- Make cover_pages completely public with no restrictions
CREATE POLICY "cover_pages_unrestricted" 
ON public.cover_pages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Grant all permissions to everyone
GRANT ALL ON public.cover_pages TO anon;
GRANT ALL ON public.cover_pages TO authenticated;
GRANT ALL ON public.cover_pages TO public;