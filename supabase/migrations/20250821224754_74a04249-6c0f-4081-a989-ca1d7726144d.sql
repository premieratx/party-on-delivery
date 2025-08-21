-- Clean up invalid cover_page_id references
UPDATE customer_flows 
SET cover_page_id = NULL 
WHERE cover_page_id = '1eaf8f1b-6eb0-4f55-8438-69366a6784b7';

-- Add index to improve performance of cover page lookups
CREATE INDEX IF NOT EXISTS idx_customer_flows_cover_page_id 
ON customer_flows(cover_page_id) 
WHERE cover_page_id IS NOT NULL;