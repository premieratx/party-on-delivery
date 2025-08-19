-- Complete final security fixes and affiliate tracking enhancements

-- 1. Create post_checkout_screens table for affiliate flows
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
  cover_page_id TEXT NOT NULL, -- Link to cover page
  affiliate_id UUID REFERENCES affiliates(id),
  flow_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update shopify_products_cache to include sort_order for proper ordering
ALTER TABLE public.shopify_products_cache 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_shopify_products_sort_order 
ON public.shopify_products_cache(collection_handles, sort_order);

-- 4. Ensure affiliate tracking works with defaults
ALTER TABLE public.affiliate_order_tracking 
ADD COLUMN IF NOT EXISTS used_default_flow BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flow_path TEXT;

-- 5. RLS policies for post_checkout_screens
ALTER TABLE public.post_checkout_screens ENABLE ROW LEVEL SECURITY;

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

-- 6. Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_checkout_screens_updated_at
BEFORE UPDATE ON public.post_checkout_screens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Ensure cart security - make cart operations system-level
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

-- System can manage cart sessions
CREATE POLICY "System can manage cart sessions" 
ON public.cart_sessions FOR ALL 
USING (true)
WITH CHECK (true);

-- 8. Add function to get default affiliate flow
CREATE OR REPLACE FUNCTION public.get_default_affiliate_flow(p_affiliate_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate RECORD;
  v_default_cover_page RECORD;
  v_default_app RECORD;
  v_default_post_checkout RECORD;
  v_result JSONB;
BEGIN
  -- Get affiliate info
  SELECT * INTO v_affiliate 
  FROM affiliates 
  WHERE affiliate_code = p_affiliate_slug OR custom_handle = p_affiliate_slug;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Affiliate not found');
  END IF;
  
  -- Get default cover page
  SELECT * INTO v_default_cover_page 
  FROM cover_pages 
  WHERE is_default_homepage = true 
  LIMIT 1;
  
  -- Get default delivery app
  SELECT * INTO v_default_app 
  FROM delivery_app_variations 
  WHERE is_homepage = true 
  LIMIT 1;
  
  -- Get or create default post checkout screen
  SELECT * INTO v_default_post_checkout 
  FROM post_checkout_screens 
  WHERE screen_slug = 'default-post-checkout' 
  LIMIT 1;
  
  -- If no default post-checkout exists, create one
  IF NOT FOUND THEN
    INSERT INTO post_checkout_screens (
      screen_name, screen_slug, title, message, cover_page_id
    ) VALUES (
      'Default Post-Checkout', 
      'default-post-checkout', 
      'Thank you for your order!', 
      'Your order has been confirmed and will be delivered soon.',
      COALESCE(v_default_cover_page.id::TEXT, 'default')
    )
    RETURNING * INTO v_default_post_checkout;
  END IF;
  
  -- Build response
  v_result := jsonb_build_object(
    'affiliate', row_to_json(v_affiliate),
    'cover_page', row_to_json(v_default_cover_page),
    'delivery_app', row_to_json(v_default_app),
    'post_checkout', row_to_json(v_default_post_checkout),
    'flow_type', 'default'
  );
  
  RETURN v_result;
END;
$$;