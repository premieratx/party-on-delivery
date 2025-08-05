-- Add customization fields for start screen, main app, and post-checkout
ALTER TABLE delivery_app_variations 
ADD COLUMN start_screen_config jsonb DEFAULT '{"title": "", "subtitle": ""}'::jsonb,
ADD COLUMN main_app_config jsonb DEFAULT '{"hero_heading": ""}'::jsonb,
ADD COLUMN post_checkout_config jsonb DEFAULT '{"heading": "", "subheading": "", "redirect_url": ""}'::jsonb;