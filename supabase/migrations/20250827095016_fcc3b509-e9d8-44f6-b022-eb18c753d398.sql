-- Fix critical security issues by enabling RLS on all public tables and securing sensitive data

-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

-- Secure customer and admin data with proper policies
CREATE POLICY "admin_users_admin_only" ON public.admin_users
  FOR ALL USING (is_admin_user_safe());

CREATE POLICY "orders_admin_and_customer_only" ON public.orders  
  FOR ALL USING (
    is_admin_user_safe() OR 
    customer_email = auth.email()
  );

CREATE POLICY "quotes_admin_and_customer_only" ON public.quotes
  FOR ALL USING (
    is_admin_user_safe() OR 
    customer_email = auth.email()
  );

CREATE POLICY "delivery_addresses_admin_and_customer_only" ON public.delivery_addresses
  FOR ALL USING (
    is_admin_user_safe() OR 
    customer_email = auth.email()
  );

CREATE POLICY "telegram_users_admin_only" ON public.telegram_users
  FOR ALL USING (is_admin_user_safe());

-- Secure affiliate data
CREATE POLICY "affiliates_self_and_admin_only" ON public.affiliates
  FOR ALL USING (
    is_admin_user_safe() OR 
    email = auth.email()
  );

-- Lock down public access on sensitive tables
REVOKE ALL ON public.admin_users FROM public, anon, authenticated;
REVOKE ALL ON public.orders FROM public, anon;
REVOKE ALL ON public.quotes FROM public, anon;  
REVOKE ALL ON public.delivery_addresses FROM public, anon;
REVOKE ALL ON public.telegram_users FROM public, anon;

-- Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.delivery_addresses TO authenticated;