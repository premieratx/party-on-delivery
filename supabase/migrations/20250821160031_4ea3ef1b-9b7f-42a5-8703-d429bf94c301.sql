-- Disable any homepage cover modals that are causing issues
UPDATE homepage_cover_config 
SET is_active = false 
WHERE is_active = true;

-- Check for delivery apps that might be causing issues - look for ones with placeholder content
UPDATE delivery_app_variations 
SET is_homepage = false, is_active = false 
WHERE (
  app_name ILIKE '%placeholder%' 
  OR app_name ILIKE '%demo%' 
  OR app_name ILIKE '%test%'
  OR app_slug ILIKE '%placeholder%'
  OR app_slug ILIKE '%demo%'
  OR app_slug ILIKE '%test%'
);

-- Also disable any delivery apps that are currently set as homepage to prevent conflicts
UPDATE delivery_app_variations 
SET is_homepage = false
WHERE is_homepage = true;

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