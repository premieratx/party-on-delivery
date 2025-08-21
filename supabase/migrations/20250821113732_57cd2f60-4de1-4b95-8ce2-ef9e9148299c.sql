-- Create post checkout page that was missing (using correct table name)
INSERT INTO post_checkout_pages (id, slug, title, subtitle, message, background_color, text_color, cta_button_text, cta_button_url, logo_url, is_active, theme, created_at, updated_at)
VALUES 
  ('c46c5ff9-41e6-4d6c-b538-0dfd898498ed', 'boobs-success', 'Thank You for Your BOOBS Order!', 'Your premium products are on the way', 'We appreciate your business and will keep you updated on your delivery status.', '#FFD700', '#000000', 'Track Your Order', '/customer/dashboard', 'https://acmlfzfliqupwxwoefdq.supabase.co/storage/v1/object/public/delivery-app-logos/main-delivery-app-logo.png', true, 'gold', now(), now())
ON CONFLICT (id) DO NOTHING;