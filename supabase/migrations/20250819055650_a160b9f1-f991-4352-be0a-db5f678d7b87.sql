-- Fix migration - check columns first and create post_checkout_screens properly

-- 1. Create post_checkout_screens table correctly
CREATE TABLE IF NOT EXISTS public.post_checkout_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_name TEXT NOT NULL,
  screen_slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  button_1_text TEXT,
  button_1_url TEXT,
  button_2_text TEXT,
  button_2_url TEXT,
  cover_page_id TEXT NOT NULL,
  affiliate_id UUID,
  flow_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add sort_order to shopify_products_cache for proper ordering
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

-- 3. Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_shopify_products_sort_order 
ON public.shopify_products_cache(sort_order);

-- 4. Add tracking columns to affiliate_order_tracking
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

-- 5. Enable RLS and create policies for post_checkout_screens
ALTER TABLE public.post_checkout_screens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can manage post checkout screens" ON public.post_checkout_screens;
DROP POLICY IF EXISTS "Affiliates can manage their own post checkout screens" ON public.post_checkout_screens;
DROP POLICY IF EXISTS "Active post checkout screens are publicly viewable" ON public.post_checkout_screens;

-- Admin can manage all screens
CREATE POLICY "Admin users can manage post checkout screens" 
ON public.post_checkout_screens FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.email()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.email()
  )
);

-- Affiliates can manage their own screens
CREATE POLICY "Affiliates can manage their own post checkout screens" 
ON public.post_checkout_screens FOR ALL 
USING (
  affiliate_id IN (
    SELECT id FROM affiliates 
    WHERE email = auth.email()
  )
)
WITH CHECK (
  affiliate_id IN (
    SELECT id FROM affiliates 
    WHERE email = auth.email()
  )
);

-- Public can view active screens
CREATE POLICY "Active post checkout screens are publicly viewable" 
ON public.post_checkout_screens FOR SELECT 
USING (is_active = true);

-- 6. Create cart sessions table for secure cart management
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

-- RLS for cart sessions
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can manage cart sessions" ON public.cart_sessions;

-- System can manage cart sessions
CREATE POLICY "System can manage cart sessions" 
ON public.cart_sessions FOR ALL 
USING (true)
WITH CHECK (true);