-- Create custom product categories table
CREATE TABLE public.custom_product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  products TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage custom categories" 
ON public.custom_product_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "Custom categories are publicly readable" 
ON public.custom_product_categories 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_product_categories_updated_at
  BEFORE UPDATE ON public.custom_product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();