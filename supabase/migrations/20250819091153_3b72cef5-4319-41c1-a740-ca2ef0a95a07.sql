-- Create table for storing processed product data with enhanced package information
CREATE TABLE IF NOT EXISTS public.processed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id TEXT NOT NULL UNIQUE,
  original_title TEXT NOT NULL,
  clean_title TEXT NOT NULL,
  package_description TEXT,
  package_count INTEGER,
  unit_size TEXT,
  unit_type TEXT, -- 'oz', 'ml', 'L', 'can', 'bottle'
  display_subtitle TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_products_shopify_id ON public.processed_products(shopify_product_id);

-- Enable RLS
ALTER TABLE public.processed_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Processed products are publicly readable" ON public.processed_products
  FOR SELECT USING (true);

CREATE POLICY "System can manage processed products" ON public.processed_products
  FOR ALL USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_processed_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER processed_products_updated_at
    BEFORE UPDATE ON public.processed_products
    FOR EACH ROW
    EXECUTE FUNCTION update_processed_products_updated_at();