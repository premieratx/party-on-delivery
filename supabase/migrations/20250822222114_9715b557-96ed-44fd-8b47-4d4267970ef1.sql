-- Fix cover pages RLS policies to allow public read access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "cover_pages_public_read" ON public.cover_pages;

-- Create new policy that allows anonymous public read access to active cover pages
CREATE POLICY "cover_pages_anonymous_read" 
ON public.cover_pages 
FOR SELECT 
TO public, anon, authenticated
USING (is_active = true);

-- Ensure this policy works for all user types including anonymous
CREATE POLICY "cover_pages_universal_read" 
ON public.cover_pages 
FOR SELECT 
USING (is_active = true);