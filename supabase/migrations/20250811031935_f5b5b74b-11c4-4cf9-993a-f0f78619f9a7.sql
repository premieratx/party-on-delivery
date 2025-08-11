-- Affiliate discounts and default assignment safeguards
-- Idempotent migration

-- 1) Ensure discount fields exist on affiliates
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent';

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0;

-- 2) Ensure default flag exists on affiliate_app_assignments
ALTER TABLE public.affiliate_app_assignments
  ADD COLUMN IF NOT EXISTS _df boolean DEFAULT false;

-- 3) Indexes to speed up short link lookups and affiliate code queries
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code
  ON public.affiliates (affiliate_code);

CREATE INDEX IF NOT EXISTS idx_delivery_app_variations_short_path
  ON public.delivery_app_variations (short_path);

-- 4) Enforce at most one default assignment per affiliate via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_default_assignment
  ON public.affiliate_app_assignments (affiliate_id)
  WHERE _df IS TRUE;