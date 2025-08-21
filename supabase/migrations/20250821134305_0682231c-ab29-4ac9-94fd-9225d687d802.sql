-- Add trigger for ensuring single default post-checkout page
CREATE OR REPLACE FUNCTION ensure_single_default_post_checkout()
RETURNS TRIGGER AS $$
BEGIN
  -- If this post-checkout page is being set as default, unset all others
  IF NEW.is_default = true THEN
    UPDATE public.post_checkout_pages 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_catalog';

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS ensure_single_default_post_checkout_trigger ON public.post_checkout_pages;
CREATE TRIGGER ensure_single_default_post_checkout_trigger
  BEFORE UPDATE OR INSERT ON public.post_checkout_pages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_post_checkout();