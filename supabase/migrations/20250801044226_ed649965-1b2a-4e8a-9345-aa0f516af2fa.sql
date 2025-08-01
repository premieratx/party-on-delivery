-- Fix the cache table constraint issue by updating the safe_cache_upsert function
CREATE OR REPLACE FUNCTION public.safe_cache_upsert(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_id UUID;
BEGIN
  -- First try to update existing record
  UPDATE public.cache 
  SET 
    data = cache_data,
    expires_at = expires_timestamp,
    updated_at = now()
  WHERE key = cache_key
  RETURNING id INTO result_id;
  
  -- If no record was updated, insert new one
  IF result_id IS NULL THEN
    INSERT INTO public.cache (key, data, expires_at)
    VALUES (cache_key, cache_data, expires_timestamp)
    RETURNING id INTO result_id;
  END IF;
  
  RETURN result_id;
END;
$function$;

-- Clean up any duplicate cache entries
DELETE FROM public.cache a USING public.cache b
WHERE a.id < b.id AND a.key = b.key;