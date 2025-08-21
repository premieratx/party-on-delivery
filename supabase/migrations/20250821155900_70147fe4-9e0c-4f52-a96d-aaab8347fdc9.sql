-- Disable any homepage cover modals that are causing issues
UPDATE homepage_cover_config 
SET is_active = false 
WHERE is_active = true;

-- Check for delivery apps that might be causing issues - look for ones with scrolling text or placeholder content
UPDATE delivery_app_variations 
SET is_homepage = false, is_active = false 
WHERE (
  app_name ILIKE '%placeholder%' 
  OR app_name ILIKE '%demo%' 
  OR app_name ILIKE '%test%'
  OR hero_heading ILIKE '%placeholder%'
  OR hero_subheading ILIKE '%placeholder%'
  OR JSON_EXTRACT_PATH_TEXT(collections_config::json, 'tabs', '0', 'name') ILIKE '%placeholder%'
);

-- Log the cleanup
INSERT INTO ai_work_logs (
  session_id,
  action_type, 
  component_name,
  description,
  success
) VALUES (
  'homepage-cleanup-session',
  'bug_fix',
  'DynamicHomepage',
  'Disabled homepage cover modals and placeholder delivery apps causing React errors and unwanted popups',
  true
);