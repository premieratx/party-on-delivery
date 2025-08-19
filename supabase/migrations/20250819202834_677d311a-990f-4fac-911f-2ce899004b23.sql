-- Create customer_flows table for managing complete customer journeys
CREATE TABLE IF NOT EXISTS public.customer_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_page_id UUID REFERENCES public.cover_pages(id) ON DELETE SET NULL,
  delivery_app_id UUID REFERENCES public.delivery_app_variations(id) ON DELETE SET NULL,
  post_checkout_id UUID DEFAULT NULL, -- For future post-checkout pages
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for security
ALTER TABLE public.customer_flows ENABLE ROW LEVEL SECURITY;

-- Create policies - admin only access for now
CREATE POLICY "Admin users can manage customer flows"
ON public.customer_flows
FOR ALL
USING (public.is_admin_user());

-- Create trigger for updated_at
CREATE TRIGGER update_customer_flows_updated_at
  BEFORE UPDATE ON public.customer_flows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to ensure only one default flow
CREATE TRIGGER ensure_single_default_customer_flow
  BEFORE INSERT OR UPDATE ON public.customer_flows
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_flow_global();

-- Create index for performance
CREATE INDEX idx_customer_flows_slug ON public.customer_flows(slug);
CREATE INDEX idx_customer_flows_active ON public.customer_flows(is_active);
CREATE INDEX idx_customer_flows_default ON public.customer_flows(is_default) WHERE is_default = true;