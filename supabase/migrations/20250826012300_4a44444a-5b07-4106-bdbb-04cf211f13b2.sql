-- Update existing cover pages to fit new vertical constraints
-- This ensures all cover pages will fit on any phone screen in the same orientation

-- First, let's check what style fields need to be updated in the styles jsonb column
UPDATE cover_pages 
SET styles = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(styles, '{}'::jsonb),
            '{logoSize}', '50'
          ),
          '{headlineSize}', '24'
        ),
        '{subheadlineSize}', '14'
      ),
      '{logoVerticalPos}', '0'
    ),
    '{headlineVerticalPos}', '0'
  ),
  '{subheadlineVerticalPos}', '0'
)
WHERE id IS NOT NULL;