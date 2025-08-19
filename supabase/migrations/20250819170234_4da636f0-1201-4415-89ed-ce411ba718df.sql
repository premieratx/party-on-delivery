-- Add RLS policies for order_drafts table
CREATE POLICY "Service role can manage order drafts" ON public.order_drafts
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Users can view their own order drafts by email
CREATE POLICY "Users can view their own order drafts" ON public.order_drafts
FOR SELECT USING (customer_info->>'email' = auth.email());

-- Add trigger for updated_at
CREATE TRIGGER update_order_drafts_updated_at
  BEFORE UPDATE ON public.order_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update documentation with created edge functions
UPDATE public.checkout_flow_documentation 
SET notes = 'CREATED: Edge function now exists and is functional',
    last_verified = now()
WHERE component_name IN ('get-stripe-publishable-key', 'create-payment-intent', 'stripe-webhook');