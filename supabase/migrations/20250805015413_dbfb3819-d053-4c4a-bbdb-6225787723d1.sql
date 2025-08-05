-- Add custom post-checkout configuration to delivery_app_variations
ALTER TABLE public.delivery_app_variations 
ADD COLUMN IF NOT EXISTS custom_post_checkout_config JSONB DEFAULT '{
  "enabled": false,
  "title": "",
  "message": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "background_color": "#ffffff",
  "text_color": "#000000"
}'::jsonb;