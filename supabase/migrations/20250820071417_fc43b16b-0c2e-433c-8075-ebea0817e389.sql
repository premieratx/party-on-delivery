-- Enhanced hierarchical search categorization
-- Create a hierarchical product categorization table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_hierarchical_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL, -- Shopify product ID as text
  product_title TEXT NOT NULL,
  product_handle TEXT,
  product_type TEXT,
  vendor TEXT,
  collections TEXT[], -- Array of collection handles
  categories TEXT[], -- Array of category names
  tags TEXT[], -- Array of product tags
  search_vector TSVECTOR, -- Full text search vector
  hierarchy_level INTEGER DEFAULT 1, -- 1=name, 2=collection, 3=category, 4=type
  priority_score INTEGER DEFAULT 0, -- Higher = more priority in search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.product_hierarchical_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is product catalog data)
CREATE POLICY "Anyone can view product categories" 
ON public.product_hierarchical_categories 
FOR SELECT 
USING (true);

-- Create policy for admin write access
CREATE POLICY "Admin can manage product categories" 
ON public.product_hierarchical_categories 
FOR ALL 
USING (public.is_admin_user());

-- Create indexes for fast hierarchical search
CREATE INDEX IF NOT EXISTS idx_product_hierarchical_categories_title ON public.product_hierarchical_categories USING GIN(to_tsvector('english', product_title));
CREATE INDEX IF NOT EXISTS idx_product_hierarchical_categories_collections ON public.product_hierarchical_categories USING GIN(collections);
CREATE INDEX IF NOT EXISTS idx_product_hierarchical_categories_categories ON public.product_hierarchical_categories USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_product_hierarchical_categories_search_vector ON public.product_hierarchical_categories USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_product_hierarchical_categories_hierarchy_level ON public.product_hierarchical_categories (hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_product_hierarchical_categories_priority_score ON public.product_hierarchical_categories (priority_score DESC);

-- Function to update the search vector automatically
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.product_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.collections, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.product_type, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.vendor, '')), 'D');
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS update_product_search_vector_trigger ON public.product_hierarchical_categories;
CREATE TRIGGER update_product_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.product_hierarchical_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();

-- Function for hierarchical product search with priority scoring
CREATE OR REPLACE FUNCTION public.hierarchical_product_search(
  search_query TEXT,
  max_results INTEGER DEFAULT 50
) RETURNS TABLE(
  product_id TEXT,
  product_title TEXT,
  product_handle TEXT,
  product_type TEXT,
  vendor TEXT,
  collections TEXT[],
  categories TEXT[],
  tags TEXT[],
  relevance_score REAL,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_results AS (
    SELECT 
      phc.product_id,
      phc.product_title,
      phc.product_handle,
      phc.product_type,
      phc.vendor,
      phc.collections,
      phc.categories,
      phc.tags,
      CASE 
        -- Exact title match gets highest priority
        WHEN LOWER(phc.product_title) = LOWER(search_query) THEN 1000.0
        -- Title starts with query
        WHEN LOWER(phc.product_title) LIKE LOWER(search_query || '%') THEN 800.0
        -- Title contains query
        WHEN LOWER(phc.product_title) ILIKE '%' || LOWER(search_query) || '%' THEN 600.0
        -- Collection match
        WHEN EXISTS(SELECT 1 FROM unnest(phc.collections) AS col WHERE LOWER(col) ILIKE '%' || LOWER(search_query) || '%') THEN 400.0
        -- Category match
        WHEN EXISTS(SELECT 1 FROM unnest(phc.categories) AS cat WHERE LOWER(cat) ILIKE '%' || LOWER(search_query) || '%') THEN 300.0
        -- Product type match
        WHEN LOWER(phc.product_type) ILIKE '%' || LOWER(search_query) || '%' THEN 200.0
        -- Vendor match
        WHEN LOWER(phc.vendor) ILIKE '%' || LOWER(search_query) || '%' THEN 150.0
        -- Tag match
        WHEN EXISTS(SELECT 1 FROM unnest(phc.tags) AS tag WHERE LOWER(tag) ILIKE '%' || LOWER(search_query) || '%') THEN 100.0
        -- Full text search fallback
        ELSE ts_rank(phc.search_vector, plainto_tsquery('english', search_query)) * 50.0
      END + phc.priority_score AS relevance_score,
      CASE 
        WHEN LOWER(phc.product_title) = LOWER(search_query) THEN 'exact_title'
        WHEN LOWER(phc.product_title) LIKE LOWER(search_query || '%') THEN 'title_prefix'
        WHEN LOWER(phc.product_title) ILIKE '%' || LOWER(search_query) || '%' THEN 'title_contains'
        WHEN EXISTS(SELECT 1 FROM unnest(phc.collections) AS col WHERE LOWER(col) ILIKE '%' || LOWER(search_query) || '%') THEN 'collection'
        WHEN EXISTS(SELECT 1 FROM unnest(phc.categories) AS cat WHERE LOWER(cat) ILIKE '%' || LOWER(search_query) || '%') THEN 'category'
        WHEN LOWER(phc.product_type) ILIKE '%' || LOWER(search_query) || '%' THEN 'product_type'
        WHEN LOWER(phc.vendor) ILIKE '%' || LOWER(search_query) || '%' THEN 'vendor'
        WHEN EXISTS(SELECT 1 FROM unnest(phc.tags) AS tag WHERE LOWER(tag) ILIKE '%' || LOWER(search_query) || '%') THEN 'tag'
        ELSE 'fulltext'
      END AS match_type
    FROM public.product_hierarchical_categories phc
    WHERE 
      -- Quick filters first
      (
        LOWER(phc.product_title) ILIKE '%' || LOWER(search_query) || '%' OR
        EXISTS(SELECT 1 FROM unnest(phc.collections) AS col WHERE LOWER(col) ILIKE '%' || LOWER(search_query) || '%') OR
        EXISTS(SELECT 1 FROM unnest(phc.categories) AS cat WHERE LOWER(cat) ILIKE '%' || LOWER(search_query) || '%') OR
        LOWER(phc.product_type) ILIKE '%' || LOWER(search_query) || '%' OR
        LOWER(phc.vendor) ILIKE '%' || LOWER(search_query) || '%' OR
        EXISTS(SELECT 1 FROM unnest(phc.tags) AS tag WHERE LOWER(tag) ILIKE '%' || LOWER(search_query) || '%') OR
        phc.search_vector @@ plainto_tsquery('english', search_query)
      )
  )
  SELECT 
    rr.product_id,
    rr.product_title,
    rr.product_handle,
    rr.product_type,
    rr.vendor,
    rr.collections,
    rr.categories,
    rr.tags,
    rr.relevance_score,
    rr.match_type
  FROM ranked_results rr
  WHERE rr.relevance_score > 0
  ORDER BY rr.relevance_score DESC, rr.product_title ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync Shopify products to hierarchical categories
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
      COALESCE(
        (SELECT ARRAY(
          SELECT jsonb_array_elements_text(product_record.data->'collections')
        )), 
        ARRAY[]::TEXT[]
      ),
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
      COALESCE(
        (SELECT ARRAY(
          SELECT jsonb_array_elements_text(product_record.data->'tags')
        )), 
        ARRAY[]::TEXT[]
      ),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;