-- Create abandoned_orders table to track incomplete checkouts
CREATE TABLE public.abandoned_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  affiliate_code TEXT,
  affiliate_id UUID,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC,
  total_amount NUMERIC,
  abandoned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.abandoned_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Affiliates can view their own abandoned orders" 
ON public.abandoned_orders 
FOR SELECT 
USING (affiliate_id IN ( SELECT affiliates.id FROM affiliates WHERE affiliates.email = auth.email()));

CREATE POLICY "System can insert abandoned orders" 
ON public.abandoned_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update abandoned orders" 
ON public.abandoned_orders 
FOR UPDATE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_abandoned_orders_affiliate_id ON public.abandoned_orders(affiliate_id);
CREATE INDEX idx_abandoned_orders_abandoned_at ON public.abandoned_orders(abandoned_at);
CREATE INDEX idx_abandoned_orders_session_id ON public.abandoned_orders(session_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_abandoned_orders_updated_at
BEFORE UPDATE ON public.abandoned_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();