-- Enable real-time updates for customer_orders table
ALTER TABLE public.customer_orders REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_orders;