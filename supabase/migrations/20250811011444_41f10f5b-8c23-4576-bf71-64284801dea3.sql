-- Add per-affiliate commission configuration
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS commission_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS commission_value numeric;

-- Optional: basic constraint to ensure non-negative values (immutable safe)
ALTER TABLE public.affiliates
  ADD CONSTRAINT affiliates_commission_value_nonnegative CHECK (commission_value IS NULL OR commission_value >= 0);
