-- SECURITY FIX: Address remaining function search_path issues
-- Fix the most critical functions that need search_path for security

-- Update the get_categories_with_counts function
CREATE OR REPLACE FUNCTION public.get_categories_with_counts()
RETURNS TABLE(category character varying, product_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.app_category as category,
    COUNT(DISTINCT spc.id)::BIGINT as product_count
  FROM category_mappings_simple cm
  LEFT JOIN shopify_products_cache spc ON (
    spc.data::text ILIKE '%' || cm.collection_handle || '%'
  )
  GROUP BY cm.app_category
  ORDER BY 
    CASE cm.app_category
      WHEN 'beer' THEN 1
      WHEN 'wine' THEN 2
      WHEN 'spirits' THEN 3
      WHEN 'mixers' THEN 4
      WHEN 'snacks' THEN 5
      ELSE 6
    END;
END;
$$;

-- Update the trigger_shopify_bulk_sync function
CREATE OR REPLACE FUNCTION public.trigger_shopify_bulk_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  sync_result jsonb;
BEGIN
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

-- Update the safe_cache_upsert_fixed function
CREATE OR REPLACE FUNCTION public.safe_cache_upsert_fixed(cache_key text, cache_data jsonb, expires_timestamp bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result_id UUID;
BEGIN
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

-- Update the get_checkout_config function
CREATE OR REPLACE FUNCTION public.get_checkout_config(config_type text DEFAULT 'checkout_flow_settings'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  config_data JSONB;
BEGIN
  SELECT config_value INTO config_data
  FROM checkout_flow_config
  WHERE config_key = config_type AND is_default = true
  LIMIT 1;
  
  RETURN COALESCE(config_data, '{}'::jsonb);
END;
$$;

-- Update the load_figma_template function
CREATE OR REPLACE FUNCTION public.load_figma_template(template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  template_data JSONB;
BEGIN
  SELECT design_data INTO template_data
  FROM figma_design_templates
  WHERE id = template_id AND is_active = true;
  
  IF template_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Template not found');
  END IF;
  
  RETURN template_data;
END;
$$;

-- Log completion of function security fixes
INSERT INTO security_audit_log (event_type, user_email, details)
VALUES (
  'function_security_fixes_complete',
  'system',
  jsonb_build_object(
    'functions_fixed', ARRAY[
      'get_categories_with_counts',
      'trigger_shopify_bulk_sync', 
      'safe_cache_upsert_fixed',
      'get_checkout_config',
      'load_figma_template'
    ],
    'timestamp', now()
  )
);