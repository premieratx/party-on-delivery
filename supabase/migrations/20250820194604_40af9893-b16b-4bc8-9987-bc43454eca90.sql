-- Remove scrolling text from the homepage delivery app to eliminate React #310 error
UPDATE delivery_app_variations 
SET main_app_config = jsonb_set(
    COALESCE(main_app_config, '{}'::jsonb),
    '{hero_scrolling_text}',
    '""'
)
WHERE is_homepage = true AND is_active = true;