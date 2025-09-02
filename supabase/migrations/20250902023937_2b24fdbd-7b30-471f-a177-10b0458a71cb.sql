-- Remove the test data I added
DELETE FROM customer_orders WHERE order_number IN ('ORD-2025-001', 'ORD-2025-002', 'ORD-2025-003', 'ORD-2025-004', 'ORD-2025-005');
DELETE FROM abandoned_orders WHERE session_id IN ('session_001', 'session_002', 'session_003', 'session_004', 'session_005');