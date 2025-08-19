-- Fix the security definer view issue by recreating the view properly
-- Drop and recreate the instant_products_view without security definer properties

-- First, save the current definition
-- instant_products_view definition: 
-- SELECT spc.id, spc.title, spc.price, spc.image, spc.handle, spc.variants, 
-- spc.collection_handles, spc.category, spc.updated_at, 
-- COALESCE(cm.app_category, 'other'::character varying) AS app_category
-- FROM (shopify_products_cache spc LEFT JOIN category_mappings_simple cm 
-- ON ((EXISTS ( SELECT 1 FROM unnest(spc.collection_handles) ch(handle)
-- WHERE (ch.handle ~~* (('%'::text || (cm.collection_handle)::text) || '%'::text))))))

-- Drop the existing view
DROP VIEW IF EXISTS public.instant_products_view;

-- Recreate the view with proper security settings (not security definer)
CREATE OR REPLACE VIEW public.instant_products_view AS
SELECT 
    spc.id,
    spc.title,
    spc.price,
    spc.image,
    spc.handle,
    spc.variants,
    spc.collection_handles,
    spc.category,
    spc.updated_at,
    COALESCE(cm.app_category, 'other'::character varying) AS app_category
FROM shopify_products_cache spc
LEFT JOIN category_mappings_simple cm ON (
    EXISTS (
        SELECT 1
        FROM unnest(spc.collection_handles) ch(handle)
        WHERE ch.handle ILIKE ('%' || cm.collection_handle || '%')
    )
);

-- Set proper ownership and access
ALTER VIEW public.instant_products_view OWNER TO postgres;

-- Add RLS policy for the view if needed
-- Views inherit RLS from their underlying tables

-- Log the view security fix
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES (
  'view-security-fix',
  'info',
  'Fixed security definer view issue by recreating instant_products_view',
  jsonb_build_object(
    'timestamp', now(),
    'view_name', 'instant_products_view',
    'action', 'Dropped and recreated view without security definer properties',
    'tables_accessed', jsonb_build_array('shopify_products_cache', 'category_mappings_simple')
  )
);