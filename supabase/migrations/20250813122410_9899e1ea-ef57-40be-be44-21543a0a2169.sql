-- Fix policy type mismatch by simplifying to email-based ownership check
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.customer_orders;

CREATE POLICY "Customers can view their own orders"
ON public.customer_orders
FOR SELECT
USING (
  (delivery_address->>'email') = auth.email()
);