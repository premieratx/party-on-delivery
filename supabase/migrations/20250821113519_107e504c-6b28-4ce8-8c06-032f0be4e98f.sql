-- Create post checkout screens that were missing
INSERT INTO post_checkout_screens (id, slug, title, subtitle, message, background_color, text_color, cta_button_text, cta_button_url, logo_url, is_active, theme, created_at, updated_at)
VALUES 
  ('c46c5ff9-41e6-4d6c-b538-0dfd898498ed', 'boobs-success', 'Thank You for Your BOOBS Order!', 'Your premium products are on the way', 'We appreciate your business and will keep you updated on your delivery status.', '#FFD700', '#000000', 'Track Your Order', '/customer/dashboard', 'https://acmlfzfliqupwxwoefdq.supabase.co/storage/v1/object/public/delivery-app-logos/main-delivery-app-logo.png', true, 'gold', now(), now());

-- Create affiliate and affiliate flow assignment for the BOOBS flow
INSERT INTO affiliates (id, name, email, affiliate_code, company_name, status, commission_rate, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Affiliate', 'test@example.com', 'TEST001', 'Test Company', 'active', 5.00, now(), now())
ON CONFLICT (affiliate_code) DO NOTHING;

-- Create affiliate flow assignment
INSERT INTO affiliate_flow_assignments (affiliate_id, customer_flow_id, share_slug, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM customer_flows WHERE slug = 'i-love-boobs-flow' LIMIT 1),
  'boobs-test-flow',
  true,
  now(),
  now()
);