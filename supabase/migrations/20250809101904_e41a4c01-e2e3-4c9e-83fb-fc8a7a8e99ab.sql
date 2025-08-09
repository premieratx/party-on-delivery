-- 1) Create join table for affiliate ↔ app associations
CREATE TABLE IF NOT EXISTS public.affiliate_app_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL,
  app_variation_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by TEXT,
  UNIQUE(affiliate_id, app_variation_id),
  CONSTRAINT fk_affiliate FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_variation FOREIGN KEY (app_variation_id) REFERENCES public.delivery_app_variations(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.affiliate_app_assignments ENABLE ROW LEVEL SECURITY;

-- Policies: 
-- Admins can manage all
CREATE POLICY "Admins can manage affiliate_app_assignments" ON public.affiliate_app_assignments
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

-- Affiliates can read their associations
CREATE POLICY "Affiliates can read their assignments" ON public.affiliate_app_assignments
FOR SELECT TO authenticated
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE email = auth.email()));

-- 2) Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_app_assignments_affiliate ON public.affiliate_app_assignments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_app_assignments_app ON public.affiliate_app_assignments(app_variation_id);

-- 3) Optional: add venmo_handle already exists on affiliates table per schema
-- 4) Ensure vouchers table has affiliate link (if exists). If vouchers table exists, add affiliate_id column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vouchers'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vouchers' AND column_name = 'affiliate_id'
  ) THEN
    ALTER TABLE public.vouchers ADD COLUMN affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_vouchers_affiliate ON public.vouchers(affiliate_id);
  END IF;
END $$;

-- 5) Commission rate already on affiliates table; no schema change needed

-- 6) Helper view for generating affiliate links per app
CREATE OR REPLACE VIEW public.affiliate_app_links AS
SELECT 
  aaa.affiliate_id,
  a.email AS affiliate_email,
  a.affiliate_code,
  aaa.app_variation_id,
  dav.app_slug,
  dav.app_name,
  ('/app/' || dav.app_slug || '?aff=' || a.affiliate_code)::text AS share_link
FROM affiliate_app_assignments aaa
JOIN affiliates a ON a.id = aaa.affiliate_id
JOIN delivery_app_variations dav ON dav.id = aaa.app_variation_id;

-- 7) RLS for the view is derived from underlying tables, ensure select is allowed for affiliates
-- No additional policies required for views
