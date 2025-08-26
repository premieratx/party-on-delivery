-- Update existing cover pages to fit new vertical constraints
-- This ensures all cover pages will fit on any phone screen in the same orientation

-- Reset styles to default condensed values for all cover pages
UPDATE cover_pages 
SET styles = jsonb_build_object(
  'logoSize', 50,
  'headlineSize', 24,
  'subheadlineSize', 14,
  'logoVerticalPos', 0,
  'headlineVerticalPos', 0,
  'subheadlineVerticalPos', 0,
  'backgroundOpacity', COALESCE((styles->>'backgroundOpacity')::numeric, 0.7),
  'overlayColor', COALESCE(styles->>'overlayColor', '#000000')
)
WHERE id IS NOT NULL;