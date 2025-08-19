-- Create customer_flows table for managing complete customer journeys
CREATE TABLE public.customer_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_page_id UUID,
  delivery_app_id UUID,
  post_checkout_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_flows ENABLE ROW LEVEL SECURITY;

-- Create policies for customer flows
CREATE POLICY "Admins can manage all customer flows" 
ON public.customer_flows 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

CREATE POLICY "Customer flows are viewable by everyone" 
ON public.customer_flows 
FOR SELECT 
USING (is_active = true);

-- Create function to update timestamps
CREATE TRIGGER update_customer_flows_updated_at
BEFORE UPDATE ON public.customer_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one default flow
CREATE OR REPLACE FUNCTION public.ensure_single_default_flow_global()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.customer_flows 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_flow_trigger
BEFORE INSERT OR UPDATE ON public.customer_flows
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_flow_global();