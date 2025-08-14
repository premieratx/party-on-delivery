-- Set Premier Party Cruises as the homepage and remove homepage status from others
UPDATE delivery_app_variations 
SET is_homepage = false 
WHERE is_homepage = true;

UPDATE delivery_app_variations 
SET is_homepage = true 
WHERE app_slug = 'premier-party-cruises---official-alcohol-delivery-service';