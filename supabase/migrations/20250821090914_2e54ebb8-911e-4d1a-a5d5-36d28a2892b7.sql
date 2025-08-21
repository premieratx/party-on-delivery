-- Create customer flows table for complete journey orchestration
CREATE TABLE IF NOT EXISTS public.customer_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  cover_page_id UUID REFERENCES public.cover_pages(id) ON DELETE CASCADE,
  post_checkout_page_id UUID REFERENCES public.post_checkout_pages(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  affiliate_slug TEXT,
  button_configs JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  analytics_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_flows ENABLE ROW LEVEL SECURITY;

-- Create policies for customer flows
CREATE POLICY "Admins can manage all customer flows" 
ON public.customer_flows 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "Customer flows are viewable by everyone when active" 
ON public.customer_flows 
FOR SELECT 
USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_customer_flows_slug ON public.customer_flows(slug);
CREATE INDEX idx_customer_flows_cover_page ON public.customer_flows(cover_page_id);
CREATE INDEX idx_customer_flows_affiliate ON public.customer_flows(affiliate_id);
CREATE INDEX idx_customer_flows_active ON public.customer_flows(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_customer_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_flows_updated_at
BEFORE UPDATE ON public.customer_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_flows_updated_at();