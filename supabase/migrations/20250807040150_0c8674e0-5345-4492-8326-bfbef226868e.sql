-- Add a checkbox field to set delivery app as homepage
ALTER TABLE delivery_app_variations 
ADD COLUMN is_homepage boolean DEFAULT false;

-- Update existing main delivery app as homepage
INSERT INTO delivery_app_variations (
  app_name, 
  app_slug, 
  collections_config, 
  is_active, 
  is_homepage,
  start_screen_config,
  main_app_config,
  post_checkout_config,
  logo_url
) VALUES (
  'Main Delivery App',
  'main-delivery-app',
  '{"tab_count": 5, "tabs": [{"name": "Beer", "collection_handle": "tailgate-beer"}, {"name": "Seltzers", "collection_handle": "seltzer-collection"}, {"name": "Cocktails", "collection_handle": "cocktail-kits"}, {"name": "Mixers & N/A", "collection_handle": "mixers-non-alcoholic"}, {"name": "Spirits", "collection_handle": "spirits"}]}',
  true,
  true,
  '{"title": "Party On Delivery", "subtitle": "Austin''s Premier Alcohol Delivery Service", "logo_url": ""}',
  '{"hero_heading": "Austin''s Premier Party Supply Delivery"}',
  '{"heading": "Order Confirmed!", "subheading": "Your order is being prepared and will be delivered as scheduled.", "redirect_url": "https://order.partyondelivery.com"}',
  ''
)
ON CONFLICT (app_slug) 
DO UPDATE SET 
  is_homepage = true,
  start_screen_config = EXCLUDED.start_screen_config,
  main_app_config = EXCLUDED.main_app_config,
  post_checkout_config = EXCLUDED.post_checkout_config;

-- Ensure only one app can be homepage at a time
CREATE OR REPLACE FUNCTION ensure_single_homepage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_homepage = true THEN
    UPDATE delivery_app_variations 
    SET is_homepage = false 
    WHERE id != NEW.id AND is_homepage = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_homepage
  BEFORE INSERT OR UPDATE OF is_homepage ON delivery_app_variations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_homepage();