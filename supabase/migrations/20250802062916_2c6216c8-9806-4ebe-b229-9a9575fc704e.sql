-- Temporarily disable RLS for product_modifications to allow admin interface to work
-- We'll re-enable with proper policies afterwards
ALTER TABLE product_modifications DISABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for now
-- You can tighten this later based on your specific admin authentication needs
ALTER TABLE product_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on product_modifications" 
ON product_modifications 
FOR ALL 
USING (true)
WITH CHECK (true);