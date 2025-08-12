-- Create cover_pages table for standalone cover pages with multi-CTA buttons
CREATE TABLE IF NOT EXISTS public.cover_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  logo_url TEXT,
  bg_image_url TEXT,
  bg_video_url TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on cover_pages
DROP TRIGGER IF EXISTS trg_cover_pages_updated_at ON public.cover_pages;
CREATE TRIGGER trg_cover_pages_updated_at
BEFORE UPDATE ON public.cover_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cover_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view active pages
DROP POLICY IF EXISTS "Cover pages are publicly viewable when active" ON public.cover_pages;
CREATE POLICY "Cover pages are publicly viewable when active"
ON public.cover_pages FOR SELECT
USING (is_active = true);

-- RLS: Admins can manage cover pages (based on admin_users table)
DROP POLICY IF EXISTS "Admins can manage cover pages" ON public.cover_pages;
CREATE POLICY "Admins can manage cover pages"
ON public.cover_pages FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));

-- Index to speed up slug lookups
CREATE INDEX IF NOT EXISTS idx_cover_pages_slug ON public.cover_pages (slug);

-- Validate buttons structure with a CHECK using jsonb_typeof where possible (lightweight)
-- Note: Keep it permissive to avoid blocking flexible configs.
