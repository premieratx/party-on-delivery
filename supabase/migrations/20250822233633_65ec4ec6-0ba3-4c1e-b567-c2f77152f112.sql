-- COMPLETE STANDALONE ARCHITECTURE - Remove ALL connections

-- 1. Remove cover page connections from post-checkout screens
ALTER TABLE post_checkout_screens DROP COLUMN IF EXISTS cover_page_id;

-- 2. Remove delivery app connections from cover page buttons (stored in JSON, but clean up any references)
UPDATE cover_pages SET buttons = '[]' WHERE buttons IS NULL;

-- 3. Remove post-checkout connections from delivery apps
ALTER TABLE delivery_app_variations DROP COLUMN IF EXISTS custom_post_checkout_config;
ALTER TABLE delivery_app_variations DROP COLUMN IF EXISTS post_checkout_config;

-- 4. Drop any remaining flow-related tables that connect components
DROP TABLE IF EXISTS affiliate_flows CASCADE;
DROP TABLE IF EXISTS flow_themes CASCADE;
DROP TABLE IF EXISTS cover_page_affiliate_assignments CASCADE;
DROP TABLE IF EXISTS homepage_cover_config CASCADE;

-- 5. Clean up affiliate order tracking to remove cover page connections
ALTER TABLE affiliate_order_tracking DROP COLUMN IF EXISTS cover_page_id;

-- 6. Remove delivery app connections from custom affiliate sites
ALTER TABLE custom_affiliate_sites DROP COLUMN IF EXISTS delivery_app_id;
ALTER TABLE custom_affiliate_sites DROP COLUMN IF EXISTS is_delivery_app;

-- 7. Drop delivery app collection mappings (unnecessary connection)
DROP TABLE IF EXISTS delivery_app_collection_mappings CASCADE;

-- 8. Ensure all tables are completely independent
COMMENT ON TABLE cover_pages IS 'Completely standalone cover pages - no dependencies on any other components';
COMMENT ON TABLE delivery_app_variations IS 'Completely standalone delivery apps - no dependencies on cover pages or post-checkout';
COMMENT ON TABLE post_checkout_screens IS 'Completely standalone post-checkout pages - no dependencies on cover pages or delivery apps';
COMMENT ON TABLE custom_affiliate_sites IS 'Completely standalone affiliate sites - no delivery app dependencies';

-- 9. Clean up any remaining button configurations that reference delivery apps
UPDATE cover_pages SET 
  buttons = jsonb_strip_nulls(
    jsonb_agg(
      CASE 
        WHEN jsonb_typeof(btn) = 'object' THEN
          btn - 'delivery_app_id' - 'assignment_type'
        ELSE btn 
      END
    )
  )
FROM (
  SELECT id, jsonb_array_elements(buttons) as btn 
  FROM cover_pages 
  WHERE jsonb_typeof(buttons) = 'array'
) as button_elements
WHERE cover_pages.id = button_elements.id;