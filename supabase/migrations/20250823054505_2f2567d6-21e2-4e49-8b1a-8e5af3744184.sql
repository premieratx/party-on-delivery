-- Fix RLS policies for cover_pages to allow public access
-- This will enable mobile devices to access cover pages

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "cover_pages_admin_full_access" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_anonymous_read" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_service_role_access" ON public.cover_pages;
DROP POLICY IF EXISTS "cover_pages_universal_read" ON public.cover_pages;

-- Create new permissive policy for public read access
CREATE POLICY "cover_pages_public_read_access" 
ON public.cover_pages 
FOR SELECT 
USING (is_active = true);

-- Allow service role full access for admin operations
CREATE POLICY "cover_pages_service_full_access" 
ON public.cover_pages 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Allow admin users full access
CREATE POLICY "cover_pages_admin_full_access" 
ON public.cover_pages 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());