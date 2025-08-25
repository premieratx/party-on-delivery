-- NUCLEAR OPTION: Remove ALL existing policies and create ONE simple policy
DROP POLICY IF EXISTS "allow_read_delivery_apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Admin access for delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "delivery_app_variations_unrestricted" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "anon_read_delivery_apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "authenticated_read_delivery_apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "service_manage_delivery_apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Admin and service role can manage all delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Public can view active delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Admins can manage delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Anyone can read delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Anyone can create delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Anyone can update delivery apps" ON public.delivery_app_variations;
DROP POLICY IF EXISTS "Anyone can delete delivery apps" ON public.delivery_app_variations;

-- Create ONE SINGLE policy that allows everything
CREATE POLICY "delivery_apps_unrestricted_access" 
ON public.delivery_app_variations 
FOR ALL 
USING (true)
WITH CHECK (true);