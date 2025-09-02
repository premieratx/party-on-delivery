-- Add sort_order column to delivery_app_variations table
ALTER TABLE delivery_app_variations 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Set initial sort_order based on created_at (oldest = 0, newest = higher numbers)
UPDATE delivery_app_variations 
SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) - 1
  FROM (SELECT id, created_at FROM delivery_app_variations) ranked
  WHERE ranked.id = delivery_app_variations.id
);