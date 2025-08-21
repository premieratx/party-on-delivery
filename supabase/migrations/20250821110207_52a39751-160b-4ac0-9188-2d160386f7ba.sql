-- Update BOOBS delivery app with 5 tabs and matching Shopify collections
UPDATE delivery_app_variations 
SET 
  collections_config = '[
    {
      "handle": "tailgate-beer",
      "name": "Beer",
      "products": []
    },
    {
      "handle": "seltzer-collection", 
      "name": "Seltzers",
      "products": []
    },
    {
      "handle": "spirits",
      "name": "Liquor", 
      "products": []
    },
    {
      "handle": "disco-collection",
      "name": "Disco",
      "products": []
    },
    {
      "handle": "party-supplies",
      "name": "Party Supplies", 
      "products": []
    }
  ]'::jsonb,
  updated_at = now()
WHERE app_slug = 'boobs-delivery';

-- Update BOOBS cover page title and slug
UPDATE cover_pages 
SET 
  title = 'I love boobs',
  slug = 'i-love-boobs',
  updated_at = now()
WHERE slug = 'boobs-cover';

-- Update BOOBS post-checkout to use enhanced template content
UPDATE post_checkout_pages
SET 
  content = '{
    "title": "Thank You for Your Order!",
    "subtitle": "Your BOOBS order has been confirmed",
    "orderNumber": "#BOOBS-2024",
    "estimatedDelivery": "45-60 minutes",
    "deliveryAddress": {
      "street": "123 Party Lane",
      "city": "Austin",
      "state": "TX",
      "zip": "78701"
    },
    "contactInfo": {
      "phone": "(512) 555-BOOBS",
      "email": "support@partyondelivery.com"
    },
    "orderItems": [
      {
        "name": "Premium BOOBS Selection",
        "quantity": 1,
        "price": 89.99
      }
    ],
    "orderTotal": {
      "subtotal": 89.99,
      "delivery": 0.00,
      "tax": 7.20,
      "total": 97.19
    },
    "buttons": [
      {
        "text": "Track Your Order",
        "url": "#track-order",
        "style": "primary"
      },
      {
        "text": "Shop Again",
        "url": "/app/boobs-delivery", 
        "style": "secondary"
      }
    ],
    "customMessage": "Thank you for choosing BOOBS! Your premium order will arrive soon.",
    "showSocialShare": true,
    "trackingEnabled": true
  }'::jsonb,
  updated_at = now()
WHERE slug = 'boobs-success';

-- Create or update customer flow linking everything together with free shipping
INSERT INTO customer_flows (name, slug, cover_page_id, delivery_app_id, post_checkout_id, is_active, is_default)
VALUES (
  'I Love BOOBS Flow',
  'i-love-boobs-flow',
  (SELECT id FROM cover_pages WHERE slug = 'i-love-boobs'),
  (SELECT id FROM delivery_app_variations WHERE app_slug = 'boobs-delivery'),
  (SELECT id FROM post_checkout_pages WHERE slug = 'boobs-success'),
  true,
  false
)
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  cover_page_id = EXCLUDED.cover_page_id,
  delivery_app_id = EXCLUDED.delivery_app_id, 
  post_checkout_id = EXCLUDED.post_checkout_id,
  updated_at = now();

-- Enable free shipping on the cover page
UPDATE cover_pages 
SET free_shipping_enabled = true
WHERE slug = 'i-love-boobs';