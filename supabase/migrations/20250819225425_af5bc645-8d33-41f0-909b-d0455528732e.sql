-- Fix duplicate cache key constraint by using UPSERT properly
DROP INDEX IF EXISTS idx_cache_key_unique;
ALTER TABLE public.cache DROP CONSTRAINT IF EXISTS cache_key_key;

-- Add unique constraint back with proper handling
CREATE UNIQUE INDEX IF NOT EXISTS idx_cache_key_unique ON public.cache (key);

-- Create default cover page system
CREATE TABLE IF NOT EXISTS public.homepage_cover_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  cover_page_id UUID REFERENCES public.cover_pages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on homepage cover config
ALTER TABLE public.homepage_cover_config ENABLE ROW LEVEL SECURITY;

-- Create policies for homepage cover config
CREATE POLICY "homepage_cover_admin_manage" ON public.homepage_cover_config
FOR ALL USING (is_admin_user_safe()) WITH CHECK (is_admin_user_safe());

CREATE POLICY "homepage_cover_public_read" ON public.homepage_cover_config
FOR SELECT USING (is_active = true);

-- Add function to ensure single active homepage cover
CREATE OR REPLACE FUNCTION public.ensure_single_homepage_cover()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.homepage_cover_config 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Create trigger for single homepage cover
DROP TRIGGER IF EXISTS ensure_single_homepage_cover_trigger ON public.homepage_cover_config;
CREATE TRIGGER ensure_single_homepage_cover_trigger
  BEFORE INSERT OR UPDATE ON public.homepage_cover_config
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_homepage_cover();

-- Update cache function to handle duplicates properly
CREATE OR REPLACE FUNCTION public.safe_cache_upsert_fixed(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Use proper upsert with ON CONFLICT to prevent duplicates
  INSERT INTO public.cache (key, data, expires_at)
  VALUES (cache_key, cache_data, expires_timestamp)
  ON CONFLICT (key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;