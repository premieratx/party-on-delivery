-- Update the cover page button to link to the correct delivery app
UPDATE cover_pages 
SET 
  buttons = '[
    {
      "action": "navigate",
      "style": "primary", 
      "target": "/app/boobs-delivery",
      "text": "Start Shopping BOOBS"
    }
  ]'::jsonb,
  updated_at = now()
WHERE slug = 'i-love-boobs';