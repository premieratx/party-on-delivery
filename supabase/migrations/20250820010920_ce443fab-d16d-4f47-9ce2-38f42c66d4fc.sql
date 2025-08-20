-- Create post-checkout screens table
CREATE TABLE public.post_checkout_screens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  logo_url TEXT,
  background_image_url TEXT,
  background_video_url TEXT,
  primary_button_text TEXT,
  primary_button_url TEXT,
  secondary_button_text TEXT,
  secondary_button_url TEXT,
  custom_message TEXT,
  text_color TEXT NOT NULL DEFAULT '#000000',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_checkout_screens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage post-checkout screens" 
ON public.post_checkout_screens 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "Service role can manage post-checkout screens" 
ON public.post_checkout_screens 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create storage bucket for post-checkout assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-checkout-assets', 'post-checkout-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view post-checkout assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-checkout-assets');

CREATE POLICY "Admin users can upload post-checkout assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'post-checkout-assets' AND is_admin_user_safe());

CREATE POLICY "Admin users can update post-checkout assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'post-checkout-assets' AND is_admin_user_safe());

CREATE POLICY "Admin users can delete post-checkout assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'post-checkout-assets' AND is_admin_user_safe());

-- Create updated_at trigger
CREATE TRIGGER update_post_checkout_screens_updated_at
BEFORE UPDATE ON public.post_checkout_screens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();