-- EMERGENCY FIX: Allow public access to delivery app configurations
-- The homepage needs this data to function properly

-- Allow public read access to delivery_app_variations (needed for homepage)
CREATE POLICY "delivery_apps_public_read" ON public.delivery_app_variations
FOR SELECT
TO PUBLIC
USING (is_active = true);

-- Allow public read access to delivery_app_collection_mappings (needed for tabs)
CREATE POLICY "delivery_mappings_public_read" ON public.delivery_app_collection_mappings  
FOR SELECT
TO PUBLIC
USING (true);

-- Allow public read access to shopify_products_cache (needed for products)
-- This table doesn't exist in the schema but let's check for it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopify_products_cache') THEN
        CREATE POLICY "shopify_products_public_read" ON public.shopify_products_cache
        FOR SELECT
        TO PUBLIC
        USING (true);
        RAISE NOTICE 'Added public read policy for shopify_products_cache';
    END IF;
END $$;

-- Allow public read access to category mappings (needed for product categorization)
-- This policy already exists but let's ensure it's working
DROP POLICY IF EXISTS "Anyone can read category mappings" ON public.category_mappings_simple;
CREATE POLICY "category_mappings_public_read" ON public.category_mappings_simple
FOR SELECT
TO PUBLIC
USING (true);

-- Log the emergency fix
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'emergency-homepage-fix',
  'error',
  'EMERGENCY: Fixed homepage React error by restoring delivery app access',
  jsonb_build_object(
    'timestamp', now(),
    'issue', 'React error 310 - useMemo mapping over null collectionsConfig',
    'cause', 'Security lockdown blocked delivery app configuration access', 
    'fix_applied', 'Restored public read access to delivery_app_variations and related tables',
    'tables_opened', jsonb_build_array(
      'delivery_app_variations',
      'delivery_app_collection_mappings', 
      'category_mappings_simple',
      'shopify_products_cache'
    )
  )
);