-- Remove the default homepage cover page that's causing the modal popup
UPDATE cover_pages 
SET is_default_homepage = false, is_active = false 
WHERE is_default_homepage = true;