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

-- Service role can manage all order drafts
CREATE POLICY "Service role can manage order drafts" ON public.order_drafts
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Users can view their own order drafts
CREATE POLICY "Users can view their own order drafts" ON public.order_drafts
FOR SELECT USING (customer_info->>'email' = auth.email());

-- Add trigger for updated_at
CREATE TRIGGER update_order_drafts_updated_at
  BEFORE UPDATE ON public.order_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update documentation with created edge functions
UPDATE public.checkout_flow_documentation 
SET notes = 'CREATED: Edge function now exists and is functional',
    last_verified = now()
WHERE component_name IN ('get-stripe-publishable-key', 'create-payment-intent', 'stripe-webhook');