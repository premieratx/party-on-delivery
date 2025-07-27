-- Add delivery address field to custom affiliate sites
ALTER TABLE public.custom_affiliate_sites 
ADD COLUMN delivery_address jsonb;

-- Update existing sites to use business address as delivery address initially
UPDATE public.custom_affiliate_sites 
SET delivery_address = business_address 
WHERE delivery_address IS NULL;