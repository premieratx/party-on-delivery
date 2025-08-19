-- Security improvements - fix the errors with correct index types
-- Add proper indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_email ON public.customer_orders ((delivery_address->>'email'));
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_drafts_expires_at ON public.order_drafts(expires_at);

-- Fix cache key unique constraint issues by improving the existing function
CREATE OR REPLACE FUNCTION public.safe_cache_upsert(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Clean up expired records for better performance and security
DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;

-- Clean up expired order drafts
DELETE FROM public.order_drafts WHERE expires_at < now() - INTERVAL '1 day';

-- Add security audit logging
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-enhancement-v2',
  'info',
  'Security improvements applied: proper indexes created, cache handling improved',
  jsonb_build_object(
    'timestamp', now(),
    'improvements', jsonb_build_array(
      'performance_indexes_added',
      'cache_upsert_improved',
      'expired_records_cleaned'
    )
  )
);

-- Update statistics for better query performance
ANALYZE public.customer_orders;
ANALYZE public.affiliates; 
ANALYZE public.affiliate_referrals;
ANALYZE public.cache;