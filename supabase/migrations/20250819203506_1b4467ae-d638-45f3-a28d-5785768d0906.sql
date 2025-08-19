-- Create affiliate_flow_assignments table for admin-managed flow assignments
CREATE TABLE IF NOT EXISTS public.affiliate_flow_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  customer_flow_id UUID NOT NULL REFERENCES public.customer_flows(id) ON DELETE CASCADE,
  share_slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(affiliate_id, customer_flow_id)
);

-- Enable RLS
ALTER TABLE public.affiliate_flow_assignments ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all assignments
CREATE POLICY "Admin users can manage affiliate flow assignments"
ON public.affiliate_flow_assignments
FOR ALL
USING (public.is_admin_user_safe())
WITH CHECK (public.is_admin_user_safe());

-- Affiliates can view their own assignments  
CREATE POLICY "Affiliates can view their own flow assignments"
ON public.affiliate_flow_assignments
FOR SELECT
USING (affiliate_id IN (
  SELECT id FROM public.affiliates WHERE email = auth.email()
));

-- Service role can manage all (for tracking functions)
CREATE POLICY "Service role can manage affiliate flow assignments"
ON public.affiliate_flow_assignments
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_affiliate_flow_assignments_updated_at
  BEFORE UPDATE ON public.affiliate_flow_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_affiliate_flow_assignments_affiliate ON public.affiliate_flow_assignments(affiliate_id);
CREATE INDEX idx_affiliate_flow_assignments_flow ON public.affiliate_flow_assignments(customer_flow_id);
CREATE INDEX idx_affiliate_flow_assignments_slug ON public.affiliate_flow_assignments(share_slug);
CREATE INDEX idx_affiliate_flow_assignments_active ON public.affiliate_flow_assignments(is_active) WHERE is_active = true;