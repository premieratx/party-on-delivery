-- Create post checkout page with correct structure
INSERT INTO post_checkout_pages (id, name, slug, content, is_active, is_default, theme, logo_url, created_at, updated_at)
VALUES 
  ('c46c5ff9-41e6-4d6c-b538-0dfd898498ed', 'BOOBS Success Page', 'boobs-success', 
   jsonb_build_object(
     'title', 'Thank You for Your BOOBS Order!',
     'subtitle', 'Your premium products are on the way',
     'message', 'We appreciate your business and will keep you updated on your delivery status.',
     'buttons', jsonb_build_array(
       jsonb_build_object(
         'text', 'Track Your Order',
         'url', '/customer/dashboard',
         'type', 'primary'
       ),
       jsonb_build_object(
         'text', 'Shop Again',
         'url', '/app/party-on-delivery---concierge-/tabs',
         'type', 'secondary'
       )
     )
   ), 
   true, false, 'gold', 
   'https://acmlfzfliqupwxwoefdq.supabase.co/storage/v1/object/public/delivery-app-logos/main-delivery-app-logo.png', 
   now(), now())
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  theme = EXCLUDED.theme,
  updated_at = now();