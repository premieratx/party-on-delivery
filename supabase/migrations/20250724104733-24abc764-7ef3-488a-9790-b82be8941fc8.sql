-- Add foreign key constraint between abandoned_orders and affiliates
ALTER TABLE public.abandoned_orders 
ADD CONSTRAINT fk_abandoned_orders_affiliate_id 
FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Create index for better performance on affiliate_id lookups
CREATE INDEX IF NOT EXISTS idx_abandoned_orders_affiliate_id_fk ON public.abandoned_orders(affiliate_id) WHERE affiliate_id IS NOT NULL;