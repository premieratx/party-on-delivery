-- Create sync configuration rules table
CREATE TABLE IF NOT EXISTS public.sync_configuration_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL, -- 'app_to_shopify', 'shopify_to_app', 'instant_cache'
  description TEXT,
  triggers JSONB NOT NULL DEFAULT '[]'::jsonb, -- What triggers this sync
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Conditions for when to sync
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- What actions to take
  priority INTEGER NOT NULL DEFAULT 5, -- 1-10, 1 being highest priority
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert core sync rules
INSERT INTO public.sync_configuration_rules (rule_name, rule_type, description, triggers, conditions, actions, priority, is_active) VALUES
-- App to Shopify Rules
('order_placement_sync', 'app_to_shopify', 'Sync order data to Shopify when orders are placed', 
 '["order_created", "payment_completed"]'::jsonb,
 '{"order_status": "confirmed", "payment_status": "paid"}'::jsonb,
 '["create_shopify_order", "update_inventory", "send_order_confirmation"]'::jsonb,
 1, true),

('manual_force_sync', 'app_to_shopify', 'Manual force sync triggered by admin', 
 '["admin_force_sync_clicked", "bulk_recategorization_sync"]'::jsonb,
 '{"user_role": "admin"}'::jsonb,
 '["sync_all_products", "sync_all_collections", "update_all_inventory"]'::jsonb,
 2, true),

-- Shopify to App Rules  
('product_webhook_sync', 'shopify_to_app', 'Sync product changes from Shopify webhooks',
 '["product_created", "product_updated", "product_deleted", "collection_updated"]'::jsonb,
 '{"source": "shopify_webhook"}'::jsonb,
 '["update_product_cache", "refresh_collections", "invalidate_instant_cache"]'::jsonb,
 1, true),

('manual_shopify_sync', 'shopify_to_app', 'Manual sync from Shopify to app',
 '["admin_sync_from_shopify_clicked"]'::jsonb,
 '{"user_role": "admin"}'::jsonb,
 '["fetch_all_products", "update_all_collections", "refresh_cache"]'::jsonb,
 3, true),

-- Instant Cache Rules
('instant_cache_refresh', 'instant_cache', 'Refresh instant cache for fast loading',
 '["cache_expiry", "product_updated", "collection_changed"]'::jsonb,
 '{"cache_age_minutes": 2, "force_refresh": false}'::jsonb,
 '["refresh_instant_cache", "preload_critical_data", "update_background_cache"]'::jsonb,
 1, true),

('emergency_cache_fallback', 'instant_cache', 'Emergency fallback when cache fails',
 '["cache_miss", "cache_error", "timeout"]'::jsonb,
 '{"fallback_enabled": true}'::jsonb,
 '["use_emergency_data", "trigger_background_refresh", "log_cache_failure"]'::jsonb,
 10, true);

-- Update custom_affiliate_sites to link delivery apps instead of custom sites
ALTER TABLE public.custom_affiliate_sites 
ADD COLUMN IF NOT EXISTS delivery_app_id UUID REFERENCES public.delivery_app_variations(id),
ADD COLUMN IF NOT EXISTS is_delivery_app BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sync_rules_type ON public.sync_configuration_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_sync_rules_active ON public.sync_configuration_rules(is_active);

-- Enable RLS
ALTER TABLE public.sync_configuration_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage sync rules" ON public.sync_configuration_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.email())
  );

CREATE POLICY "Service role can manage sync rules" ON public.sync_configuration_rules
  FOR ALL USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  );

CREATE POLICY "Sync rules are publicly readable" ON public.sync_configuration_rules
  FOR SELECT USING (is_active = true);