-- Fix remaining database issues (skip existing policies)

-- 1. Ensure shopify_products_cache has all necessary columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'vendor') THEN
        ALTER TABLE public.shopify_products_cache ADD COLUMN vendor TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'product_type') THEN
        ALTER TABLE public.shopify_products_cache ADD COLUMN product_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'tags') THEN
        ALTER TABLE public.shopify_products_cache ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'collection_handles') THEN
        ALTER TABLE public.shopify_products_cache ADD COLUMN collection_handles TEXT[];
    END IF;
END $$;

-- 2. Create performance_log_simple table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'performance_log_simple'
    ) THEN
        CREATE TABLE public.performance_log_simple (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            operation VARCHAR NOT NULL,
            duration_ms INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.performance_log_simple ENABLE ROW LEVEL SECURITY;
        
        -- Add policy for system access
        CREATE POLICY "System can manage performance logs" 
        ON public.performance_log_simple 
        FOR ALL 
        USING (
          (auth.jwt() ->> 'role')::text = 'service_role'::text OR
          EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email())
        );
    END IF;
END $$;

-- 3. Create missing category mappings if none exist
INSERT INTO public.category_mappings_simple (collection_handle, app_category) VALUES
  ('spirits', 'spirits'),
  ('beer', 'beer'),
  ('wine', 'wine'),
  ('mixers', 'mixers'),
  ('snacks', 'snacks'),
  ('tailgate-beer', 'beer'),
  ('seltzer-collection', 'seltzer'),
  ('cocktail-kits', 'cocktails'),
  ('party-supplies', 'supplies'),
  ('champagne', 'wine'),
  ('bourbon-rye', 'spirits'),
  ('gin-rum', 'spirits'),
  ('tequila-mezcal', 'spirits')
ON CONFLICT (collection_handle) DO NOTHING;

-- 4. Trigger a cache refresh
DELETE FROM public.cache WHERE key LIKE 'shopify_%';
DELETE FROM public.products_cache_simple WHERE cache_key LIKE 'shopify_%';