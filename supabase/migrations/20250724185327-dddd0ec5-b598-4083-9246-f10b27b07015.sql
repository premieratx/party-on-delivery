-- Add group order functionality to customer_orders table
-- Add unique share token for each order that can be used as a shareable link
ALTER TABLE public.customer_orders 
ADD COLUMN IF NOT EXISTS group_order_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_participants JSONB DEFAULT '[]'::jsonb;

-- Create index for faster group order lookups
CREATE INDEX IF NOT EXISTS idx_customer_orders_group_order_id ON public.customer_orders(group_order_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_share_token ON public.customer_orders(share_token);

-- Function to join an existing group order
CREATE OR REPLACE FUNCTION public.join_group_order(
  p_share_token UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_line_items JSONB,
  p_subtotal NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;