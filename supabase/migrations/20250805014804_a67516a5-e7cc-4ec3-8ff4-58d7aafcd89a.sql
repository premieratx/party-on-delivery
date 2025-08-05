-- Add delivery app linking columns to custom_affiliate_sites table
DO $$ 
BEGIN
    -- Add delivery_app_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'custom_affiliate_sites' 
                  AND column_name = 'delivery_app_id') THEN
        ALTER TABLE public.custom_affiliate_sites 
        ADD COLUMN delivery_app_id UUID REFERENCES public.delivery_app_variations(id);
    END IF;
    
    -- Add is_delivery_app column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'custom_affiliate_sites' 
                  AND column_name = 'is_delivery_app') THEN
        ALTER TABLE public.custom_affiliate_sites 
        ADD COLUMN is_delivery_app BOOLEAN DEFAULT false;
    END IF;
END $$;