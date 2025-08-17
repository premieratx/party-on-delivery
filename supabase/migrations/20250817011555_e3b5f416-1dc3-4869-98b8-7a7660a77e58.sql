-- Fix the RPC function to properly call the edge function
CREATE OR REPLACE FUNCTION public.trigger_shopify_bulk_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sync_result jsonb;
BEGIN
  -- Use the http extension directly
  SELECT content::jsonb INTO sync_result
  FROM http((
    'POST',
    'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/shopify-bulk-sync',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      http_header('Content-Type', 'application/json')
    ],
    '{"forceRefresh": true}'
  ));
  
  RETURN COALESCE(sync_result, jsonb_build_object('success', true, 'message', 'Sync triggered'));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Also fix the search path for ensure_single_homepage function
CREATE OR REPLACE FUNCTION public.ensure_single_homepage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
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