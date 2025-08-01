-- Add group_order_name to customer_orders table for named group dashboards
ALTER TABLE public.customer_orders 
ADD COLUMN group_order_name text;

-- Create index for faster searching by group order name
CREATE INDEX idx_customer_orders_group_order_name ON public.customer_orders(group_order_name) WHERE group_order_name IS NOT NULL;