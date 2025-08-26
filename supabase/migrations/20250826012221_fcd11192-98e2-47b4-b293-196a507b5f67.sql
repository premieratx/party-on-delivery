-- Update existing cover pages to fit new vertical constraints
-- This ensures all cover pages will fit on any phone screen in the same orientation

UPDATE cover_pages 
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(config, '{}'::jsonb),
            '{logo_size}', '50'
          ),
          '{headline_size}', '24'
        ),
        '{subheadline_size}', '14'
      ),
      '{logo_vertical_pos}', '0'
    ),
    '{headline_vertical_pos}', '0'
  ),
  '{subheadline_vertical_pos}', '0'
)
WHERE config IS NOT NULL;