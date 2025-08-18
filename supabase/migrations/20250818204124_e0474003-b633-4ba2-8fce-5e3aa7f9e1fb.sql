-- FIX CRITICAL DATABASE ERRORS

-- 1. Fix missing 'vendor' column in shopify_products_cache table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shopify_products_cache' 
        AND column_name = 'vendor'
    ) THEN
        ALTER TABLE public.shopify_products_cache 
        ADD COLUMN vendor TEXT;
    END IF;
END $$;

-- 2. Fix cache table duplicate key issues by improving upsert function
CREATE OR REPLACE FUNCTION public.safe_cache_upsert(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_id UUID;
BEGIN
  -- Use proper upsert with ON CONFLICT to prevent duplicates
  INSERT INTO public.cache (key, data, expires_at)
  VALUES (cache_key, cache_data, expires_timestamp)
  ON CONFLICT (key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$function$;

-- 3. Add missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_products_cache_updated_at ON public.shopify_products_cache(updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_products_cache_title ON public.shopify_products_cache(title);

-- 4. Fix products_cache_simple table structure for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products_cache_simple'
    ) THEN
        CREATE TABLE public.products_cache_simple (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            cache_key VARCHAR NOT NULL UNIQUE,
            data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.products_cache_simple ENABLE ROW LEVEL SECURITY;
        
        -- Add policy for system access
        CREATE POLICY "System can manage products cache" 
        ON public.products_cache_simple 
        FOR ALL 
        USING (
          (auth.jwt() ->> 'role')::text = 'service_role'::text OR
          EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email())
        );
    END IF;
END $$;

-- 5. Create optimized cache cleanup function
CREATE OR REPLACE FUNCTION public.optimized_cache_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete expired cache entries in batches to prevent locks
  DELETE FROM public.cache 
  WHERE id IN (
    SELECT id FROM public.cache 
    WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000 
    LIMIT 1000
  );
  
  -- Delete old products cache
  DELETE FROM public.products_cache_simple 
  WHERE created_at < NOW() - INTERVAL '15 minutes';
  
  -- Update statistics
  ANALYZE public.cache;
  ANALYZE public.shopify_products_cache;
END;
$function$;

-- 6. Fix timestamp handling for bigint fields
CREATE OR REPLACE FUNCTION public.safe_timestamp_to_bigint(ts TIMESTAMP WITH TIME ZONE)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  RETURN EXTRACT(EPOCH FROM ts) * 1000;
END;
$function$;