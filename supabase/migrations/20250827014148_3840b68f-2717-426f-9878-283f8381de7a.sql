-- Fix RLS security issues
ALTER TABLE public.data_integrity_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Add missing policies for data_integrity_checks
CREATE POLICY "Admins can manage data integrity checks" 
ON public.data_integrity_checks 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Add missing policies for delivery_app_variations 
CREATE POLICY "Public can read active delivery apps" 
ON public.delivery_app_variations 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage delivery apps" 
ON public.delivery_app_variations 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.cleanup_product_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  DELETE FROM products_cache_simple 
  WHERE created_at < NOW() - INTERVAL '15 minutes';
END;
$$;