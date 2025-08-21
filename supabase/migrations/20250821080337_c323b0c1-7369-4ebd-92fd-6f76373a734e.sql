-- Create enhanced demo cover page
INSERT INTO cover_pages (
  slug, 
  title, 
  subtitle, 
  logo_url, 
  bg_image_url, 
  bg_video_url,
  buttons, 
  checklist, 
  theme, 
  styles, 
  is_active, 
  created_by
) VALUES (
  'enhanced-demo-cover',
  'Premium Delivery Experience',
  'Professional concierge service with luxury touches and seamless ordering',
  'https://premierpartycruises.com/wp-content/uploads/2025/01/PPC_logo_compressed_new_aggressive-1.png',
  null,
  '/videos/whiskey-pour-17370-360.mp4',
  '[
    {
      "text": "Start Premium Shopping", 
      "type": "primary", 
      "target": "/checkout",
      "color": "#d4af37",
      "textColor": "#000000"
    },
    {
      "text": "Browse Collections", 
      "type": "secondary", 
      "target": "/search",
      "color": "#8b5cf6",
      "textColor": "#ffffff"
    }
  ]'::jsonb,
  '[
    "⚡ Same Day Premium Delivery",
    "🏪 Locally Curated Selection", 
    "🍸 White-Glove Service Experience"
  ]'::jsonb,
  'gold',
  '{
    "variant": "gold",
    "logoEmoji": "✨",
    "features": [
      {"emoji": "⚡", "title": "Same Day Premium Delivery", "description": "Lightning-fast service with premium handling"},
      {"emoji": "🏪", "title": "Locally Curated Selection", "description": "Hand-picked products from trusted local vendors"},
      {"emoji": "🍸", "title": "White-Glove Service Experience", "description": "Concierge-level attention to every detail"}
    ],
    "customColors": {
      "primary": "#d4af37",
      "secondary": "#8b5cf6", 
      "accent": "#f59e0b"
    },
    "animations": {
      "enabled": true,
      "speed": "normal",
      "entrance": "fade"
    }
  }'::jsonb,
  true,
  'enhanced-demo'
);

-- Create post_checkout_pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_checkout_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on post_checkout_pages
ALTER TABLE post_checkout_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for post_checkout_pages
CREATE POLICY "post_checkout_pages_public_read" 
ON post_checkout_pages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "post_checkout_pages_admin_all" 
ON post_checkout_pages 
FOR ALL 
USING (is_admin_user_safe())
WITH CHECK (is_admin_user_safe());

-- Create enhanced demo post-checkout page
INSERT INTO post_checkout_pages (
  name,
  slug,
  content,
  is_active,
  is_default
) VALUES (
  'Enhanced Demo Order Complete',
  'enhanced-demo-order-complete',
  '{
    "title": "Order Confirmed! 🎉", 
    "subtitle": "Thank you for choosing our premium service. Your order is being prepared with the utmost care.",
    "logo_url": "https://premierpartycruises.com/wp-content/uploads/2025/01/PPC_logo_compressed_new_aggressive-1.png",
    "theme": "celebration",
    "variant": "gold",
    "continue_shopping_text": "Continue Premium Shopping",
    "continue_shopping_url": "/checkout",
    "primary_button_color": "#d4af37",
    "primary_button_text_color": "#000000",
    "manage_order_text": "Track My Order",
    "manage_order_url": "/orders",
    "secondary_button_color": "#8b5cf6", 
    "secondary_button_text_color": "#ffffff",
    "show_order_details": true,
    "show_delivery_info": true,
    "show_share_options": true,
    "thankYouMessage": "We appreciate your trust in our premium service. Every order receives our signature white-glove treatment.",
    "nextStepsMessage": "Your order is now in our fulfillment queue. Youll receive SMS and email updates as we prepare and deliver your items.",
    "testimonial": {
      "enabled": true,
      "text": "Absolutely incredible service! The attention to detail and speed of delivery exceeded all expectations. This is luxury convenience at its finest.",
      "author": "Sarah M., Austin",
      "rating": 5
    },
    "supportContact": {
      "phone": "+1 (512) 555-0123",
      "email": "concierge@premiumdelivery.com", 
      "hours": "Available 24/7 for our premium clients"
    },
    "animations": {
      "enabled": true,
      "celebrationEffect": true,
      "entranceAnimation": "fade"
    }
  }'::jsonb,
  true,
  false
);