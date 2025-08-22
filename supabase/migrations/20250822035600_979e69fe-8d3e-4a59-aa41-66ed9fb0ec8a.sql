-- Fix the cover page save functionality by ensuring individual updates work properly

-- First, check if there are any problematic triggers that update ALL records
DROP TRIGGER IF EXISTS ensure_single_default_cover_page_trigger ON public.cover_pages;

-- Recreate the trigger to be more precise and only update the updated_at when needed
CREATE OR REPLACE FUNCTION public.ensure_single_default_cover_page()
RETURNS TRIGGER AS $$
BEGIN
  -- If this cover page is being set as default, unset all others
  IF NEW.is_default_homepage = true AND (OLD.is_default_homepage IS NULL OR OLD.is_default_homepage = false) THEN
    UPDATE public.cover_pages 
    SET is_default_homepage = false 
    WHERE id != NEW.id AND is_default_homepage = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recreate the trigger with better conditions
CREATE TRIGGER ensure_single_default_cover_page_trigger
  BEFORE UPDATE ON public.cover_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_cover_page();

-- Test the save functionality by creating a test update
UPDATE public.cover_pages 
SET updated_at = now()
WHERE id = (SELECT id FROM public.cover_pages LIMIT 1);