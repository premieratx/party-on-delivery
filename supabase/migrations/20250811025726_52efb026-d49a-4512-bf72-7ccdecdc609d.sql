-- Add separate discount fields for affiliates and default flag for affiliate-app links
-- 1) Add discount_type and discount_value to affiliates
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;

-- 2) Add default flag (_df) to affiliate_app_links and ensure single default per affiliate
ALTER TABLE public.affiliate_app_links
  ADD COLUMN IF NOT EXISTS _df boolean DEFAULT false;

-- Unique partial index to allow only one default link per affiliate
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_default_link
  ON public.affiliate_app_links (affiliate_id)
  WHERE _df;

-- Helpful indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_delivery_apps_short_path ON public.delivery_app_variations(short_path);
