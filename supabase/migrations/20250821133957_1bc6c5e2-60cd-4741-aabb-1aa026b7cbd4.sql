-- Check if trigger exists for ensuring single default cover page
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%default%cover%' OR trigger_name LIKE '%cover%default%';

-- If trigger doesn't exist, let's create it to ensure only one default cover page
CREATE OR REPLACE FUNCTION ensure_single_default_cover_page()
RETURNS TRIGGER AS $$
BEGIN
  -- If this cover page is being set as default, unset all others
  IF NEW.is_default_homepage = true THEN
    UPDATE public.cover_pages 
    SET is_default_homepage = false 
    WHERE id != NEW.id AND is_default_homepage = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS ensure_single_default_cover_page_trigger ON public.cover_pages;
CREATE TRIGGER ensure_single_default_cover_page_trigger
  BEFORE UPDATE OR INSERT ON public.cover_pages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_cover_page();