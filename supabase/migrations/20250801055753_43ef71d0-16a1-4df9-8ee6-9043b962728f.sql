-- Add RLS policy to allow public access to shared orders via share_token
CREATE POLICY "Anyone can view shared orders via share_token" 
ON public.customer_orders 
FOR SELECT 
USING (share_token IS NOT NULL AND is_shareable = true);

-- Update our test order to ensure it's shareable
UPDATE public.customer_orders 
SET is_shareable = true 
WHERE share_token = '123e4567-e89b-12d3-a456-426614174000';