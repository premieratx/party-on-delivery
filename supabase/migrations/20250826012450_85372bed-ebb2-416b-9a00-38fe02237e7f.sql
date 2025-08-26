-- Update button positioning in existing cover pages to fit vertical constraints
-- This ensures buttons are positioned to fit within the preview window

UPDATE cover_pages 
SET styles = jsonb_set(
  jsonb_set(
    styles,
    '{buttonVerticalPos}', '0'
  ),
  '{buttonSpacing}', '10'
)
WHERE id IS NOT NULL;