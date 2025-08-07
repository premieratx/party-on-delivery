-- Create table for storing standardized Shopify orders from webhooks
CREATE TABLE IF NOT EXISTS public.shopify_orders_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_order_id TEXT NOT NULL UNIQUE,
  order_number TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  total_price NUMERIC(10,2),
  subtotal_price NUMERIC(10,2),
  total_tax NUMERIC(10,2),
  shipping_address JSONB,
  billing_address JSONB,
  line_items JSONB,
  financial_status TEXT,
  fulfillment_status TEXT,
  note TEXT,
  tags TEXT,
  source_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_shopify_orders_cache_shopify_order_id 
ON public.shopify_orders_cache(shopify_order_id);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_cache_customer_email 
ON public.shopify_orders_cache(customer_email);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_cache_financial_status 
ON public.shopify_orders_cache(financial_status);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_cache_created_at 
ON public.shopify_orders_cache(created_at DESC);

-- Enable RLS
ALTER TABLE public.shopify_orders_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can view all shopify orders" 
ON public.shopify_orders_cache 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "System can insert shopify orders" 
ON public.shopify_orders_cache 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update shopify orders" 
ON public.shopify_orders_cache 
FOR UPDATE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_shopify_orders_cache_updated_at
BEFORE UPDATE ON public.shopify_orders_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();