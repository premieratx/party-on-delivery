-- Add short_path column to delivery_app_variations for customizable short links
ALTER TABLE public.delivery_app_variations
ADD COLUMN IF NOT EXISTS short_path TEXT;

-- Ensure short_path values are unique when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_app_variations_short_path_unique
ON public.delivery_app_variations (short_path)
WHERE short_path IS NOT NULL;

-- Set the short link for Premier Party Cruises app
UPDATE public.delivery_app_variations
SET short_path = 'premier'
WHERE app_slug = 'premier-party-cruises---official-alcohol-delivery-service';