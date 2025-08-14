-- Set Main Delivery App as the homepage
UPDATE delivery_app_variations 
SET is_homepage = true 
WHERE app_slug = 'main-delivery-app';

-- Remove homepage status from Premier Party Cruises
UPDATE delivery_app_variations 
SET is_homepage = false 
WHERE app_slug = 'premier-party-cruises---official-alcohol-delivery-service';