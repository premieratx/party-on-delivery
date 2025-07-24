-- Fix cache key constraint issue by allowing updates on conflict
-- This will prevent the duplicate key violations causing function failures

-- First, let's see what unique constraints exist
-- The issue is that multiple functions are trying to cache data simultaneously

-- We need to modify how the cache is managed to handle concurrent writes
-- Let's add a function to safely upsert cache entries

CREATE OR REPLACE FUNCTION public.safe_cache_upsert(
  cache_key TEXT,
  cache_data JSONB,
  expires_timestamp BIGINT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Use INSERT ... ON CONFLICT to handle concurrent writes safely
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
$$;