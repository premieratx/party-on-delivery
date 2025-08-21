-- Update post-checkout page with new button configurations
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
        "text": "Back to Home",
        "url": "https://order.partyondelivery.com/home",
        "style": "primary"
      },
      {
        "text": "Google boobs", 
        "url": "https://google.com",
        "style": "secondary"
      }
    ],
    "customMessage": "Thank you for choosing BOOBS! Your premium order will arrive soon.",
    "showSocialShare": true,
    "trackingEnabled": true,
    "freeShippingApplied": true
  }'::jsonb,
  updated_at = now()
WHERE slug = 'boobs-success';

-- Update BOOBS delivery app with larger logo and font sizes
UPDATE delivery_app_variations 
SET 
  logo_width = 360,
  logo_url = (SELECT logo_url FROM delivery_app_variations WHERE is_homepage = true LIMIT 1),
  main_app_config = jsonb_set(
    main_app_config,
    '{headerTitleSize}',
    '"text-6xl"'::jsonb
  ),
  styles = '{
    "logoScale": 3,
    "headerFontSize": "text-6xl font-bold",
    "customCSS": ".hero-title { font-size: 3rem !important; font-weight: bold; }"
  }'::jsonb,
  updated_at = now()
WHERE app_slug = 'boobs-delivery';