-- CRITICAL SECURITY FIX: Add missing RLS policies for exposed data

-- Fix abandoned_orders table - restrict to admin users only
CREATE POLICY "Admin users can manage abandoned orders" ON public.abandoned_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  )
);

-- Fix customers table - restrict to own data only  
CREATE POLICY "Customers can view own data" ON public.customers
FOR SELECT USING (email = auth.email());

CREATE POLICY "Customers can update own data" ON public.customers  
FOR UPDATE USING (email = auth.email())
WITH CHECK (email = auth.email());

-- Fix admin_users table - restrict to admins only
CREATE POLICY "Admins can view admin users" ON public.admin_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = auth.email()
  )
);

-- Fix affiliates table RLS policies
CREATE POLICY "Affiliates can view own data" ON public.affiliates
FOR SELECT USING (email = auth.email());

CREATE POLICY "Admin users can view all affiliates" ON public.affiliates  
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  )
);

-- Add missing password hash column for admin authentication
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;