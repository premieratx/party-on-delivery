-- Insert a test customer and order for group order testing
INSERT INTO public.customers (id, email, first_name, last_name, phone)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'test@partyondelivery.com',
  'Test',
  'Customer',
  '(555) 123-4567'
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone;

-- Insert a test order with share token for group order testing
INSERT INTO public.customer_orders (
  id,
  customer_id,
  order_number,
  total_amount,
  subtotal,
  delivery_fee,
  delivery_date,
  delivery_time,
  delivery_address,
  line_items,
  share_token,
  is_shareable,
  status
) VALUES (
  '456e7890-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  'TEST-GROUP-ORDER-001',
  85.50,
  75.00,
  10.50,
  CURRENT_DATE + INTERVAL '1 day',
  '6:00 PM - 8:00 PM',
  '{"street": "123 Test St", "city": "Austin", "state": "TX", "zipCode": "78701"}',
  '[{"id": "test-product-1", "title": "Test Product", "price": 25.00, "quantity": 3}]',
  '123e4567-e89b-12d3-a456-426614174000',
  true,
  'pending'
) ON CONFLICT (id) DO UPDATE SET
  share_token = EXCLUDED.share_token,
  is_shareable = EXCLUDED.is_shareable;