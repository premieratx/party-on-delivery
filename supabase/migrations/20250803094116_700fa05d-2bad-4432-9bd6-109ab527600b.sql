-- Fix group order functionality and ensure delivery app variations table exists
-- First ensure the delivery_app_variations table has proper structure
CREATE TABLE IF NOT EXISTS public.delivery_app_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  app_slug TEXT NOT NULL UNIQUE,
  collections_config JSONB NOT NULL DEFAULT '{"tabs": [], "tab_count": 5}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Admin can manage all delivery apps
CREATE POLICY "Admin users can manage delivery app variations" 
ON public.delivery_app_variations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Public can view active delivery apps
CREATE POLICY "Public can view active delivery app variations" 
ON public.delivery_app_variations 
FOR SELECT 
USING (is_active = true);

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER update_delivery_app_variations_updated_at
BEFORE UPDATE ON public.delivery_app_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix join_group_order_fixed function to handle better group order management
CREATE OR REPLACE FUNCTION public.join_group_order_fixed(p_share_token uuid, p_user_email text, p_user_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_participants JSONB;
  v_existing_participant JSONB;
BEGIN
  -- Find the group order with lock
  SELECT * INTO v_order 
  FROM customer_orders 
  WHERE share_token = p_share_token 
    AND is_group_order = true
    AND status IN ('pending', 'confirmed')
    AND delivery_date >= CURRENT_DATE
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Group order not found, expired, or already completed'
    );
  END IF;
  
  -- Initialize or get current participants
  v_participants = COALESCE(v_order.group_participants, '[]'::jsonb);
  
  -- Check if user already joined by email
  SELECT value INTO v_existing_participant
  FROM jsonb_array_elements(v_participants) 
  WHERE value ->> 'email' = p_user_email;
  
  IF v_existing_participant IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true, 
      'order_id', v_order.id,
      'already_joined', true,
      'message', 'Already part of this group order'
    );
  END IF;
  
  -- Add new participant with timestamp
  v_participants = v_participants || jsonb_build_object(
    'email', p_user_email,
    'name', p_user_name,
    'joined_at', NOW(),
    'items', '[]'::jsonb,
    'subtotal', 0
  );
  
  -- Update the order
  UPDATE customer_orders 
  SET 
    group_participants = v_participants,
    updated_at = NOW()
  WHERE id = v_order.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'share_token', v_order.share_token,
    'delivery_date', v_order.delivery_date,
    'delivery_time', v_order.delivery_time,
    'delivery_address', v_order.delivery_address,
    'participant_count', jsonb_array_length(v_participants)
  );
END;
$$;