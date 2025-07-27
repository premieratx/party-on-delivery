-- Fix RLS policies for site_product_collections to allow admin management

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin users can manage all site collections" ON public.site_product_collections;
DROP POLICY IF EXISTS "Site collections are publicly viewable" ON public.site_product_collections;

-- Create new policies that work properly
CREATE POLICY "Admin users can manage all site collections" 
ON public.site_product_collections
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text OR EXISTS ( 
  SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()
))
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text OR EXISTS ( 
  SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()
));

CREATE POLICY "Site collections are publicly readable" 
ON public.site_product_collections
FOR SELECT
USING (true);

-- Also update custom_affiliate_sites policies to ensure proper access
DROP POLICY IF EXISTS "Admin users can manage all sites" ON public.custom_affiliate_sites;

CREATE POLICY "Admin users can manage all sites" 
ON public.custom_affiliate_sites
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text OR EXISTS ( 
  SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()
))
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text OR EXISTS ( 
  SELECT 1 FROM admin_users WHERE admin_users.email = auth.email()
));