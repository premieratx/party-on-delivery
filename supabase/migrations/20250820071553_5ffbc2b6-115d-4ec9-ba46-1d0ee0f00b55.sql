-- Add unique constraint to product_hierarchical_categories
ALTER TABLE public.product_hierarchical_categories 
ADD CONSTRAINT product_hierarchical_categories_product_id_key UNIQUE (product_id);

-- Fix sync function to handle the constraint properly
CREATE OR REPLACE FUNCTION public.sync_shopify_to_hierarchical_categories()
RETURNS INTEGER AS $$
DECLARE
  sync_count INTEGER := 0;
  product_record RECORD;
BEGIN
  -- Insert/update products from shopify_products_cache
  FOR product_record IN 
    SELECT DISTINCT ON (id)
      id::TEXT as product_id,
      title,
      handle,
      product_type,
      vendor,
      data
    FROM public.shopify_products_cache
    ORDER BY id, updated_at DESC
  LOOP
    INSERT INTO public.product_hierarchical_categories (
      product_id,
      product_title,
      product_handle,
      product_type,
      vendor,
      collections,
      categories,
      tags,
      priority_score
    ) VALUES (
      product_record.product_id,
      product_record.title,
      product_record.handle,
      product_record.product_type,
      product_record.vendor,
      -- Extract collections from JSON data
      CASE 
        WHEN product_record.data ? 'collections' THEN
          COALESCE(
            (SELECT ARRAY_AGG(collection_handle) 
             FROM jsonb_array_elements_text(product_record.data->'collections') AS collection_handle), 
            ARRAY[]::TEXT[]
          )
        ELSE ARRAY[]::TEXT[]
      END,
      -- Extract categories (simplified mapping)
      COALESCE(
        CASE 
          WHEN product_record.product_type ILIKE '%beer%' THEN ARRAY['beer', 'alcohol']
          WHEN product_record.product_type ILIKE '%wine%' THEN ARRAY['wine', 'alcohol']
          WHEN product_record.product_type ILIKE '%spirit%' THEN ARRAY['spirits', 'alcohol']
          WHEN product_record.product_type ILIKE '%mixer%' THEN ARRAY['mixers', 'non-alcoholic']
          WHEN product_record.product_type ILIKE '%snack%' THEN ARRAY['snacks', 'food']
          ELSE ARRAY['other']
        END,
        ARRAY['other']
      ),
      -- Extract tags from JSON data
      CASE 
        WHEN product_record.data ? 'tags' THEN
          COALESCE(
            (SELECT ARRAY_AGG(tag) 
             FROM jsonb_array_elements_text(product_record.data->'tags') AS tag), 
            ARRAY[]::TEXT[]
          )
        ELSE ARRAY[]::TEXT[]
      END,
      -- Priority score based on product type
      CASE 
        WHEN product_record.product_type ILIKE '%premium%' THEN 10
        WHEN product_record.product_type ILIKE '%featured%' THEN 8
        WHEN product_record.product_type ILIKE '%popular%' THEN 5
        ELSE 0
      END
    )
    ON CONFLICT (product_id) 
    DO UPDATE SET
      product_title = EXCLUDED.product_title,
      product_handle = EXCLUDED.product_handle,
      product_type = EXCLUDED.product_type,
      vendor = EXCLUDED.vendor,
      collections = EXCLUDED.collections,
      categories = EXCLUDED.categories,
      tags = EXCLUDED.tags,
      priority_score = EXCLUDED.priority_score,
      updated_at = now();
    
    sync_count := sync_count + 1;
  END LOOP;
  
  RETURN sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_catalog';