-- Create backup table for checkout flow configurations
CREATE TABLE IF NOT EXISTS public.checkout_flow_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  component_config JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  is_current BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.checkout_flow_backups ENABLE ROW LEVEL SECURITY;

-- Allow admin users to manage backups
CREATE POLICY "Admin users can manage checkout backups" 
ON public.checkout_flow_backups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Allow system to insert backups
CREATE POLICY "System can create checkout backups" 
ON public.checkout_flow_backups 
FOR INSERT 
WITH CHECK (true);

-- Insert current checkout flow configuration as backup
INSERT INTO public.checkout_flow_backups (
  backup_name,
  created_by,
  component_config,
  notes,
  is_current
) VALUES (
  'Current Working Checkout Flow - ' || now()::date,
  'automated_backup',
  '{
    "checkout_flow": {
      "steps": ["datetime", "address", "payment"],
      "validation": {
        "email_required": true,
        "phone_required": true,
        "address_required": true,
        "delivery_date_required": true,
        "delivery_time_required": true
      },
      "pricing": {
        "tax_rate": 0.0825,
        "standard_delivery_fee": 9.99,
        "distance_based_delivery": true,
        "tip_options": [15, 18, 20, 25]
      },
      "integrations": {
        "stripe_payment": true,
        "shopify_orders": true,
        "group_orders": true,
        "affiliate_tracking": true,
        "google_places": true
      },
      "features": {
        "discount_codes": true,
        "address_autocomplete": true,
        "time_slot_selection": true,
        "add_to_existing_order": true,
        "cart_modification": true,
        "progress_saving": true
      },
      "components": {
        "unified_cart": true,
        "bottom_cart_bar": true,
        "embedded_payment_form": true,
        "time_selector": true,
        "google_places_autocomplete": true
      }
    }
  }',
  'Backup created before search page checkout integration. This is the current working configuration with all features operational.',
  true
);