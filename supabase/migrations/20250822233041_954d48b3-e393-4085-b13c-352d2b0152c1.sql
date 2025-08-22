-- Remove customer flow functionality - make components standalone

-- First, safely remove foreign key constraints that reference customer_flows
ALTER TABLE affiliate_flow_assignments DROP CONSTRAINT IF EXISTS affiliate_flow_assignments_customer_flow_id_fkey;

-- Remove customer flow references from cover pages
ALTER TABLE cover_pages DROP COLUMN IF EXISTS flow_id;
ALTER TABLE cover_pages DROP COLUMN IF EXISTS customer_flow_id;

-- Remove customer flow references from delivery apps  
ALTER TABLE delivery_app_variations DROP COLUMN IF EXISTS customer_flow_id;
ALTER TABLE delivery_app_variations DROP COLUMN IF EXISTS flow_id;

-- Remove customer flow references from post checkout pages
ALTER TABLE post_checkout_pages DROP COLUMN IF EXISTS customer_flow_id;
ALTER TABLE post_checkout_pages DROP COLUMN IF EXISTS flow_id;

-- Drop the customer_flows table entirely
DROP TABLE IF EXISTS customer_flows CASCADE;

-- Drop affiliate flow assignments that were dependent on customer flows
DROP TABLE IF EXISTS affiliate_flow_assignments CASCADE;

-- Clean up any remaining references
COMMENT ON TABLE cover_pages IS 'Standalone cover pages - no flow dependencies';
COMMENT ON TABLE delivery_app_variations IS 'Standalone delivery apps - no flow dependencies';
COMMENT ON TABLE post_checkout_pages IS 'Standalone post-checkout pages - no flow dependencies';