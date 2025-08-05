-- Add unique constraint for product_modifications to support ON CONFLICT
ALTER TABLE public.product_modifications 
ADD CONSTRAINT product_modifications_shopify_product_id_key 
UNIQUE (shopify_product_id);