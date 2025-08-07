-- Fix abandoned cart tracking table constraint
ALTER TABLE public.abandoned_carts 
ADD CONSTRAINT abandoned_carts_session_id_key UNIQUE (session_id);

-- Create webhook secret storage for Shopify
CREATE TABLE IF NOT EXISTS public.shopify_webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_secret TEXT NOT NULL,
  webhook_url TEXT,
  topics TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on webhook config
ALTER TABLE public.shopify_webhook_config ENABLE ROW LEVEL SECURITY;

-- Allow admin access to webhook config
CREATE POLICY "webhook_config_admin_access" ON public.shopify_webhook_config
  FOR ALL USING (true);