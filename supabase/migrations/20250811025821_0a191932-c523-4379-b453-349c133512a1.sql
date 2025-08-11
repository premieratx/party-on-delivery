-- Add separate discount fields for affiliates
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;

-- Add default flag to affiliate_app_assignments (since affiliate_app_links is a view)
ALTER TABLE public.affiliate_app_assignments
  ADD COLUMN IF NOT EXISTS _df boolean DEFAULT false;

-- Ensure single default assignment per affiliate
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_assignment_default
  ON public.affiliate_app_assignments (affiliate_id)
  WHERE _df;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_delivery_apps_short_path ON public.delivery_app_variations(short_path);
