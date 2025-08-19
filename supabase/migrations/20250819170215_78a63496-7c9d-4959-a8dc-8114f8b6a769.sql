-- Create order_drafts table for storing order details during payment processing
CREATE TABLE IF NOT EXISTS public.order_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_discount JSONB DEFAULT NULL,
  tip_amount NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  sales_tax NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  affiliate_code TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_drafts ENABLE ROW LEVEL SECURITY;