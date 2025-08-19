-- Fix collection ordering by adding sort_order column and ordering properly
ALTER TABLE shopify_products_cache 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_shopify_products_cache_sort_order 
ON shopify_products_cache(sort_order);

-- Update the products ordering to use sort_order when available, fallback to id
UPDATE shopify_products_cache 
SET sort_order = 0 
WHERE sort_order IS NULL;