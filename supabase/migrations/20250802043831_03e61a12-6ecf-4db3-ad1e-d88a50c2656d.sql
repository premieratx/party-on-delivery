-- Enhance product categorization for spirits subcategories
-- First, let's run the categorize-products function to ensure all products are categorized
DO $$
DECLARE
    product_record RECORD;
    category_result TEXT;
    subcategory_result TEXT;
    confidence_result NUMERIC;
BEGIN
    -- Get products from shopify cache that might need spirits subcategorization
    FOR product_record IN 
        SELECT id, title, description, product_type, tags, handle
        FROM shopify_products_cache 
        WHERE product_type ILIKE ANY(ARRAY['%whiskey%', '%whisky%', '%rum%', '%vodka%', '%gin%', '%tequila%', '%mezcal%', '%liqueur%', '%bourbon%', '%scotch%', '%brandy%', '%cognac%'])
           OR tags::text ILIKE ANY(ARRAY['%whiskey%', '%whisky%', '%rum%', '%vodka%', '%gin%', '%tequila%', '%mezcal%', '%liqueur%', '%bourbon%', '%scotch%', '%brandy%', '%cognac%'])
           OR title ILIKE ANY(ARRAY['%whiskey%', '%whisky%', '%rum%', '%vodka%', '%gin%', '%tequila%', '%mezcal%', '%liqueur%', '%bourbon%', '%scotch%', '%brandy%', '%cognac%'])
    LOOP
        -- Determine spirit subcategory
        category_result := 'spirits';
        confidence_result := 0.8;
        
        -- Determine subcategory based on product details
        IF product_record.title ILIKE ANY(ARRAY['%whiskey%', '%whisky%', '%bourbon%', '%rye%', '%scotch%']) 
           OR product_record.product_type ILIKE ANY(ARRAY['%whiskey%', '%whisky%', '%bourbon%', '%scotch%'])
           OR product_record.tags::text ILIKE ANY(ARRAY['%whiskey%', '%whisky%', '%bourbon%', '%scotch%']) THEN
            subcategory_result := 'whiskey';
        ELSIF product_record.title ILIKE ANY(ARRAY['%vodka%']) 
              OR product_record.product_type ILIKE '%vodka%'
              OR product_record.tags::text ILIKE '%vodka%' THEN
            subcategory_result := 'vodka';
        ELSIF product_record.title ILIKE ANY(ARRAY['%rum%']) 
              OR product_record.product_type ILIKE '%rum%'
              OR product_record.tags::text ILIKE '%rum%' THEN
            subcategory_result := 'rum';
        ELSIF product_record.title ILIKE ANY(ARRAY['%gin%']) 
              OR product_record.product_type ILIKE '%gin%'
              OR product_record.tags::text ILIKE '%gin%' THEN
            subcategory_result := 'gin';
        ELSIF product_record.title ILIKE ANY(ARRAY['%tequila%']) 
              OR product_record.product_type ILIKE '%tequila%'
              OR product_record.tags::text ILIKE '%tequila%' THEN
            subcategory_result := 'tequila';
        ELSIF product_record.title ILIKE ANY(ARRAY['%mezcal%']) 
              OR product_record.product_type ILIKE '%mezcal%'
              OR product_record.tags::text ILIKE '%mezcal%' THEN
            subcategory_result := 'mezcal';
        ELSIF product_record.title ILIKE ANY(ARRAY['%liqueur%', '%schnapps%', '%amaretto%', '%baileys%', '%kahlua%']) 
              OR product_record.product_type ILIKE ANY(ARRAY['%liqueur%', '%cordial%'])
              OR product_record.tags::text ILIKE ANY(ARRAY['%liqueur%', '%cordial%']) THEN
            subcategory_result := 'liqueurs';
        ELSIF product_record.title ILIKE ANY(ARRAY['%brandy%', '%cognac%', '%armagnac%']) 
              OR product_record.product_type ILIKE ANY(ARRAY['%brandy%', '%cognac%'])
              OR product_record.tags::text ILIKE ANY(ARRAY['%brandy%', '%cognac%']) THEN
            subcategory_result := 'brandy';
        ELSE
            subcategory_result := 'other';
        END IF;
        
        -- Insert or update product category
        INSERT INTO product_categories (
            shopify_product_id,
            product_title,
            product_handle,
            assigned_category,
            subcategory,
            confidence_score
        ) VALUES (
            product_record.id,
            product_record.title,
            product_record.handle,
            category_result,
            subcategory_result,
            confidence_result
        )
        ON CONFLICT (shopify_product_id) 
        DO UPDATE SET
            assigned_category = EXCLUDED.assigned_category,
            subcategory = EXCLUDED.subcategory,
            confidence_score = EXCLUDED.confidence_score,
            updated_at = now();
    END LOOP;
    
    RAISE NOTICE 'Completed spirits subcategorization update';
END $$;