-- Re-enable the main delivery app as homepage (fix from previous cleanup)
UPDATE delivery_app_variations 
SET is_homepage = true 
WHERE app_slug = 'boobs-delivery' AND is_active = true;

-- Log the homepage restoration
INSERT INTO ai_work_logs (
  session_id,
  action_type, 
  component_name,
  description,
  success
) VALUES (
  'homepage-restore-session',
  'configuration',
  'DynamicHomepage',
  'Restored main delivery app (BOOBS) as homepage after cleanup',
  true
);