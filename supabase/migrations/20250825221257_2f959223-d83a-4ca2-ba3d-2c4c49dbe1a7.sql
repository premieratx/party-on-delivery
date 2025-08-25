-- Add RLS policies for delivery_app_variations table to allow admin access

-- Enable RLS on the table if not already enabled
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for delivery apps management
CREATE POLICY "Admins can manage delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
USING (is_admin_user_safe()) 
WITH CHECK (is_admin_user_safe());

-- Allow public read access to active delivery apps
CREATE POLICY "Public can read active delivery apps" 
ON public.delivery_app_variations 
FOR SELECT 
USING (is_active = true);