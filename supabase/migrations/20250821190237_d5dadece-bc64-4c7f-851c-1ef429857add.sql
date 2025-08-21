-- Fix homepage delivery app - set Main Delivery App as homepage and remove from others
UPDATE delivery_app_variations 
SET is_homepage = false 
WHERE is_homepage = true;

UPDATE delivery_app_variations 
SET is_homepage = true 
WHERE app_slug = 'main-delivery-app' AND app_name = 'Main Delivery App';