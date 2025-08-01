-- Create a comprehensive recent_orders table for fast order lookup
CREATE TABLE IF NOT EXISTS public.recent_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  share_token UUID,
  order_number TEXT,
  customer_email TEXT,
  customer_name TEXT,
  delivery_address JSONB,
  delivery_date DATE,
  delivery_time TEXT,
  total_amount NUMERIC,
  order_status TEXT DEFAULT 'pending',
  is_group_order BOOLEAN DEFAULT false,
  group_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.recent_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for recent_orders
CREATE POLICY "Users can view orders by session or email" 
ON public.recent_orders FOR SELECT 
USING (
  session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text)
  OR customer_email = auth.email()
  OR share_token IS NOT NULL
);

CREATE POLICY "System can insert recent orders" 
ON public.recent_orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own recent orders" 
ON public.recent_orders FOR UPDATE 
USING (
  session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text)
  OR customer_email = auth.email()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_recent_orders_session_id ON public.recent_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_recent_orders_share_token ON public.recent_orders(share_token);
CREATE INDEX IF NOT EXISTS idx_recent_orders_payment_intent ON public.recent_orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_recent_orders_customer_email ON public.recent_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_recent_orders_expires_at ON public.recent_orders(expires_at);

-- Ensure customer_orders has proper indexes for group order lookups
CREATE INDEX IF NOT EXISTS idx_customer_orders_share_token ON public.customer_orders(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_orders_group_order ON public.customer_orders(is_group_order, share_token) WHERE is_group_order = true;

-- Create an improved function to reliably find group orders
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
  is_active BOOLEAN
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
    (co.status != 'cancelled' AND co.delivery_date >= CURRENT_DATE) as is_active
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