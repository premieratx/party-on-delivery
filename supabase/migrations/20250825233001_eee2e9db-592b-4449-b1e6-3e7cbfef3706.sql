-- Add RLS policies for public access to delivery_app_variations table
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active delivery apps
CREATE POLICY "Public can read active delivery apps" 
ON public.delivery_app_variations 
FOR SELECT 
USING (is_active = true);

-- Allow service role and admin full access
CREATE POLICY "Service role can manage delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
USING (auth.role() = 'service_role' OR is_admin_user_safe())
WITH CHECK (auth.role() = 'service_role' OR is_admin_user_safe());