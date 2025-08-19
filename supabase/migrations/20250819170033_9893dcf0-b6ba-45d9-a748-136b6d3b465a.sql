-- Fix security issues found by linter

-- 1. Create missing policies for checkout_flow_documentation table
-- (The table was created with RLS enabled but had incomplete policies)

-- Add insert policy for service role to manage documentation programmatically
CREATE POLICY "Service role can insert checkout documentation" ON public.checkout_flow_documentation
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add update policy for admins to modify documentation
CREATE POLICY "Admins can update checkout documentation" ON public.checkout_flow_documentation
FOR UPDATE USING (is_admin_user_safe()) WITH CHECK (is_admin_user_safe());

-- 2. Fix function search paths for new function created
ALTER FUNCTION public.update_checkout_documentation_updated_at() 
SET search_path = 'public', 'pg_catalog';