-- SECURITY HARDENING PHASE 1: Admin emails and basic fixes

-- 1. Add additional admin emails for Google login authentication
INSERT INTO public.admin_users (email, name) 
VALUES 
  ('info@partyondelivery.com', 'Info Admin'),
  ('allan@partyondelivery.com', 'Allan Admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Update admin policy to include new emails
DROP POLICY IF EXISTS "Only specific admin can access admin data" ON public.admin_users;
CREATE POLICY "Admin users can access admin data" ON public.admin_users
FOR ALL 
USING (email IN ('brian@partyondelivery.com', 'info@partyondelivery.com', 'allan@partyondelivery.com'))
WITH CHECK (email IN ('brian@partyondelivery.com', 'info@partyondelivery.com', 'allan@partyondelivery.com'));

-- 3. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON public.customer_orders USING btree ((delivery_address->>'email'));
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates USING btree (email);
CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_updated ON public.shopify_products_cache USING btree (updated_at DESC);