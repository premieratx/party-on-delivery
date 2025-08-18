-- Fix critical security and functional issues

-- 1. Add missing RLS policies for tables that have RLS enabled but no policies
CREATE POLICY "System can manage launch phases" 
ON public.launch_phases 
FOR ALL 
USING (
  (auth.jwt() ->> 'role')::text = 'service_role'::text OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email())
);

-- 2. Fix performance_log_simple table (if exists) or create it properly
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

-- 3. Ensure shopify_products_cache has all necessary columns
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

-- 4. Fix function search paths to be secure
CREATE OR REPLACE FUNCTION public.cleanup_product_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM products_cache_simple 
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_slow_operation(p_operation VARCHAR, p_duration_ms INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_duration_ms > 1000 THEN
    INSERT INTO performance_log_simple (operation, duration_ms)
    VALUES (p_operation, p_duration_ms);
  END IF;
END;
$function$;

-- 5. Optimize instant product cache function
CREATE OR REPLACE FUNCTION public.get_products_cached(p_category VARCHAR DEFAULT NULL, p_limit INTEGER DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cache_key VARCHAR;
  v_cached_data JSONB;
  v_products JSONB;
BEGIN
  v_cache_key := COALESCE('shopify_products_' || p_category, 'shopify_products_all') || '_' || p_limit;
  
  SELECT data INTO v_cached_data
  FROM products_cache_simple
  WHERE cache_key = v_cache_key
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_cached_data IS NOT NULL THEN
    RETURN v_cached_data;
  END IF;
  
  IF p_category IS NULL THEN
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM shopify_products_cache
      ORDER BY updated_at DESC
      LIMIT p_limit
    ) p;
  ELSE
    SELECT jsonb_agg(row_to_json(p.*))
    INTO v_products
    FROM (
      SELECT * FROM shopify_products_cache
      WHERE data::text ILIKE '%' || p_category || '%'
         OR title ILIKE '%' || p_category || '%'
      ORDER BY updated_at DESC
      LIMIT p_limit
    ) p;
  END IF;
  
  INSERT INTO products_cache_simple (cache_key, data)
  VALUES (v_cache_key, COALESCE(v_products, '[]'::jsonb))
  ON CONFLICT (cache_key) 
  DO UPDATE SET data = EXCLUDED.data, created_at = NOW();
  
  PERFORM cleanup_product_cache();
  
  RETURN COALESCE(v_products, '[]'::jsonb);
END;
$function$;

-- 6. Create missing category mappings if none exist
INSERT INTO public.category_mappings_simple (collection_handle, app_category) VALUES
  ('spirits', 'spirits'),
  ('beer', 'beer'),
  ('wine', 'wine'),
  ('mixers', 'mixers'),
  ('snacks', 'snacks')
ON CONFLICT (collection_handle) DO NOTHING;