-- Create required function for updated_at if missing
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cover_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
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

-- Ensure unique slug for routing
CREATE UNIQUE INDEX IF NOT EXISTS cover_pages_slug_key ON public.cover_pages (slug);

-- Enable RLS
ALTER TABLE public.cover_pages ENABLE ROW LEVEL SECURITY;

-- Drop and recreate trigger for updated_at
DROP TRIGGER IF EXISTS update_cover_pages_updated_at ON public.cover_pages;
CREATE TRIGGER update_cover_pages_updated_at
BEFORE UPDATE ON public.cover_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policy: Admins can manage cover pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cover_pages' AND policyname = 'Admins can manage cover pages'
  ) THEN
    CREATE POLICY "Admins can manage cover pages"
    ON public.cover_pages
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email()));
  END IF;
END $$;

-- Policy: Cover pages are publicly viewable when active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cover_pages' AND policyname = 'Cover pages are publicly viewable when active'
  ) THEN
    CREATE POLICY "Cover pages are publicly viewable when active"
    ON public.cover_pages
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;
