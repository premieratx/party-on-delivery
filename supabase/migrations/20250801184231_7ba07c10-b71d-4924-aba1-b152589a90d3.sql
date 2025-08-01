-- First, let's ensure we have proper indexes on customer_orders for group order lookups
CREATE INDEX IF NOT EXISTS idx_customer_orders_share_token ON public.customer_orders(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_orders_group_order ON public.customer_orders(is_group_order, share_token) WHERE is_group_order = true;

-- Create an improved function to reliably find group orders with better error handling
CREATE OR REPLACE FUNCTION public.find_group_order_by_token(p_share_token TEXT)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  delivery_date DATE,
  delivery_time TEXT,
  delivery_address JSONB,
  customer_name TEXT,
  customer_email TEXT,
  total_amount NUMERIC,
  is_active BOOLEAN,
  group_participants JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_uuid UUID;
BEGIN
  -- Try to parse the token as UUID
  BEGIN
    token_uuid := p_share_token::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    -- If not a valid UUID, return empty result
    RETURN;
  END;
  
  -- Look for active group orders with this share token
  RETURN QUERY
  SELECT 
    co.id,
    co.order_number,
    co.delivery_date,
    co.delivery_time,
    co.delivery_address,
    COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') as customer_name,
    COALESCE(c.email, co.session_id) as customer_email,
    co.total_amount,
    (co.status != 'cancelled' AND co.delivery_date >= CURRENT_DATE) as is_active,
    COALESCE(co.group_participants, '[]'::jsonb) as group_participants
  FROM public.customer_orders co
  LEFT JOIN public.customers c ON co.customer_id = c.id
  WHERE co.share_token = token_uuid
    AND co.is_group_order = true
    AND co.status != 'cancelled'
    AND co.delivery_date >= CURRENT_DATE
  ORDER BY co.created_at DESC
  LIMIT 1;
END;
$$;

-- Create edge function to get group order details with proper validation
CREATE OR REPLACE FUNCTION public.get_group_order_details(p_share_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record RECORD;
  result JSONB;
BEGIN
  -- Use the find function to get the order
  SELECT * INTO order_record
  FROM public.find_group_order_by_token(p_share_token)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Group order not found or expired',
      'token_searched', p_share_token
    );
  END IF;
  
  -- Build successful response
  result := jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', order_record.order_id,
      'order_number', order_record.order_number,
      'delivery_date', order_record.delivery_date,
      'delivery_time', order_record.delivery_time,
      'delivery_address', order_record.delivery_address,
      'customer_name', order_record.customer_name,
      'customer_email', order_record.customer_email,
      'total_amount', order_record.total_amount,
      'is_active', order_record.is_active,
      'group_participants', order_record.group_participants
    )
  );
  
  RETURN result;
END;
$$;