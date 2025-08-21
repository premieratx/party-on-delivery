-- Fix BOOBS delivery app collections config structure
UPDATE delivery_app_variations 
SET 
  collections_config = '{
    "tab_count": 5,
    "tabs": [
      {
        "name": "Beer",
        "collection_handle": "tailgate-beer",
        "icon": "🍺",
        "subheadline_text": "Premium Beer Selection"
      },
      {
        "name": "Seltzers", 
        "collection_handle": "seltzer-collection",
        "icon": "🥤",
        "subheadline_text": "Refreshing Seltzers"
      },
      {
        "name": "Liquor",
        "collection_handle": "spirits", 
        "icon": "🥃",
        "subheadline_text": "Premium Spirits"
      },
      {
        "name": "Disco",
        "collection_handle": "disco-collection",
        "icon": "🕺", 
        "subheadline_text": "Disco Party Essentials"
      },
      {
        "name": "Party Supplies",
        "collection_handle": "party-supplies",
        "icon": "🎉",
        "subheadline_text": "Everything for the Party"
      }
    ]
  }'::jsonb,
  updated_at = now()
WHERE app_slug = 'boobs-delivery';