-- Security improvements - fix the index issues
-- Add proper indexes for better performance and security (with correct types)
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_email ON public.customer_orders USING btree ((delivery_address->>'email'));
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_drafts_expires_at ON public.order_drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(key);

-- Clean up duplicate cache entries that are causing constraint violations
DELETE FROM public.cache c1 
WHERE EXISTS (
  SELECT 1 FROM public.cache c2 
  WHERE c2.key = c1.key AND c2.id > c1.id
);

-- Clean up expired records for better performance
DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;

-- Add security audit logging
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'security-enhancement-complete',
  'info',
  'Security improvements applied: indexes created, cache duplicates cleaned',
  jsonb_build_object(
    'timestamp', now(),
    'improvements', jsonb_build_array(
      'btree_indexes_added',
      'cache_duplicates_removed',
      'expired_records_cleaned'
    )
  )
);

-- Update statistics for better query performance
ANALYZE public.customer_orders;
ANALYZE public.affiliates;
ANALYZE public.affiliate_referrals;
ANALYZE public.cache;