-- Fix RLS policies for delivery_app_variations table to allow creation
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admin users can manage delivery app variations" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Allow all operations for now" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Service role can manage delivery app variations" ON public.delivery_app_variations;

-- Create new simplified policies that allow creation and management
CREATE POLICY "Anyone can create delivery apps" ON public.delivery_app_variations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update delivery apps" ON public.delivery_app_variations
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can view delivery apps" ON public.delivery_app_variations
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage all delivery apps" ON public.delivery_app_variations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure admin users can do everything
CREATE POLICY "Admin users can manage delivery apps" ON public.delivery_app_variations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email()
  )
);