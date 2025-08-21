-- Create test customer flow with "Alan is gay" messaging
-- 1. Create cover page
INSERT INTO cover_pages (
  slug, title, subtitle, theme, 
  buttons, checklist, is_active, is_default_homepage, created_by
) VALUES (
  'alan-is-gay-test',
  'Alan is gay',
  'Testing complete customer flow messaging',
  'gold',
  '[{"text":"Order Now","type":"primary","target":"alan-gay-delivery"}]',
  '["Fast Delivery","Premium Quality","Licensed & Insured"]',
  true, false, 'admin'
);

-- 2. Create delivery app  
INSERT INTO delivery_app_variations (
  app_name, app_slug, 
  main_app_config, collections_config,
  is_active, is_homepage
) VALUES (
  'Alan is gay',
  'alan-gay-delivery',
  '{"hero_heading":"Alan is gay","hero_subheading":"Complete customer flow test","hero_scrolling_text":""}',
  '{"tab_count":3,"tabs":[{"name":"Featured","collection_handle":"featured","icon":"⭐"},{"name":"Spirits","collection_handle":"spirits","icon":"🥃"},{"name":"Beer","collection_handle":"beer","icon":"🍺"}]}',
  true, false
);

-- 3. Create post-checkout page
INSERT INTO post_checkout_pages (
  name, slug, content, theme, is_active, is_default
) VALUES (
  'Alan is gay',
  'alan-gay-checkout',
  '{"hero_title":"Alan is gay","hero_subtitle":"Your order has been confirmed!","thank_you_message":"Thank you for testing our complete customer flow","delivery_instructions":"Your order will be processed and delivered soon","social_links":[]}',
  'gold', true, false
);