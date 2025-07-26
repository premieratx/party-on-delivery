-- Clear old orders for the test customer
DELETE FROM customer_orders WHERE customer_id IN (
  SELECT id FROM customers WHERE email = 'ppcaustin@gmail.com'
);

-- Reset customer stats
UPDATE customers 
SET total_orders = 0, total_spent = 0.00 
WHERE email = 'ppcaustin@gmail.com';