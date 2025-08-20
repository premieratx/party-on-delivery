-- Duplicate the Airbnb delivery service app variation
INSERT INTO delivery_app_variations (
  app_name,
  app_slug,
  collections_config,
  main_app_config,
  post_checkout_config,
  start_screen_config,
  custom_post_checkout_config,
  is_active,
  is_homepage,
  logo_url,
  styles,
  created_at,
  updated_at
)
SELECT 
  'Airbnb Concierge Service (Copy)',
  'airbnb-concierge-copy',
  collections_config,
  main_app_config,
  post_checkout_config,
  start_screen_config,
  custom_post_checkout_config,
  true,
  false,
  logo_url,
  styles,
  now(),
  now()
FROM delivery_app_variations 
WHERE app_slug = 'airbnb-concierge-service'
LIMIT 1;