-- Add sharing functionality to customer orders
ALTER TABLE public.customer_orders 
ADD COLUMN share_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN is_shareable boolean DEFAULT true,
ADD COLUMN shared_at timestamp with time zone;

-- Create index for fast share token lookups
CREATE INDEX idx_customer_orders_share_token ON public.customer_orders(share_token);

-- Create table for tracking who joined shared orders
CREATE TABLE public.shared_order_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES customer_orders(id) NOT NULL,
  participant_email text NOT NULL,
  participant_name text,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  items_added jsonb DEFAULT '[]'::jsonb,
  total_contribution numeric DEFAULT 0.00,
  UNIQUE(order_id, participant_email)
);

-- Enable RLS on new table
ALTER TABLE public.shared_order_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared order participants
CREATE POLICY "Order owners can view all participants" 
ON public.shared_order_participants 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM customer_orders 
    WHERE customer_id IN (
      SELECT id FROM customers WHERE email = auth.email()
    )
  )
);

CREATE POLICY "Participants can view their own participation" 
ON public.shared_order_participants 
FOR SELECT 
USING (participant_email = auth.email());

CREATE POLICY "Anyone can join shared orders" 
ON public.shared_order_participants 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Participants can update their own participation" 
ON public.shared_order_participants 
FOR UPDATE 
USING (participant_email = auth.email());