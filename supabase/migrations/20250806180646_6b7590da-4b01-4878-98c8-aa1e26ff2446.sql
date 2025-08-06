-- Fix remaining database functions with missing search_path
CREATE OR REPLACE FUNCTION public.find_group_order_by_token(p_share_token text)
RETURNS TABLE(order_id uuid, order_number text, delivery_date date, delivery_time text, delivery_address jsonb, customer_name text, customer_email text, total_amount numeric, is_active boolean, group_participants jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.join_group_order(p_share_token uuid, p_customer_email text, p_customer_name text, p_line_items jsonb, p_subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_order RECORD;
  new_participant JSONB;
  updated_participants JSONB;
  result JSONB;
BEGIN
  -- Find the original group order
  SELECT * INTO target_order
  FROM public.customer_orders 
  WHERE share_token = p_share_token 
  AND status != 'cancelled'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group order not found');
  END IF;
  
  -- Check if customer is already a participant
  IF target_order.group_participants::jsonb ? p_customer_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer already in this group order');
  END IF;
  
  -- Create new participant object
  new_participant := jsonb_build_object(
    'email', p_customer_email,
    'name', p_customer_name,
    'items', p_line_items,
    'subtotal', p_subtotal,
    'joined_at', now()
  );
  
  -- Add to participants array
  updated_participants := COALESCE(target_order.group_participants, '[]'::jsonb) || new_participant;
  
  -- Update the order with new participant and totals
  UPDATE public.customer_orders
  SET 
    group_participants = updated_participants,
    is_group_order = true,
    line_items = target_order.line_items::jsonb || p_line_items,
    subtotal = target_order.subtotal + p_subtotal,
    total_amount = target_order.total_amount + p_subtotal, -- Simplified, should recalculate taxes/fees
    updated_at = now()
  WHERE id = target_order.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'group_order_id', target_order.group_order_id,
    'share_token', target_order.share_token,
    'original_order_id', target_order.id
  );
END;
$function$;