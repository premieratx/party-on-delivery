-- Fix "Alan is gay" customer flow post-checkout linking
UPDATE delivery_app_variations 
SET custom_post_checkout_config = jsonb_build_object(
  'enabled', true,
  'redirect_url', '/post-checkout/alan-gay-checkout',
  'title', 'Alan is gay - Order Complete!',
  'message', 'Your order has been confirmed!',
  'background_color', '#ffffff',
  'text_color', '#000000',
  'cta_button_text', 'View Order Details',
  'cta_button_url', ''
)
WHERE app_slug = 'alan-gay-delivery';

-- Ensure cover page button is properly configured
UPDATE cover_pages 
SET buttons = jsonb_build_array(
  jsonb_build_object(
    'text', 'Order Now',
    'type', 'primary', 
    'target', 'alan-gay-delivery'
  )
)
WHERE slug = 'alan-is-gay-test';