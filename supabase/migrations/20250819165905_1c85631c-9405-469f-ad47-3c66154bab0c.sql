-- Create comprehensive checkout flow documentation table
CREATE TABLE IF NOT EXISTS public.checkout_flow_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL, -- 'edge_function', 'react_component', 'hook', 'configuration'
  file_path TEXT NOT NULL,
  functionality TEXT NOT NULL,
  dependencies JSONB DEFAULT '[]'::jsonb,
  stripe_related BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_flow_documentation ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY "Admins can manage checkout documentation" ON public.checkout_flow_documentation
FOR ALL USING (is_admin_user_safe()) WITH CHECK (is_admin_user_safe());

-- Public read policy for critical documentation
CREATE POLICY "Public can read checkout documentation" ON public.checkout_flow_documentation
FOR SELECT USING (true);

-- Insert current checkout flow components documentation
INSERT INTO public.checkout_flow_documentation (component_name, component_type, file_path, functionality, dependencies, stripe_related, is_critical, notes) VALUES

-- React Components
('StripePaymentWrapper', 'react_component', 'src/components/checkout/StripePaymentWrapper.tsx', 
 'Wraps Stripe Elements provider, handles Stripe initialization by calling get-stripe-publishable-key edge function', 
 '["@stripe/react-stripe-js", "@stripe/stripe-js", "get-stripe-publishable-key"]'::jsonb, 
 true, true, 'CRITICAL: This component initializes Stripe and provides the Elements context'),

('PaymentStep', 'react_component', 'src/components/checkout/PaymentStep.tsx', 
 'Handles actual payment processing with Stripe CardElement, calls create-payment-intent edge function', 
 '["@stripe/react-stripe-js", "create-payment-intent"]'::jsonb, 
 true, true, 'CRITICAL: Contains the payment form and processing logic'),

('PaymentStepFallback', 'react_component', 'src/components/checkout/PaymentStepFallback.tsx', 
 'Fallback component when Stripe is not available or fails to load', 
 '[]'::jsonb, 
 true, false, 'Provides fallback UI when Stripe initialization fails'),

('RefactoredCheckoutFlow', 'react_component', 'src/components/checkout/RefactoredCheckoutFlow.tsx', 
 'Main checkout flow orchestrator that manages steps and integrates payment', 
 '["StripePaymentWrapper", "useCheckoutFlow"]'::jsonb, 
 true, true, 'CRITICAL: Main checkout flow component'),

('CheckoutIsolation', 'react_component', 'src/components/checkout/CheckoutIsolation.tsx', 
 'Prevents dashboard interference during checkout process', 
 '[]'::jsonb, 
 false, true, 'Isolates checkout flow from other app components'),

-- Hooks
('useCheckoutFlow', 'hook', 'src/hooks/useCheckoutFlow.ts', 
 'Manages checkout state, step progression, and data validation', 
 '[]'::jsonb, 
 false, true, 'Handles checkout flow state management'),

('useAppConfig', 'hook', 'src/hooks/useAppConfig.ts', 
 'Provides app configuration including Stripe payment settings', 
 '[]'::jsonb, 
 true, true, 'Contains stripePaymentsEnabled configuration'),

-- Pages
('Checkout', 'react_component', 'src/pages/Checkout.tsx', 
 'Main checkout page that renders the checkout flow with cart items', 
 '["RefactoredCheckoutFlow", "CheckoutIsolation", "useUnifiedCart"]'::jsonb, 
 false, true, 'Entry point for checkout process'),

-- Required Edge Functions (MISSING)
('get-stripe-publishable-key', 'edge_function', 'supabase/functions/get-stripe-publishable-key/index.ts', 
 'Returns Stripe publishable key for client-side initialization', 
 '["STRIPE_PUBLISHABLE_KEY"]'::jsonb, 
 true, true, 'MISSING: Required for Stripe initialization'),

('create-payment-intent', 'edge_function', 'supabase/functions/create-payment-intent/index.ts', 
 'Creates Stripe payment intent for order processing', 
 '["STRIPE_SECRET_KEY", "order_drafts"]'::jsonb, 
 true, true, 'MISSING: Required for payment processing'),

('stripe-webhook', 'edge_function', 'supabase/functions/stripe-webhook/index.ts', 
 'Handles Stripe webhook events for payment confirmation', 
 '["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]'::jsonb, 
 true, false, 'MISSING: Optional but recommended for production');

-- Update trigger for documentation
CREATE OR REPLACE FUNCTION public.update_checkout_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checkout_documentation_updated_at
  BEFORE UPDATE ON public.checkout_flow_documentation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_checkout_documentation_updated_at();