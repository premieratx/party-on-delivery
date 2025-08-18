-- Fix critical security vulnerabilities

-- 1. Add RLS policies for order_drafts table
CREATE POLICY "Users can only access their own order drafts" 
ON public.order_drafts 
FOR ALL
USING (auth.uid()::text = session_id OR auth.email() = customer_email);

-- 2. Add RLS policies for abandoned_orders table  
CREATE POLICY "Users can only access their own abandoned orders"
ON public.abandoned_orders
FOR ALL
USING (auth.email() = email);

-- 3. Restrict admin_users table access
DROP POLICY IF EXISTS "Admin users can view all admin accounts" ON public.admin_users;
CREATE POLICY "Admin users can only view their own account"
ON public.admin_users
FOR SELECT
USING (auth.email() = email);

-- 4. Restrict affiliates table public access
DROP POLICY IF EXISTS "Anyone can view affiliate profiles" ON public.affiliates;
CREATE POLICY "Affiliates can view their own profile"
ON public.affiliates
FOR SELECT
USING (auth.email() = email);

CREATE POLICY "Admin users can view all affiliate profiles"
ON public.affiliates
FOR SELECT
USING (public.is_admin_user());

-- 5. Restrict affiliate_referrals table access
CREATE POLICY "Affiliates can only view their own referrals"
ON public.affiliate_referrals
FOR ALL
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()));

CREATE POLICY "Admin users can view all affiliate referrals"
ON public.affiliate_referrals
FOR SELECT
USING (public.is_admin_user());

-- 6. Add missing RLS policy for customers table
CREATE POLICY "Users can view their own customer profile"
ON public.customers
FOR ALL
USING (auth.email() = email);

CREATE POLICY "Admin users can view all customer profiles"
ON public.customers
FOR SELECT
USING (public.is_admin_user());

-- 7. Restrict customer_orders access
CREATE POLICY "Users can view their own orders"
ON public.customer_orders
FOR ALL
USING (
  auth.email() = delivery_address->>'email' OR 
  auth.uid()::text = session_id OR
  customer_id IN (SELECT id FROM public.customers WHERE email = auth.email())
);

CREATE POLICY "Admin users can view all customer orders"
ON public.customer_orders
FOR SELECT
USING (public.is_admin_user());