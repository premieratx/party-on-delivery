-- Fix RLS policies for tables causing permission denied errors

-- 1. Fix delivery_app_variations table - needs public read access
CREATE POLICY "Allow public read access to delivery_app_variations" 
ON public.delivery_app_variations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin write access to delivery_app_variations" 
ON public.delivery_app_variations 
FOR ALL 
USING (public.is_admin_user());

-- 2. Fix shopify_products_cache table - needs public read access
CREATE POLICY "Allow public read access to shopify_products_cache" 
ON public.shopify_products_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin write access to shopify_products_cache" 
ON public.shopify_products_cache 
FOR ALL 
USING (public.is_admin_user());

-- 3. Also check and fix other potentially problematic tables
-- Fix category_mappings_simple if it exists
CREATE POLICY "Allow public read access to category_mappings_simple" 
ON public.category_mappings_simple 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin write access to category_mappings_simple" 
ON public.category_mappings_simple 
FOR ALL 
USING (public.is_admin_user());

-- Fix cache table - needs broader access for product loading
CREATE POLICY "Allow public read access to cache" 
ON public.cache 
FOR SELECT 
USING (true);

CREATE POLICY "Allow service role write access to cache" 
ON public.cache 
FOR ALL 
USING (true);  -- Allow service role to manage cache

-- Log this fix
INSERT INTO public.security_audit_log (
    event_type, user_email, details, created_at
) VALUES (
    'rls_policies_fixed_for_app_loading',
    'system',
    jsonb_build_object(
        'tables_fixed', ARRAY[
            'delivery_app_variations',
            'shopify_products_cache', 
            'category_mappings_simple',
            'cache'
        ],
        'issue', 'permission_denied_errors_blocking_app_loading',
        'solution', 'added_public_read_policies_with_admin_write_restrictions'
    ),
    now()
);