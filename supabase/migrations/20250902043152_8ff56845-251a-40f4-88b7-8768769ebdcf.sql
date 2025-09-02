-- Add RLS policy to allow reading from shopify_products_cache
ALTER TABLE shopify_products_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to shopify products cache for the app to work
CREATE POLICY "Public can read shopify products cache" 
ON shopify_products_cache 
FOR SELECT 
USING (true);

-- Allow service role to manage shopify products cache
CREATE POLICY "Service role can manage shopify products cache" 
ON shopify_products_cache 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');