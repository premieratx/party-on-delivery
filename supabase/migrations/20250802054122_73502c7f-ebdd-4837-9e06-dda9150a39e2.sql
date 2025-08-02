-- Create table for local product modifications
CREATE TABLE public.product_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  category TEXT,
  product_type TEXT,
  collection TEXT,
  modified_by_admin_id UUID,
  synced_to_shopify BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage product modifications" 
ON public.product_modifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Create index for faster queries
CREATE INDEX idx_product_modifications_shopify_id ON public.product_modifications(shopify_product_id);
CREATE INDEX idx_product_modifications_synced ON public.product_modifications(synced_to_shopify);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_modifications_updated_at
BEFORE UPDATE ON public.product_modifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();