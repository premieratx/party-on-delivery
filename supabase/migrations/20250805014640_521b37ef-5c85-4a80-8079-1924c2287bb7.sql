-- Create sync configuration rules table to store application sync logic
CREATE TABLE IF NOT EXISTS public.sync_configuration_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL, -- 'sync_timing', 'data_format', 'error_handling', etc.
  source_system TEXT NOT NULL, -- 'app', 'shopify', 'stripe', 'supabase'
  target_system TEXT NOT NULL, -- 'app', 'shopify', 'stripe', 'supabase'
  rule_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_configuration_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage sync rules" ON public.sync_configuration_rules
FOR ALL USING (EXISTS (
  SELECT 1 FROM admin_users WHERE email = auth.email()
));

CREATE POLICY "System can read sync rules" ON public.sync_configuration_rules
FOR SELECT USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_sync_rules_type_source ON public.sync_configuration_rules(rule_type, source_system);
CREATE INDEX idx_sync_rules_active ON public.sync_configuration_rules(is_active);

-- Insert core sync rules
INSERT INTO public.sync_configuration_rules (rule_name, rule_type, source_system, target_system, rule_config, description, priority) VALUES

-- App to Shopify sync rules
('order_placement_sync', 'sync_timing', 'app', 'shopify', 
'{
  "trigger": "payment_success",
  "delay_seconds": 0,
  "retry_attempts": 3,
  "retry_delay": 5,
  "format_rules": {
    "price_precision": 2,
    "amount_format": "dollars",
    "currency": "USD",
    "tax_calculation": "precise",
    "tip_handling": "native_shopify"
  }
}', 'Sync orders from app to Shopify immediately after payment', 1),

('manual_force_sync', 'sync_timing', 'app', 'shopify',
'{
  "trigger": "admin_action",
  "bulk_sync": true,
  "batch_size": 50,
  "validation_rules": {
    "verify_amounts": true,
    "check_duplicates": true,
    "validate_products": true
  }
}', 'Manual bulk sync from admin dashboard', 90),

-- Shopify to App sync rules  
('product_webhook_sync', 'sync_timing', 'shopify', 'app',
'{
  "trigger": "webhook",
  "events": ["product/create", "product/update", "inventory/update"],
  "delay_seconds": 2,
  "cache_invalidation": true,
  "update_categories": true
}', 'Real-time product sync from Shopify webhooks', 5),

('manual_shopify_sync', 'sync_timing', 'shopify', 'app',
'{
  "trigger": "admin_action", 
  "fetch_all": true,
  "update_cache": true,
  "sync_collections": true,
  "sync_inventory": true
}', 'Manual product sync from Shopify admin', 80),

-- Instant cache refresh rules
('instant_cache_refresh', 'cache_management', 'app', 'app',
'{
  "trigger": "product_update",
  "cache_types": ["products", "collections", "categories"],
  "max_age_minutes": 5,
  "preload_popular": true
}', 'Instant cache refresh for product updates', 10),

('emergency_cache_fallback', 'error_handling', 'app', 'shopify',
'{
  "trigger": "cache_miss",
  "fallback_source": "shopify_api",
  "cache_duration": 300,
  "retry_cache_after": 60
}', 'Emergency fallback to Shopify API when cache fails', 5);

-- Add column to existing custom_affiliate_sites table for delivery app linking
ALTER TABLE public.custom_affiliate_sites 
ADD COLUMN IF NOT EXISTS delivery_app_id UUID REFERENCES public.delivery_app_variations(id),
ADD COLUMN IF NOT EXISTS is_delivery_app BOOLEAN DEFAULT false;