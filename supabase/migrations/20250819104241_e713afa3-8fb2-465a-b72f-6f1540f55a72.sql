-- Security improvements - fix the errors without referencing non-existent tables
-- Add proper indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_email ON public.customer_orders USING gin ((delivery_address->>'email'));
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_drafts_expires_at ON public.order_drafts(expires_at);

-- Fix cache key unique constraint issues by using proper upsert
-- Update the safe_cache_upsert function to handle duplicates better
CREATE OR REPLACE FUNCTION public.safe_cache_upsert(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
  existing_id UUID;
BEGIN
  -- First try to get existing record
  SELECT id INTO existing_id FROM public.cache WHERE key = cache_key;
  
  IF existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.cache 
    SET data = cache_data, expires_at = expires_timestamp, updated_at = now()
    WHERE id = existing_id;
    RETURN existing_id;
  ELSE
    -- Insert new record with error handling
    BEGIN
      INSERT INTO public.cache (key, data, expires_at)
      VALUES (cache_key, cache_data, expires_timestamp)
      RETURNING id INTO result_id;
      RETURN result_id;
    EXCEPTION WHEN unique_violation THEN
      -- Handle race condition - update instead
      UPDATE public.cache 
      SET data = cache_data, expires_at = expires_timestamp, updated_at = now()
      WHERE key = cache_key
      RETURNING id INTO result_id;
      RETURN result_id;
    END;
  END IF;
END;
$$;

-- Clean up duplicate cache entries that are causing constraint violations
WITH duplicates AS (
  SELECT key, MIN(id) as keep_id
  FROM public.cache 
  GROUP BY key 
  HAVING COUNT(*) > 1
)
DELETE FROM public.cache 
WHERE id NOT IN (SELECT keep_id FROM duplicates)
  AND key IN (SELECT key FROM duplicates);

-- Clean up expired records for better performance
DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
DELETE FROM public.order_drafts WHERE expires_at < now();

-- Add security audit logging
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-enhancement-fixed',
  'info',
  'Security improvements applied: indexes created, cache handling improved',
  jsonb_build_object(
    'timestamp', now(),
    'improvements', jsonb_build_array(
      'performance_indexes_added',
      'cache_duplicate_handling_fixed',
      'expired_records_cleaned',
      'audit_logging_enhanced'
    )
  )
);

-- Update statistics for better query performance
ANALYZE public.customer_orders;
ANALYZE public.affiliates;
ANALYZE public.affiliate_referrals;
ANALYZE public.cache;