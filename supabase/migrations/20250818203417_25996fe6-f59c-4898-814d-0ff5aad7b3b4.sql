-- COMPREHENSIVE SECURITY FIXES PART 2

-- 1. Fix RLS enabled with no policy issues

-- Fix order_drafts table (add missing RLS policy)
CREATE POLICY "Admin users can manage order drafts" 
ON public.order_drafts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
));

-- Fix optimization_logs table (add RLS policy)
CREATE POLICY "System can manage optimization logs" 
ON public.optimization_logs 
FOR ALL 
USING (
  (auth.jwt() ->> 'role')::text = 'service_role'::text OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email())
);

-- Fix master_automation_sessions table (add RLS policy)  
CREATE POLICY "Admin users can manage automation sessions" 
ON public.master_automation_sessions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE email = auth.email()
));

-- 2. Fix mutable search_path functions with SECURITY DEFINER

-- Fix update_affiliate_stats function
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update affiliate stats when new referral is added
  UPDATE public.affiliates 
  SET 
    total_sales = COALESCE((
      SELECT SUM(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    total_commission = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_unpaid = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id AND paid_out = false
    ), 0),
    orders_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    largest_order = COALESCE((
      SELECT MAX(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_rate = CASE 
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 20000 THEN 10.00
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 10000 THEN 7.50
      ELSE 5.00
    END,
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$function$;

-- Fix ensure_single_homepage function
CREATE OR REPLACE FUNCTION public.ensure_single_homepage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_homepage = true THEN
    UPDATE public.delivery_app_variations 
    SET is_homepage = false 
    WHERE id != NEW.id AND is_homepage = true;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Drop and recreate security definer views as regular views
-- Drop the problematic views first
DROP VIEW IF EXISTS public.instant_products_view CASCADE;

-- Recreate as regular view without SECURITY DEFINER
CREATE VIEW public.instant_products_view AS
SELECT 
  spc.id,
  spc.title,
  spc.handle,
  spc.data->>'image' as image,
  (spc.data->>'price')::numeric as price,
  spc.data->>'category' as category,
  get_product_category(string_to_array(spc.data->>'collection_handles', ',')) as app_category,
  string_to_array(spc.data->>'collection_handles', ',') as collection_handles,
  spc.data->'variants' as variants,
  spc.updated_at
FROM public.shopify_products_cache spc;

-- 4. Secure admin_users table further - restrict to specific admin only
DROP POLICY IF EXISTS "Only specific admin can access admin data" ON public.admin_users;

CREATE POLICY "Only specific admin can access admin data" 
ON public.admin_users 
FOR ALL 
USING (email = 'brian@partyondelivery.com'::text)
WITH CHECK (email = 'brian@partyondelivery.com'::text);

-- 5. Add better session_tokens column handling to customers table
ALTER TABLE public.customers 
DROP COLUMN IF EXISTS session_tokens CASCADE;

ALTER TABLE public.customers 
ADD COLUMN session_tokens TEXT[] DEFAULT '{}';

-- 6. Update link_customer_session function to be more secure
CREATE OR REPLACE FUNCTION public.link_customer_session(customer_email text, session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only link session if customer exists and email matches auth
  IF customer_email = auth.email() OR 
     EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email()) THEN
    
    -- Add session token to customer's session_tokens array if not already present
    UPDATE public.customers
    SET session_tokens = array_append(session_tokens, session_token)
    WHERE email = customer_email 
      AND NOT (session_token = ANY(COALESCE(session_tokens, '{}')));
      
    -- Also update any customer_orders that have this session_id but no customer_id
    UPDATE public.customer_orders
    SET customer_id = (
      SELECT id::uuid FROM public.customers WHERE email = customer_email LIMIT 1
    )
    WHERE session_id = session_token AND customer_id IS NULL;
  END IF;
END;
$function$;