-- Fix missing variants column and security issues properly

-- 1. Add missing variants column to shopify_products_cache
ALTER TABLE public.shopify_products_cache 
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- 2. Drop and recreate instant_products_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.instant_products_view;
CREATE VIEW public.instant_products_view AS
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
  COALESCE(cm.app_category, 'other') as app_category
FROM shopify_products_cache spc
LEFT JOIN category_mappings_simple cm ON 
  EXISTS (
    SELECT 1 FROM unnest(spc.collection_handles) as ch(handle)
    WHERE ch.handle ILIKE '%' || cm.collection_handle || '%'
  );

-- Grant access to the view
GRANT SELECT ON public.instant_products_view TO anon, authenticated;

-- 3. Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "instant_products_public_read" ON public.shopify_products_cache;
CREATE POLICY "instant_products_public_read" ON public.shopify_products_cache
FOR SELECT USING (true);

-- 4. Fix functions with mutable search paths
CREATE OR REPLACE FUNCTION public.safe_cache_upsert(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
BEGIN
  UPDATE public.cache 
  SET data = cache_data, expires_at = expires_timestamp, updated_at = now()
  WHERE key = cache_key
  RETURNING id INTO result_id;
  
  IF result_id IS NULL THEN
    INSERT INTO public.cache (key, data, expires_at)
    VALUES (cache_key, cache_data, expires_timestamp)
    RETURNING id INTO result_id;
  END IF;
  
  RETURN result_id;
END;
$$;

-- 5. Fix the cleanup function with proper search path
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache_optimized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.cache 
  WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
  
  DELETE FROM public.shopify_products_cache 
  WHERE updated_at < now() - INTERVAL '2 hours';
  
  INSERT INTO public.optimization_logs (task_id, log_level, message, details)
  VALUES ('cache-cleanup', 'info', 'Cache cleanup completed', jsonb_build_object('timestamp', now()));
END;
$$;