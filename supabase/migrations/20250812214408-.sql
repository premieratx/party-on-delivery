-- Create table for assigning affiliates to cover pages with per-assignment slug
CREATE TABLE IF NOT EXISTS public.cover_page_affiliate_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_page_id UUID NOT NULL,
  affiliate_id UUID NOT NULL,
  share_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cover_page_id, affiliate_id),
  UNIQUE (cover_page_id, share_slug)
);

-- FKs
ALTER TABLE public.cover_page_affiliate_assignments
  ADD CONSTRAINT fk_cpaa_cover_page
  FOREIGN KEY (cover_page_id)
  REFERENCES public.cover_pages (id)
  ON DELETE CASCADE;

ALTER TABLE public.cover_page_affiliate_assignments
  ADD CONSTRAINT fk_cpaa_affiliate
  FOREIGN KEY (affiliate_id)
  REFERENCES public.affiliates (id)
  ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cpaa_affiliate ON public.cover_page_affiliate_assignments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cpaa_cover_page ON public.cover_page_affiliate_assignments(cover_page_id);
CREATE INDEX IF NOT EXISTS idx_cpaa_share_slug ON public.cover_page_affiliate_assignments(share_slug);

-- Enable RLS
ALTER TABLE public.cover_page_affiliate_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage all
CREATE POLICY "Admins can manage cover_page_affiliate_assignments"
ON public.cover_page_affiliate_assignments
FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

-- RLS: Affiliates can read their own assignments
CREATE POLICY "Affiliates can read their assignments"
ON public.cover_page_affiliate_assignments
FOR SELECT
USING (affiliate_id IN (SELECT a.id FROM public.affiliates a WHERE a.email = auth.email()));