-- Create comprehensive BOOBS test flow with correct column names for all tables
-- 1. Cover Page
INSERT INTO public.cover_pages (
  id,
  title,
  subtitle,
  slug,
  flow_name,
  flow_description,
  theme,
  unified_theme,
  buttons,
  checklist,
  styles,
  is_active,
  is_default_homepage
) VALUES (
  gen_random_uuid(),
  'BOOBS',
  'Test Cover Page for BOOBS Flow',
  'boobs-cover',
  'BOOBS Flow',
  'Complete test flow with BOOBS theme',
  'default',
  'gold',
  '[
    {
      "text": "Start Shopping BOOBS",
      "action": "navigate", 
      "target": "/app/boobs-delivery",
      "style": "primary"
    }
  ]'::jsonb,
  '[
    {"text": "Premium Quality", "checked": true},
    {"text": "Fast Delivery", "checked": true},
    {"text": "24/7 Support", "checked": true}
  ]'::jsonb,
  '{}'::jsonb,
  true,
  false
);

-- 2. Delivery App with correct column structure
INSERT INTO public.delivery_app_variations (
  id,
  app_name,
  app_slug,
  short_path,
  logo_url,
  theme,
  collections_config,
  main_app_config,
  start_screen_config,
  post_checkout_config,
  styles,
  is_active,
  is_homepage
) VALUES (
  gen_random_uuid(),
  'BOOBS',
  'boobs-delivery',
  'boobs',
  null,
  'modern',
  '[
    {
      "name": "BOOBS Specials",
      "handle": "boobs-specials",
      "products": []
    },
    {
      "name": "Premium BOOBS",
      "handle": "premium-boobs", 
      "products": []
    }
  ]'::jsonb,
  '{
    "headerTitle": "BOOBS",
    "heroText": "Welcome to BOOBS Delivery - Premium Products Delivered Fast",
    "showSearch": true,
    "showCategories": true,
    "primaryColor": "#D4AF37",
    "secondaryColor": "#F5F5DC",
    "accentColor": "#FFD700"
  }'::jsonb,
  '{
    "showWelcome": true,
    "welcomeTitle": "BOOBS",
    "welcomeMessage": "Premium BOOBS products delivered to your door"
  }'::jsonb,
  '{
    "redirectUrl": "/post-checkout/boobs-success",
    "showThankYou": true
  }'::jsonb,
  '{}'::jsonb,
  true,
  false
);

-- 3. Post-Checkout Page with correct column structure (name, content)
INSERT INTO public.post_checkout_pages (
  id,
  name,
  slug,
  content,
  logo_url,
  theme,
  is_active,
  is_default
) VALUES (
  gen_random_uuid(),
  'BOOBS',
  'boobs-success',
  '{
    "customMessage": "Thank you for your BOOBS order! Your premium products will be delivered soon.",
    "buttons": [
      {
        "text": "Track Your BOOBS Order",
        "url": "#track-order",
        "style": "primary"
      },
      {
        "text": "Shop More BOOBS",
        "url": "/app/boobs-delivery", 
        "style": "secondary"
      }
    ]
  }'::jsonb,
  null,
  'gold',
  true,
  false
);

-- 4. Customer Flow (linking them all together)
INSERT INTO public.customer_flows (
  id,
  name,
  slug,
  cover_page_id,
  delivery_app_id,
  post_checkout_id,
  is_active,
  is_default
) VALUES (
  gen_random_uuid(),
  'BOOBS',
  'boobs-flow',
  (SELECT id FROM public.cover_pages WHERE slug = 'boobs-cover' LIMIT 1),
  (SELECT id FROM public.delivery_app_variations WHERE app_slug = 'boobs-delivery' LIMIT 1),
  (SELECT id FROM public.post_checkout_pages WHERE slug = 'boobs-success' LIMIT 1),
  true,
  false
);