-- Create the comprehensive affiliate flow architecture

-- Add affiliate tracking columns to cover_pages
ALTER TABLE public.cover_pages 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id),
ADD COLUMN IF NOT EXISTS affiliate_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_default_homepage BOOLEAN DEFAULT false;

-- Create post_checkout_screens table linked to cover pages
CREATE TABLE IF NOT EXISTS public.post_checkout_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_page_id UUID NOT NULL REFERENCES public.cover_pages(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.affiliates(id),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  logo_url TEXT,
  button_1_text TEXT DEFAULT '',
  button_1_url TEXT DEFAULT '',
  button_2_text TEXT DEFAULT '',
  button_2_url TEXT DEFAULT '',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  styles JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_order_tracking table for commission tracking
CREATE TABLE IF NOT EXISTS public.affiliate_order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id),
  cover_page_id UUID REFERENCES public.cover_pages(id),
  affiliate_slug TEXT NOT NULL,
  session_id TEXT,
  order_id TEXT,
  customer_email TEXT,
  subtotal NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 5.0,
  delivery_app_slug TEXT,
  tracking_url_params JSONB DEFAULT '{}',
  order_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add product ordering preservation to shopify collections
ALTER TABLE public.shopify_collections_cache 
ADD COLUMN IF NOT EXISTS product_order INTEGER[];

-- Enable RLS
ALTER TABLE public.post_checkout_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_order_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_checkout_screens
CREATE POLICY "Admin users can manage post-checkout screens"
  ON public.post_checkout_screens FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Affiliates can manage their post-checkout screens"
  ON public.post_checkout_screens FOR ALL
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE email = auth.email()));

CREATE POLICY "Post-checkout screens are publicly viewable"
  ON public.post_checkout_screens FOR SELECT
  USING (true);

-- RLS Policies for affiliate_order_tracking
CREATE POLICY "Admin users can view all affiliate tracking"
  ON public.affiliate_order_tracking FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Affiliates can view their own tracking"
  ON public.affiliate_order_tracking FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE email = auth.email()));

CREATE POLICY "System can manage affiliate tracking"
  ON public.affiliate_order_tracking FOR ALL
  USING (true);

-- Create trigger to ensure only one default homepage
CREATE OR REPLACE FUNCTION ensure_single_default_cover_page()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default_homepage = true THEN
    UPDATE public.cover_pages 
    SET is_default_homepage = false 
    WHERE id != NEW.id AND is_default_homepage = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_cover_page_trigger
  BEFORE INSERT OR UPDATE ON public.cover_pages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_cover_page();

-- Function to track affiliate orders
CREATE OR REPLACE FUNCTION track_affiliate_order(
  p_affiliate_slug TEXT,
  p_session_id TEXT,
  p_order_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_affiliate_id UUID;
  v_cover_page_id UUID;
  v_tracking_id UUID;
BEGIN
  -- Get affiliate and cover page info
  SELECT a.id, cp.id INTO v_affiliate_id, v_cover_page_id
  FROM affiliates a
  LEFT JOIN cover_pages cp ON cp.affiliate_slug = p_affiliate_slug
  WHERE a.affiliate_code = p_affiliate_slug OR cp.affiliate_slug = p_affiliate_slug
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Insert tracking record
  INSERT INTO affiliate_order_tracking (
    affiliate_id,
    cover_page_id,
    affiliate_slug,
    session_id,
    order_id,
    customer_email,
    subtotal,
    commission_amount,
    commission_rate,
    tracking_url_params
  ) VALUES (
    v_affiliate_id,
    v_cover_page_id,
    p_affiliate_slug,
    p_session_id,
    p_order_data->>'order_id',
    p_order_data->>'customer_email',
    (p_order_data->>'subtotal')::NUMERIC,
    (p_order_data->>'subtotal')::NUMERIC * 0.05, -- 5% default commission
    5.0,
    p_order_data
  ) RETURNING id INTO v_tracking_id;
  
  RETURN v_tracking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;