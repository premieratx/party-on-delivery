-- Add discount and shipping fields to affiliate_flow_assignments table
ALTER TABLE public.affiliate_flow_assignments 
ADD COLUMN free_shipping boolean DEFAULT false,
ADD COLUMN discount_type text CHECK (discount_type IN ('percentage', 'dollar', 'both')) DEFAULT NULL,
ADD COLUMN discount_percentage numeric(5,2) DEFAULT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD COLUMN discount_dollar_amount numeric(10,2) DEFAULT NULL CHECK (discount_dollar_amount >= 0);