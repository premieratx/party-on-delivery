-- Fix cache duplicate key issues and improve instant loading
-- First, let's fix the cache table to handle concurrent inserts properly
CREATE OR REPLACE FUNCTION public.upsert_cache_entry(
  cache_key_param text,
  cache_data_param jsonb,
  expires_timestamp_param bigint
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Use INSERT ... ON CONFLICT for atomic upsert
  INSERT INTO public.cache (key, data, expires_at)
  VALUES (cache_key_param, cache_data_param, expires_timestamp_param)
  ON CONFLICT (key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;

-- Create optimized products view for instant loading
CREATE OR REPLACE VIEW public.instant_products_view AS
SELECT 
  spc.id,
  spc.title,
  spc.price,
  spc.image,
  spc.handle,
  spc.variants,
  spc.collection_handles,
  spc.category,
  spc.updated_at,
  -- Add category mapping for better filtering
  COALESCE(cm.app_category, 'other') as app_category
FROM shopify_products_cache spc
LEFT JOIN category_mappings_simple cm ON 
  EXISTS (
    SELECT 1 FROM unnest(spc.collection_handles) as ch(handle)
    WHERE ch.handle ILIKE '%' || cm.collection_handle || '%'
  )
ORDER BY spc.updated_at DESC;

-- Improve cache cleanup to prevent accumulation
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache_optimized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up expired cache entries
  DELETE FROM public.cache 
  WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
  
  -- Clean up old product cache (keep only last 2 hours)
  DELETE FROM public.shopify_products_cache 
  WHERE updated_at < now() - INTERVAL '2 hours';
  
  -- Vacuum the tables for better performance
  VACUUM ANALYZE public.cache;
  VACUUM ANALYZE public.shopify_products_cache;
END;
$$;

-- Create index for faster cache queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cache_key_expires 
ON public.cache(key, expires_at) 
WHERE expires_at > EXTRACT(EPOCH FROM now()) * 1000;

-- Create index for instant products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_products_cache_category 
ON public.shopify_products_cache USING GIN(collection_handles);

-- Create index for better category mapping performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_mappings_handle 
ON public.category_mappings_simple(collection_handle);