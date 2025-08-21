-- Fix final security warnings for remaining functions without search_path

-- Fix search_path for enhanced_security_audit function
CREATE OR REPLACE FUNCTION public.enhanced_security_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Log all sensitive table access
  PERFORM public.log_security_access(
    TG_OP || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    jsonb_build_object(
      'timestamp', now(),
      'user_email', auth.email(),
      'row_id', COALESCE(NEW.id, OLD.id)
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix search_path for update_product_search_vector function
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.product_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.collections, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.product_type, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.vendor, '')), 'D');
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;