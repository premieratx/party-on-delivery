-- Prevent homepage conflicts and ensure admin access stability
-- Add constraint to ensure only one homepage at a time
CREATE OR REPLACE FUNCTION prevent_homepage_conflicts()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this as homepage, unset all others first
  IF NEW.is_homepage = true THEN
    UPDATE delivery_app_variations 
    SET is_homepage = false 
    WHERE id != NEW.id AND is_homepage = true;
    
    -- Log this change for debugging
    INSERT INTO optimization_logs (task_id, log_level, message, details)
    VALUES ('homepage-change', 'info', 'Homepage changed', 
            jsonb_build_object(
              'new_homepage', NEW.app_name,
              'new_slug', NEW.app_slug,
              'timestamp', NOW()
            ));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent multiple homepages
DROP TRIGGER IF EXISTS ensure_single_homepage_enhanced ON delivery_app_variations;
CREATE TRIGGER ensure_single_homepage_enhanced
  BEFORE UPDATE ON delivery_app_variations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_homepage_conflicts();

-- Ensure Main Delivery App is set as homepage
UPDATE delivery_app_variations 
SET is_homepage = true 
WHERE app_slug = 'main-delivery-app' AND app_name = 'Main Delivery App';

-- Add cache warming function to prevent cold starts
CREATE OR REPLACE FUNCTION warm_system_cache()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Cache homepage delivery app
  SELECT row_to_json(dav.*) INTO result
  FROM delivery_app_variations dav
  WHERE is_homepage = true AND is_active = true
  LIMIT 1;
  
  -- Cache key product collections
  PERFORM * FROM shopify_products_cache 
  ORDER BY updated_at DESC 
  LIMIT 100;
  
  RETURN jsonb_build_object(
    'success', true,
    'homepage_app', result,
    'cache_warmed_at', NOW()
  );
END;
$$;