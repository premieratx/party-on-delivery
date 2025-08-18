-- Fix RLS policies with correct types

-- 1. Add RLS policies for order_drafts table
DROP POLICY IF EXISTS "Users can only access their own order drafts" ON public.order_drafts;
CREATE POLICY "Users can only access their own order drafts" 
ON public.order_drafts 
FOR ALL
USING (auth.uid()::text = session_id OR auth.email() = customer_email);

-- 2. Add RLS policies for abandoned_orders table  
DROP POLICY IF EXISTS "Users can only access their own abandoned orders" ON public.abandoned_orders;
CREATE POLICY "Users can only access their own abandoned orders"
ON public.abandoned_orders
FOR ALL
USING (auth.email() = customer_email);

-- 3. Fix customer_addresses policy with correct type casting
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.customer_addresses;
CREATE POLICY "Users can view their own addresses"
ON public.customer_addresses
FOR ALL
USING (customer_id::bigint IN (SELECT id FROM public.customers WHERE email = auth.email()));

-- 4. Add admin override policies for critical tables
CREATE POLICY "Admin users can view all order drafts"
ON public.order_drafts
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admin users can view all abandoned orders"
ON public.abandoned_orders
FOR SELECT
USING (public.is_admin_user());