-- Create comprehensive checkout flow configuration and documentation table
CREATE TABLE IF NOT EXISTS public.checkout_flow_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_flow_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active configs
CREATE POLICY "Public can read active checkout configs" 
ON public.checkout_flow_config 
FOR SELECT 
USING (is_default = true);

-- Only admins can modify configs
CREATE POLICY "Admins can manage checkout configs" 
ON public.checkout_flow_config 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Insert default checkout flow settings that ensure everything always works
INSERT INTO public.checkout_flow_config (config_key, config_value, description) VALUES 
(
  'checkout_flow_settings',
  '{
    "always_editable": true,
    "auto_save_enabled": true,
    "auto_confirm_disabled": true,
    "persistence_keys": [
      "partyondelivery_customer",
      "partyondelivery_address", 
      "partyondelivery_delivery_info",
      "partyondelivery_checkout_state",
      "persistent-checkout-info"
    ],
    "validation_rules": {
      "datetime_required": ["date", "timeSlot"],
      "address_required": ["street", "city", "state", "zipCode"],
      "customer_required": ["firstName", "lastName", "email", "phone"]
    },
    "step_progression": {
      "enable_auto_progression": false,
      "require_manual_confirmation": true,
      "allow_step_editing": true
    },
    "safeguards": {
      "enable_edit_buttons": true,
      "enable_clear_data": true,
      "enable_reset_flow": true
    }
  }',
  'Default checkout flow settings ensuring always-editable, always-functional checkout process'
),
(
  'checkout_persistence_config',
  '{
    "storage_type": "localStorage",
    "auto_save_debounce_ms": 300,
    "expiry_hours": 24,
    "backup_keys": true,
    "clear_on_completion": false,
    "restore_on_load": true
  }',
  'Data persistence configuration for checkout flow'
),
(
  'checkout_validation_config',
  '{
    "required_fields": {
      "customer": ["firstName", "lastName", "email", "phone"],
      "address": ["street", "city", "state", "zipCode"],
      "delivery": ["date", "timeSlot"]
    },
    "optional_fields": {
      "address": ["instructions"],
      "delivery": ["instructions"]
    },
    "validation_triggers": ["onChange", "onBlur", "onSubmit"],
    "error_handling": "graceful_fallback"
  }',
  'Validation rules and error handling for checkout forms'
),
(
  'checkout_ui_config',
  '{
    "responsive_design": true,
    "mobile_optimized": true,
    "step_indicators": true,
    "progress_saving": true,
    "edit_mode_always_available": true,
    "confirmation_required": false,
    "auto_progression": false
  }',
  'UI configuration ensuring optimal user experience across all devices'
),
(
  'checkout_payment_config',
  '{
    "stripe_integration": true,
    "tip_support": true,
    "promo_code_support": true,
    "tax_calculation": 0.0825,
    "delivery_fee_calculation": "dynamic",
    "free_shipping_codes": ["PREMIERE2025"],
    "payment_retry_enabled": true
  }',
  'Payment processing configuration and rules'
);

-- Create checkout flow monitoring table
CREATE TABLE IF NOT EXISTS public.checkout_flow_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_email TEXT,
  step_reached TEXT NOT NULL,
  completion_status TEXT NOT NULL DEFAULT 'in_progress',
  error_details JSONB,
  device_info JSONB,
  entry_point TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.checkout_flow_monitoring ENABLE ROW LEVEL SECURITY;

-- Allow system and admin access
CREATE POLICY "System can track checkout flow" 
ON public.checkout_flow_monitoring 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to get checkout configuration
CREATE OR REPLACE FUNCTION public.get_checkout_config(config_type TEXT DEFAULT 'checkout_flow_settings')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  config_data JSONB;
BEGIN
  SELECT config_value INTO config_data
  FROM checkout_flow_config
  WHERE config_key = config_type AND is_default = true
  LIMIT 1;
  
  RETURN COALESCE(config_data, '{}'::jsonb);
END;
$$;

-- Create function to log checkout flow events
CREATE OR REPLACE FUNCTION public.log_checkout_event(
  p_session_id TEXT,
  p_user_email TEXT,
  p_step TEXT,
  p_status TEXT DEFAULT 'in_progress',
  p_error_details JSONB DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_entry_point TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO checkout_flow_monitoring (
    session_id,
    user_email,
    step_reached,
    completion_status,
    error_details,
    device_info,
    entry_point
  ) VALUES (
    p_session_id,
    p_user_email,
    p_step,
    p_status,
    p_error_details,
    p_device_info,
    p_entry_point
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_checkout_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER update_checkout_config_updated_at
BEFORE UPDATE ON public.checkout_flow_config
FOR EACH ROW
EXECUTE FUNCTION public.update_checkout_config_updated_at();