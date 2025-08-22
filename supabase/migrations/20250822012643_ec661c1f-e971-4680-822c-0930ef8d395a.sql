-- Add hero_config column to delivery_app_variations table for visual customization
ALTER TABLE delivery_app_variations 
ADD COLUMN IF NOT EXISTS hero_config JSONB DEFAULT '{}'::jsonb;

-- Add comment to describe the new column
COMMENT ON COLUMN delivery_app_variations.hero_config IS 'Visual customization settings for the delivery app hero section including fonts, colors, sizes, positions, and animations';