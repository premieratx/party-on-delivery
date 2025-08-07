-- Fix checkout routing to prevent 404 errors
-- This ensures proper post-checkout URL generation and redirection

CREATE OR REPLACE FUNCTION public.get_post_checkout_url(app_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  app_config RECORD;
BEGIN
  -- Get app configuration
  SELECT * INTO app_config
  FROM delivery_app_variations
  WHERE app_slug = app_name OR app_name = app_name
  LIMIT 1;
  
  -- Default to standard post-checkout if app not found
  IF app_config IS NULL THEN
    RETURN '/order-complete';
  END IF;
  
  -- Return app-specific post-checkout URL
  RETURN '/post-checkout/' || app_config.app_slug;
END;
$$;