-- Add enhanced customer flow fields and affiliate assignment table

-- Add enhanced fields to customer_flows table
ALTER TABLE public.customer_flows 
ADD COLUMN IF NOT EXISTS pre_filled_delivery_address jsonb,
ADD COLUMN IF NOT EXISTS pre_filled_delivery_date text,
ADD COLUMN IF NOT EXISTS pre_filled_delivery_time text,
ADD COLUMN IF NOT EXISTS free_delivery_enabled boolean DEFAULT false;

-- Update existing customer flows to have default values
UPDATE public.customer_flows 
SET 
  pre_filled_delivery_address = NULL,
  pre_filled_delivery_date = '',
  pre_filled_delivery_time = '',
  free_delivery_enabled = false
WHERE 
  pre_filled_delivery_address IS NULL OR 
  pre_filled_delivery_date IS NULL OR 
  pre_filled_delivery_time IS NULL OR 
  free_delivery_enabled IS NULL;

-- Create or update affiliate_flow_assignments table
CREATE TABLE IF NOT EXISTS public.affiliate_flow_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_flow_id uuid NOT NULL REFERENCES public.customer_flows(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  share_slug text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  discount_type text,
  discount_percentage numeric,
  discount_dollar_amount numeric,
  free_shipping boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_flow_assignments_customer_flow_id ON public.affiliate_flow_assignments(customer_flow_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_flow_assignments_affiliate_id ON public.affiliate_flow_assignments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_flow_assignments_share_slug ON public.affiliate_flow_assignments(share_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_flow_assignments_active ON public.affiliate_flow_assignments(is_active) WHERE is_active = true;

-- Enable RLS on affiliate_flow_assignments
ALTER TABLE public.affiliate_flow_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for affiliate_flow_assignments
CREATE POLICY "Admin users can manage affiliate flow assignments" 
ON public.affiliate_flow_assignments 
FOR ALL 
USING (is_admin_user_safe());

CREATE POLICY "Affiliates can view their own flow assignments" 
ON public.affiliate_flow_assignments 
FOR SELECT 
USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates 
    WHERE email = auth.email()
  )
);

CREATE POLICY "Service role can manage affiliate flow assignments" 
ON public.affiliate_flow_assignments 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_affiliate_flow_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_flow_assignments_updated_at
  BEFORE UPDATE ON public.affiliate_flow_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_flow_assignments_updated_at();

-- Add promo_code_enabled to delivery_app_variations for promo code functionality
ALTER TABLE public.delivery_app_variations
ADD COLUMN IF NOT EXISTS promo_code_enabled boolean DEFAULT true;

-- Update existing delivery apps to have promo codes enabled by default
UPDATE public.delivery_app_variations 
SET promo_code_enabled = true 
WHERE promo_code_enabled IS NULL;