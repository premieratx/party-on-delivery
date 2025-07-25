-- Create table to store product categorizations
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  assigned_category TEXT NOT NULL CHECK (assigned_category IN ('beer', 'wine', 'liquor', 'cocktails', 'other')),
  subcategory TEXT,
  confidence_score NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shopify_product_id)
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for product categories
CREATE POLICY "Product categories are publicly readable" 
ON public.product_categories 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage product categories" 
ON public.product_categories 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();