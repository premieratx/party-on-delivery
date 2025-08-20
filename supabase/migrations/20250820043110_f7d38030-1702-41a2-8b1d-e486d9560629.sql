-- Create post_checkout_screens table for post-checkout page management
CREATE TABLE public.post_checkout_screens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  logo_url TEXT,
  button_1_text TEXT DEFAULT 'Continue Shopping',
  button_1_url TEXT DEFAULT '/',
  button_2_text TEXT DEFAULT 'Track Order',
  button_2_url TEXT DEFAULT '/orders',
  button_3_text TEXT,
  button_3_url TEXT,
  button_4_text TEXT,
  button_4_url TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  cover_page_id UUID REFERENCES public.cover_pages(id),
  affiliate_id UUID REFERENCES public.affiliates(id),
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'success',
  styles JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_checkout_screens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage post-checkout screens" 
ON public.post_checkout_screens 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "Public can view active post-checkout screens" 
ON public.post_checkout_screens 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage post-checkout screens" 
ON public.post_checkout_screens 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Ensure only one default screen at a time
CREATE OR REPLACE FUNCTION public.ensure_single_default_post_checkout_screen()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.post_checkout_screens 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

CREATE TRIGGER ensure_single_default_post_checkout_screen
  BEFORE INSERT OR UPDATE ON public.post_checkout_screens
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_post_checkout_screen();

-- Create trigger for updated_at
CREATE TRIGGER update_post_checkout_screens_updated_at
  BEFORE UPDATE ON public.post_checkout_screens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();