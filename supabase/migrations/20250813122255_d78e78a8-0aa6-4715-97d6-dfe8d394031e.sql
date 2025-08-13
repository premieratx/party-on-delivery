-- Tighten RLS on customer_orders and sanitize public shared order access

-- 1) Remove public SELECT on shared orders via share_token
DROP POLICY IF EXISTS "Anyone can view shared orders via share_token" ON public.customer_orders;

-- 2) Allow customers to view only their own orders (by email in delivery_address or linked customer_id)
CREATE POLICY "Customers can view their own orders"
ON public.customer_orders
FOR SELECT
USING (
  (delivery_address->>'email') = auth.email()
  OR EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_id AND c.email = auth.email()
  )
);

-- 3) Update the get_group_order_details function to avoid exposing customer_email publicly
CREATE OR REPLACE FUNCTION public.get_group_order_details(p_share_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Build successful response (omit customer_email to reduce PII exposure)
  result := jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', order_record.order_id,
      'order_number', order_record.order_number,
      'delivery_date', order_record.delivery_date,
      'delivery_time', order_record.delivery_time,
      'delivery_address', order_record.delivery_address,
      'customer_name', order_record.customer_name,
      'total_amount', order_record.total_amount,
      'is_active', order_record.is_active,
      'group_participants', order_record.group_participants
    )
  );
  
  RETURN result;
END;
$function$;