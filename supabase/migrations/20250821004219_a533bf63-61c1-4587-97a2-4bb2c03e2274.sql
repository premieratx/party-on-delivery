-- Add free_shipping_enabled column to cover_pages table
ALTER TABLE public.cover_pages 
ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN DEFAULT false;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_cover_pages_free_shipping 
ON public.cover_pages (free_shipping_enabled) 
WHERE free_shipping_enabled = true;