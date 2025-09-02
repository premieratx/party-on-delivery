-- Add test completed orders
INSERT INTO customer_orders (
  order_number, session_id, subtotal, delivery_fee, total_amount, 
  status, delivery_date, delivery_time, delivery_address, 
  special_instructions, affiliate_code, line_items, created_at
) VALUES 
  ('ORD-2024-001', 'sess_001', 45.99, 5.00, 50.99, 'completed', '2024-01-15', '2:00 PM - 4:00 PM', '{"street": "123 Main St", "city": "New York", "zip": "10001"}', 'Leave at door', 'AFF001', '[{"title": "Premium Beer Pack", "quantity": 2, "price": 22.99}]', '2024-01-15 14:30:00'),
  ('ORD-2024-002', 'sess_002', 89.50, 7.50, 97.00, 'delivered', '2024-01-15', '6:00 PM - 8:00 PM', '{"street": "456 Oak Ave", "city": "Brooklyn", "zip": "11201"}', 'Ring doorbell', 'AFF002', '[{"title": "Wine Selection", "quantity": 3, "price": 29.83}]', '2024-01-15 18:45:00'),
  ('ORD-2024-003', 'sess_003', 67.25, 5.00, 72.25, 'confirmed', '2024-01-16', '12:00 PM - 2:00 PM', '{"street": "789 Pine St", "city": "Manhattan", "zip": "10002"}', 'Call when arriving', NULL, '[{"title": "Craft Beer Variety", "quantity": 1, "price": 67.25}]', '2024-01-16 10:15:00'),
  ('ORD-2024-004', 'sess_004', 34.75, 5.00, 39.75, 'completed', '2024-01-16', '4:00 PM - 6:00 PM', '{"street": "321 Elm St", "city": "Queens", "zip": "11101"}', 'Apartment 3B', 'AFF001', '[{"title": "Light Beer Pack", "quantity": 2, "price": 17.37}]', '2024-01-16 16:20:00'),
  ('ORD-2024-005', 'sess_005', 125.00, 10.00, 135.00, 'delivered', '2024-01-17', '7:00 PM - 9:00 PM', '{"street": "654 Cedar Ave", "city": "Bronx", "zip": "10451"}', 'Use side entrance', 'AFF003', '[{"title": "Premium Wine Collection", "quantity": 1, "price": 125.00}]', '2024-01-17 19:30:00');

-- Add test abandoned orders
INSERT INTO abandoned_orders (
  customer_name, customer_email, customer_phone, delivery_address,
  cart_items, subtotal, total_amount, abandoned_at, last_activity_at,
  affiliate_code, session_id, contains_payment_info
) VALUES 
  ('John Smith', 'john.smith@email.com', '555-0101', '123 Abandoned St, NYC, 10001', '[{"title": "Beer Sampler", "quantity": 1, "price": 28.99}]', 28.99, 33.99, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 'AFF001', 'abandoned_001', false),
  ('Sarah Johnson', 'sarah.j@email.com', '555-0102', '456 Left Cart Ave, Brooklyn, 11201', '[{"title": "Wine Tasting Set", "quantity": 2, "price": 24.50}]', 49.00, 54.00, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', 'AFF002', 'abandoned_002', true),
  ('Mike Wilson', 'mike.w@email.com', NULL, '789 Incomplete Rd, Queens, 11101', '[{"title": "Craft Beer Bundle", "quantity": 1, "price": 42.75}]', 42.75, 47.75, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NULL, 'abandoned_003', false),
  ('Lisa Brown', 'lisa.brown@email.com', '555-0104', '321 Timeout St, Manhattan, 10002', '[{"title": "Spirits Collection", "quantity": 1, "price": 89.99}, {"title": "Mixer Pack", "quantity": 2, "price": 12.50}]', 114.99, 119.99, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', 'AFF001', 'abandoned_004', true),
  ('David Garcia', 'david.g@email.com', '555-0105', '654 Session End Blvd, Bronx, 10451', '[{"title": "Beer & Snacks Combo", "quantity": 3, "price": 18.33}]', 54.99, 59.99, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', 'AFF003', 'abandoned_005', false);