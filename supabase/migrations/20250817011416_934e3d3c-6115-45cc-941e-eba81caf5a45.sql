-- Create trigger to ensure single homepage
DROP TRIGGER IF EXISTS ensure_single_homepage_trigger ON delivery_app_variations;

CREATE OR REPLACE FUNCTION public.ensure_single_homepage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_homepage = true THEN
    UPDATE delivery_app_variations 
    SET is_homepage = false 
    WHERE id != NEW.id AND is_homepage = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_homepage_trigger
  BEFORE INSERT OR UPDATE ON delivery_app_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_homepage();

-- Create RPC function to trigger bulk sync
CREATE OR REPLACE FUNCTION public.trigger_shopify_bulk_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_result jsonb;
BEGIN
  -- Call the edge function
  SELECT extensions.http((
    'POST',
    'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-bulk-sync',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      extensions.http_header('Content-Type', 'application/json')
    ],
    '{"forceRefresh": true}'
  ))::jsonb INTO sync_result;
  
  RETURN sync_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;