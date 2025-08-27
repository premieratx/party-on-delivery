-- First, let's check the actual current policies on customer_orders
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'customer_orders';