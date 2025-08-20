-- Create post_checkout_pages table for custom post-purchase experiences
CREATE TABLE public.post_checkout_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.post_checkout_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for post_checkout_pages
CREATE POLICY "Post checkout pages are viewable by everyone" 
ON public.post_checkout_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage post checkout pages" 
ON public.post_checkout_pages 
FOR ALL 
USING (public.is_admin_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_post_checkout_pages_updated_at
BEFORE UPDATE ON public.post_checkout_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to ensure only one default post-checkout page
CREATE OR REPLACE FUNCTION public.ensure_single_default_post_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.post_checkout_pages 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- Create trigger for single default post-checkout page
CREATE TRIGGER ensure_single_default_post_checkout_trigger
BEFORE INSERT OR UPDATE ON public.post_checkout_pages
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_post_checkout();