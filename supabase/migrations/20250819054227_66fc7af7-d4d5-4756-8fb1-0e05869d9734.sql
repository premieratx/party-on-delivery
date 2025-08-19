-- Create post_checkout_screens table for individual post-checkout pages
CREATE TABLE IF NOT EXISTS public.post_checkout_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  screen_name TEXT NOT NULL,
  screen_slug TEXT NOT NULL,
  screen_description TEXT,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  cta_button_text TEXT DEFAULT '',
  cta_button_url TEXT DEFAULT '',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  background_image_url TEXT,
  custom_styles JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- Enable RLS on post_checkout_screens
ALTER TABLE public.post_checkout_screens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_checkout_screens
CREATE POLICY "Admin users can manage all post-checkout screens"
  ON public.post_checkout_screens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email()
    )
  );

CREATE POLICY "Affiliates can manage their own post-checkout screens"
  ON public.post_checkout_screens
  FOR ALL
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates 
      WHERE email = auth.email()
    )
  )
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates 
      WHERE email = auth.email()
    )
  );

CREATE POLICY "Post-checkout screens are publicly viewable when active"
  ON public.post_checkout_screens
  FOR SELECT
  USING (is_active = true);

-- Create index for better performance
CREATE INDEX idx_post_checkout_screens_affiliate_id ON public.post_checkout_screens(affiliate_id);
CREATE INDEX idx_post_checkout_screens_slug ON public.post_checkout_screens(screen_slug);

-- Add updated_at trigger
CREATE TRIGGER update_post_checkout_screens_updated_at
  BEFORE UPDATE ON public.post_checkout_screens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();