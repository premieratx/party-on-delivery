-- Fix remaining critical security issues

-- Add missing RLS policy for affiliate_app_links table
DROP POLICY IF EXISTS "Public can view affiliate app links" ON public.affiliate_app_links;
CREATE POLICY "Affiliates can view their app links"
ON public.affiliate_app_links
FOR SELECT
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()));

CREATE POLICY "Admin users can view all affiliate app links"
ON public.affiliate_app_links
FOR SELECT
USING (public.is_admin_user());

-- Ensure customer_orders has proper RLS (fix existing policy)
DROP POLICY IF EXISTS "Shared orders via token only" ON public.customer_orders;
CREATE POLICY "Shared orders via token only"
ON public.customer_orders
FOR SELECT
USING (is_shareable = true AND status != 'cancelled');

-- Add better security for order_drafts
ALTER TABLE public.order_drafts ENABLE ROW LEVEL SECURITY;

-- Ensure all sensitive tables have proper admin access
CREATE POLICY "Admin users can manage affiliate app links"
ON public.affiliate_app_links
FOR ALL
USING (public.is_admin_user());

-- Update function search paths for security
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  );
END;
$$;