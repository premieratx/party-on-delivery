-- Fix the ambiguous column reference in get_active_discount_codes function
CREATE OR REPLACE FUNCTION public.get_active_discount_codes(recomsale_only boolean DEFAULT false)
RETURNS TABLE(
  code text, 
  title text, 
  value text, 
  value_type text, 
  minimum_order_amount numeric, 
  usage_count integer, 
  usage_limit integer, 
  starts_at timestamp with time zone, 
  ends_at timestamp with time zone, 
  once_per_customer boolean, 
  is_recomsale_code boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sdc.code,
    sdc.title,
    sdc.value,
    sdc.value_type,
    sdc.minimum_order_amount,
    sdc.usage_count,
    sdc.usage_limit,
    sdc.starts_at,
    sdc.ends_at,
    sdc.once_per_customer,
    sdc.is_recomsale_code
  FROM public.shopify_discount_codes_cache sdc
  WHERE (sdc.starts_at IS NULL OR sdc.starts_at <= NOW())
    AND (sdc.ends_at IS NULL OR sdc.ends_at > NOW())
    AND (NOT recomsale_only OR sdc.is_recomsale_code = true)
  ORDER BY sdc.created_at DESC;
END;
$$;