-- Fix RLS policies for product_categories table to allow categorization

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON product_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON product_categories;
DROP POLICY IF EXISTS "Enable update for users based on email" ON product_categories;

-- Create new comprehensive policies for product_categories
CREATE POLICY "System and admin can manage product categories" 
ON product_categories 
FOR ALL 
USING (
  -- Allow service role (edge functions)
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR
  -- Allow admin users
  (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()))
)
WITH CHECK (
  -- Allow service role (edge functions) 
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR
  -- Allow admin users
  (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()))
);

-- Allow public read access to product categories
CREATE POLICY "Public can read product categories" 
ON product_categories 
FOR SELECT 
USING (true);

-- Create sync products to Shopify edge function if it doesn't exist
-- This will handle syncing product category changes back to Shopify