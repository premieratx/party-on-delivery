-- Create table to cache Shopify discount codes (fixed version)
CREATE TABLE IF NOT EXISTS public.shopify_discount_codes_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_discount_id TEXT UNIQUE NOT NULL,
  shopify_price_rule_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('fixed_amount', 'percentage')),
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER,
  minimum_order_amount NUMERIC,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  once_per_customer BOOLEAN DEFAULT false,
  target_type TEXT,
  customer_selection TEXT,
  is_recomsale_code BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shopify_discount_codes_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read active discount codes"
ON public.shopify_discount_codes_cache
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage discount codes"
ON public.shopify_discount_codes_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage discount codes"
ON public.shopify_discount_codes_cache
FOR ALL
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.shopify_discount_codes_cache(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_recomsale ON public.shopify_discount_codes_cache(is_recomsale_code) WHERE is_recomsale_code = true;
CREATE INDEX IF NOT EXISTS idx_discount_codes_value_type ON public.shopify_discount_codes_cache(value_type);
CREATE INDEX IF NOT EXISTS idx_discount_codes_dates ON public.shopify_discount_codes_cache(starts_at, ends_at);

-- Create function to get active discount codes
CREATE OR REPLACE FUNCTION public.get_active_discount_codes(
  recomsale_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  code TEXT,
  title TEXT,
  value TEXT,
  value_type TEXT,
  minimum_order_amount NUMERIC,
  usage_count INTEGER,
  usage_limit INTEGER,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  once_per_customer BOOLEAN,
  is_recomsale_code BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  WHERE (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
    AND (NOT recomsale_only OR sdc.is_recomsale_code = true)
  ORDER BY sdc.created_at DESC;
END;
$$;

-- Create function to validate discount code
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  discount_code_param TEXT,
  order_subtotal_param NUMERIC DEFAULT 0
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount NUMERIC,
  error_message TEXT,
  code_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
  calculated_discount NUMERIC := 0;
BEGIN
  -- Find the discount code
  SELECT * INTO code_record
  FROM public.shopify_discount_codes_cache
  WHERE UPPER(code) = UPPER(discount_code_param)
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
  LIMIT 1;
  
  -- Check if code exists
  IF code_record IS NULL THEN
    RETURN QUERY SELECT 
      false as is_valid, 
      0::NUMERIC as discount_amount, 
      'Invalid or expired discount code'::TEXT as error_message,
      '{}'::JSONB as code_details;
    RETURN;
  END IF;
  
  -- Check minimum order amount
  IF code_record.minimum_order_amount IS NOT NULL 
     AND order_subtotal_param < code_record.minimum_order_amount THEN
    RETURN QUERY SELECT 
      false as is_valid, 
      0::NUMERIC as discount_amount, 
      ('Minimum order amount of $' || code_record.minimum_order_amount || ' required')::TEXT as error_message,
      row_to_json(code_record)::JSONB as code_details;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF code_record.usage_limit IS NOT NULL 
     AND code_record.usage_count >= code_record.usage_limit THEN
    RETURN QUERY SELECT 
      false as is_valid, 
      0::NUMERIC as discount_amount, 
      'Discount code usage limit exceeded'::TEXT as error_message,
      row_to_json(code_record)::JSONB as code_details;
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF code_record.value_type = 'percentage' THEN
    calculated_discount := (order_subtotal_param * code_record.value::NUMERIC) / 100;
  ELSE
    calculated_discount := code_record.value::NUMERIC;
  END IF;
  
  -- Ensure discount doesn't exceed order total
  calculated_discount := LEAST(calculated_discount, order_subtotal_param);
  
  RETURN QUERY SELECT 
    true as is_valid, 
    calculated_discount as discount_amount, 
    NULL::TEXT as error_message,
    row_to_json(code_record)::JSONB as code_details;
END;
$$;

-- Create table for tracking discount code usage in our app
CREATE TABLE IF NOT EXISTS public.discount_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT,
  session_id TEXT,
  discount_code TEXT NOT NULL,
  order_id UUID,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  order_subtotal NUMERIC NOT NULL DEFAULT 0,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on usage tracking
ALTER TABLE public.discount_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all discount usage"
ON public.discount_code_usage
FOR SELECT
USING (is_admin_user_safe());

CREATE POLICY "Service role can manage discount usage"
ON public.discount_code_usage
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own discount usage"
ON public.discount_code_usage
FOR SELECT
USING (customer_email = auth.email());