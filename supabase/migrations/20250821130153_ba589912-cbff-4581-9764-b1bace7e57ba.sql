-- Create the "I love boobs" cover page for testing
INSERT INTO public.cover_pages (
  slug, 
  title, 
  subtitle, 
  checklist, 
  buttons, 
  theme, 
  unified_theme,
  styles,
  is_active, 
  is_default_homepage
) VALUES (
  'i-love-boobs', 
  'I Love Boobs',
  'Testing the customer flow functionality', 
  '[
    {"emoji": "🎉", "title": "Premium Quality", "description": "Top-tier products and service"},
    {"emoji": "🚀", "title": "Fast Delivery", "description": "Quick and reliable shipping"},
    {"emoji": "💎", "title": "Best Value", "description": "Unbeatable prices and deals"}
  ]',
  '[
    {"text": "Start Shopping", "type": "primary", "target": "/delivery", "app_slug": "homepage-delivery"},
    {"text": "Browse Collections", "type": "secondary", "target": "/products"}
  ]',
  'gold',
  'gold',
  '{}',
  true,
  false
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  checklist = EXCLUDED.checklist,
  buttons = EXCLUDED.buttons,
  theme = EXCLUDED.theme,
  unified_theme = EXCLUDED.unified_theme,
  is_active = EXCLUDED.is_active;