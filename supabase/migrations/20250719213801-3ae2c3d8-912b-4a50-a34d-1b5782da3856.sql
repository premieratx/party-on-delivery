-- Create table to link multiple Shopify orders together for delivery bundling
CREATE TABLE public.order_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zip TEXT,
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table to track individual Shopify orders within a group
CREATE TABLE public.shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_group_id UUID REFERENCES public.order_groups(id) ON DELETE CASCADE,
  shopify_order_id TEXT NOT NULL,
  shopify_order_number TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for order_groups
CREATE POLICY "Users can view their own order groups" 
ON public.order_groups 
FOR SELECT 
USING (user_id = auth.uid() OR customer_email = auth.email());

CREATE POLICY "Users can create their own order groups" 
ON public.order_groups 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own order groups" 
ON public.order_groups 
FOR UPDATE 
USING (user_id = auth.uid() OR customer_email = auth.email());

-- Create policies for shopify_orders
CREATE POLICY "Users can view orders in their groups" 
ON public.shopify_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.order_groups 
    WHERE id = order_group_id 
    AND (user_id = auth.uid() OR customer_email = auth.email())
  )
);

CREATE POLICY "Edge functions can insert shopify orders" 
ON public.shopify_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update shopify orders" 
ON public.shopify_orders 
FOR UPDATE 
USING (true);

-- Add updated_at trigger for order_groups
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_groups_updated_at
    BEFORE UPDATE ON public.order_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();