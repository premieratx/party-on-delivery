-- Add sample completed orders for testing sync (using correct columns)
INSERT INTO customer_orders (
  order_number, total_amount, subtotal, delivery_date, delivery_time, 
  delivery_address, status, created_at, session_id
) VALUES 
('ORD-2025-001', 45.99, 41.99, '2025-01-15', '2:00 PM', '{"address_line_1": "123 Main St", "city": "Austin", "state": "TX", "zip_code": "78701"}', 'completed', '2025-01-10 14:30:00', 'session_john_doe'),
('ORD-2025-002', 67.50, 62.50, '2025-01-16', '4:00 PM', '{"address_line_1": "456 Oak Ave", "city": "Austin", "state": "TX", "zip_code": "78702"}', 'completed', '2025-01-11 16:45:00', 'session_jane_smith'),
('ORD-2025-003', 89.25, 84.25, '2025-01-17', '6:00 PM', '{"address_line_1": "789 Pine Dr", "city": "Austin", "state": "TX", "zip_code": "78703"}', 'completed', '2025-01-12 18:20:00', 'session_mike_johnson'),
('ORD-2025-004', 34.75, 29.75, '2025-01-18', '12:00 PM', '{"address_line_1": "321 Elm St", "city": "Austin", "state": "TX", "zip_code": "78704"}', 'completed', '2025-01-13 12:15:00', 'session_sarah_wilson'),
('ORD-2025-005', 156.80, 151.80, '2025-01-19', '8:00 PM', '{"address_line_1": "654 Cedar Ln", "city": "Austin", "state": "TX", "zip_code": "78705"}', 'completed', '2025-01-14 20:30:00', 'session_david_brown');