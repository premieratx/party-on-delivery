-- Fix post_checkout_pages by cleaning up conflicting policies
-- Drop all existing policies and create clean ones

DROP POLICY IF EXISTS "Direct admin access for post checkout pages" ON public.post_checkout_pages;
DROP POLICY IF EXISTS "Post checkout pages are viewable by everyone" ON public.post_checkout_pages;  
DROP POLICY IF EXISTS "Public can view active post checkout pages" ON public.post_checkout_pages;

-- Create clean admin access policy
CREATE POLICY "Admin full access to post checkout pages" 
ON public.post_checkout_pages 
FOR ALL 
TO public 
USING (
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
)
WITH CHECK (
  (auth.email() IN (SELECT email FROM public.admin_users)) 
  OR (auth.role() = 'service_role'::text)
);

-- Create public read policy for active pages
CREATE POLICY "Public can view active post checkout pages" 
ON public.post_checkout_pages 
FOR SELECT 
TO public 
USING (is_active = true);