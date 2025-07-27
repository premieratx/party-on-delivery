-- Update RLS policies for custom_affiliate_sites to allow admin users to create sites
DROP POLICY IF EXISTS "Admin users can manage all sites" ON public.custom_affiliate_sites;

CREATE POLICY "Admin users can manage all sites" 
ON public.custom_affiliate_sites 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
);