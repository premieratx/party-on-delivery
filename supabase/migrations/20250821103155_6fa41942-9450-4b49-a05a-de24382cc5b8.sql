-- Create comprehensive BOOBS test flow
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

-- 2. Delivery App
INSERT INTO public.delivery_app_variations (
  id,
  app_name,
  app_slug,
  hero_text,
  logo_url,
  theme_colors,
  collections,
  is_active,
  is_homepage,
  post_checkout_redirect_url
) VALUES (
  gen_random_uuid(),
  'BOOBS',
  'boobs-delivery',
  'Welcome to BOOBS Delivery - Premium Products Delivered Fast',
  null,
  '{
    "primary": "#D4AF37",
    "secondary": "#F5F5DC", 
    "accent": "#FFD700",
    "background": "#FFFFFF"
  }'::jsonb,
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
  true,
  false,
  '/post-checkout/boobs-success'
);

-- 3. Post-Checkout Page
INSERT INTO public.post_checkout_pages (
  id,
  page_name,
  slug,
  custom_message,
  logo_url,
  theme,
  buttons,
  is_active,
  is_default
) VALUES (
  gen_random_uuid(),
  'BOOBS',
  'boobs-success',
  'Thank you for your BOOBS order! Your premium products will be delivered soon.',
  null,
  'gold',
  '[
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
  ]'::jsonb,
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