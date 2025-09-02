-- Add delivery address pre-fill and free delivery settings to delivery_app_variations
ALTER TABLE delivery_app_variations 
ADD COLUMN prefill_delivery_address jsonb DEFAULT NULL,
ADD COLUMN prefill_address_enabled boolean DEFAULT FALSE,
ADD COLUMN free_delivery_enabled boolean DEFAULT FALSE;