-- Clear the empty cache and trigger a fresh sync
DELETE FROM public.cache WHERE key LIKE '%instant-product%';
DELETE FROM public.shopify_products_cache WHERE data IS NULL OR data = '{}' OR jsonb_array_length(COALESCE(data->'products', '[]')) = 0;

-- Insert some test data to verify the system works
INSERT INTO public.shopify_products_cache (id, title, handle, data, updated_at) VALUES 
('test-product-1', 'Test Beer Product', 'test-beer', '{"price": 12.99, "collections": ["tailgate-beer"], "image": "https://example.com/beer.jpg"}', NOW()),
('test-product-2', 'Test Spirit Product', 'test-spirit', '{"price": 24.99, "collections": ["spirits"], "image": "https://example.com/spirit.jpg"}', NOW())
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  data = EXCLUDED.data,
  updated_at = EXCLUDED.updated_at;