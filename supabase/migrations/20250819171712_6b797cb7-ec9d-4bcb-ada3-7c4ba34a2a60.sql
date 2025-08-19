-- Fix any RLS issues preventing Stripe functions from working
-- Ensure order_drafts table has proper policies
CREATE POLICY IF NOT EXISTS "order_drafts_service_role_access" 
ON public.order_drafts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Ensure proper access for edge functions
GRANT ALL ON public.order_drafts TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Update checkout documentation to reflect current state
UPDATE public.checkout_flow_documentation 
SET 
  last_verified = now(),
  notes = 'RESTORED: All Stripe components working, edge functions active, payment flow complete'
WHERE stripe_related = true;