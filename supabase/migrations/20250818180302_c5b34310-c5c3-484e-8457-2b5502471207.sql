-- Fix shopify_products_cache table schema to match edge function expectations
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'image') THEN
        ALTER TABLE shopify_products_cache ADD COLUMN image TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'shopify_id') THEN
        ALTER TABLE shopify_products_cache ADD COLUMN shopify_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'collection_handles') THEN
        ALTER TABLE shopify_products_cache ADD COLUMN collection_handles TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products_cache' AND column_name = 'category') THEN
        ALTER TABLE shopify_products_cache ADD COLUMN category TEXT;
    END IF;
END $$;