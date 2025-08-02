-- Create or update product_modifications table
CREATE TABLE IF NOT EXISTS public.product_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  product_title TEXT NOT NULL,
  category TEXT,
  product_type TEXT,
  collection TEXT,
  collections JSONB DEFAULT '[]'::jsonb,
  modified_by_admin_id UUID,
  synced_to_shopify BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin users can manage product modifications" 
ON public.product_modifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Create policy for system operations
CREATE POLICY "System can manage product modifications" 
ON public.product_modifications 
FOR ALL 
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER update_product_modifications_updated_at
  BEFORE UPDATE ON public.product_modifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();