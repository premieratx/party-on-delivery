-- Add sample completed orders for testing sync
INSERT INTO customer_orders (
  order_number, customer_email, customer_name, customer_phone, total_amount, 
  subtotal, delivery_date, delivery_time, delivery_address, status, created_at
) VALUES 
('ORD-2025-001', 'john.doe@example.com', 'John Doe', '555-0101', 45.99, 41.99, '2025-01-15', '2:00 PM', '{"address_line_1": "123 Main St", "city": "Austin", "state": "TX", "zip_code": "78701"}', 'completed', '2025-01-10 14:30:00'),
('ORD-2025-002', 'jane.smith@example.com', 'Jane Smith', '555-0102', 67.50, 62.50, '2025-01-16', '4:00 PM', '{"address_line_1": "456 Oak Ave", "city": "Austin", "state": "TX", "zip_code": "78702"}', 'completed', '2025-01-11 16:45:00'),
('ORD-2025-003', 'mike.johnson@example.com', 'Mike Johnson', '555-0103', 89.25, 84.25, '2025-01-17', '6:00 PM', '{"address_line_1": "789 Pine Dr", "city": "Austin", "state": "TX", "zip_code": "78703"}', 'completed', '2025-01-12 18:20:00'),
('ORD-2025-004', 'sarah.wilson@example.com', 'Sarah Wilson', '555-0104', 34.75, 29.75, '2025-01-18', '12:00 PM', '{"address_line_1": "321 Elm St", "city": "Austin", "state": "TX", "zip_code": "78704"}', 'completed', '2025-01-13 12:15:00'),
('ORD-2025-005', 'david.brown@example.com', 'David Brown', '555-0105', 156.80, 151.80, '2025-01-19', '8:00 PM', '{"address_line_1": "654 Cedar Ln", "city": "Austin", "state": "TX", "zip_code": "78705"}', 'completed', '2025-01-14 20:30:00');

-- Add sample abandoned orders for testing sync
INSERT INTO abandoned_orders (
  customer_email, customer_name, customer_phone, total_amount, 
  subtotal, delivery_address, session_id, abandoned_at, last_activity_at
) VALUES 
('alex.garcia@example.com', 'Alex Garcia', '555-0201', 72.40, 67.40, '{"address_line_1": "987 Birch St", "city": "Austin", "state": "TX", "zip_code": "78706"}', 'session_001', '2025-01-10 16:30:00', '2025-01-10 16:15:00'),
('emily.davis@example.com', 'Emily Davis', '555-0202', 95.60, 90.60, '{"address_line_1": "147 Maple Ave", "city": "Austin", "state": "TX", "zip_code": "78707"}', 'session_002', '2025-01-11 18:45:00', '2025-01-11 18:30:00'),
('chris.miller@example.com', 'Chris Miller', '555-0203', 43.20, 38.20, '{"address_line_1": "258 Willow Rd", "city": "Austin", "state": "TX", "zip_code": "78708"}', 'session_003', '2025-01-12 20:15:00', '2025-01-12 20:00:00'),
('lisa.taylor@example.com', 'Lisa Taylor', '555-0204', 128.90, 123.90, '{"address_line_1": "369 Spruce Blvd", "city": "Austin", "state": "TX", "zip_code": "78709"}', 'session_004', '2025-01-13 14:20:00', '2025-01-13 14:05:00'),
('ryan.anderson@example.com', 'Ryan Anderson', '555-0205', 81.75, 76.75, '{"address_line_1": "741 Ash Ct", "city": "Austin", "state": "TX", "zip_code": "78710"}', 'session_005', '2025-01-14 22:30:00', '2025-01-14 22:15:00');