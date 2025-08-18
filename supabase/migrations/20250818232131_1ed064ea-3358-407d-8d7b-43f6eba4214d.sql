-- Add the missing category_title column to shopify_products_cache
ALTER TABLE public.shopify_products_cache 
ADD COLUMN IF NOT EXISTS category_title TEXT;