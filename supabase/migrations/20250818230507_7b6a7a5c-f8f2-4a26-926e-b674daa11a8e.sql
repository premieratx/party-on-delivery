-- Add search_category column to shopify_products_cache for search functionality
-- This column will store normalized productType for search categorization

ALTER TABLE public.shopify_products_cache 
ADD COLUMN IF NOT EXISTS search_category TEXT;

-- Create index for faster search queries
CREATE INDEX IF NOT EXISTS idx_shopify_products_search_category 
ON public.shopify_products_cache(search_category);

-- Create index for faster delivery app queries (collection_handles)
CREATE INDEX IF NOT EXISTS idx_shopify_products_collection_handles 
ON public.shopify_products_cache USING GIN(collection_handles);

-- Update existing records with search_category based on product_type
UPDATE public.shopify_products_cache 
SET search_category = CASE 
  WHEN LOWER(product_type) LIKE '%beer%' THEN 'beer'
  WHEN LOWER(product_type) LIKE '%wine%' THEN 'wine'
  WHEN LOWER(product_type) LIKE '%spirit%' OR LOWER(product_type) LIKE '%whiskey%' OR LOWER(product_type) LIKE '%vodka%' OR LOWER(product_type) LIKE '%rum%' OR LOWER(product_type) LIKE '%gin%' OR LOWER(product_type) LIKE '%tequila%' THEN 'spirits'
  WHEN LOWER(product_type) LIKE '%cocktail%' THEN 'cocktails'
  WHEN LOWER(product_type) LIKE '%mixer%' OR LOWER(product_type) LIKE '%soda%' OR LOWER(product_type) LIKE '%juice%' OR LOWER(product_type) LIKE '%water%' THEN 'mixers'
  WHEN LOWER(product_type) LIKE '%party%' OR LOWER(product_type) LIKE '%ice%' OR LOWER(product_type) LIKE '%cup%' THEN 'party-supplies'
  WHEN LOWER(product_type) LIKE '%snack%' OR LOWER(product_type) LIKE '%food%' THEN 'snacks'
  ELSE 'other'
END
WHERE search_category IS NULL;