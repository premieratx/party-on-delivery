-- Simple fixes without complex table operations

-- 1. Add sort_order to shopify_products_cache for Shopify ordering fix
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_products_cache' 
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.shopify_products_cache ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Create index for efficient sorting by collection and order
CREATE INDEX IF NOT EXISTS idx_shopify_products_sort_order 
ON public.shopify_products_cache(sort_order);

-- 3. Add affiliate tracking columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliate_order_tracking' 
    AND column_name = 'used_default_flow'
  ) THEN
    ALTER TABLE public.affiliate_order_tracking ADD COLUMN used_default_flow BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliate_order_tracking' 
    AND column_name = 'flow_path'
  ) THEN
    ALTER TABLE public.affiliate_order_tracking ADD COLUMN flow_path TEXT;
  END IF;
END $$;

-- 4. Create secure cart sessions
CREATE TABLE IF NOT EXISTS public.cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  cart_data JSONB DEFAULT '[]'::jsonb,
  customer_email TEXT,
  affiliate_tracking JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for cart sessions
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Allow system access to cart sessions
DROP POLICY IF EXISTS "System can manage cart sessions" ON public.cart_sessions;
CREATE POLICY "System can manage cart sessions" 
ON public.cart_sessions FOR ALL 
USING (true)
WITH CHECK (true);