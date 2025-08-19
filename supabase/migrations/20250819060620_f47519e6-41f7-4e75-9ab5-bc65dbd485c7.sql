-- Fix remaining security errors
-- Add missing RLS policies for tables without policies

-- Add policy for affiliate_app_links view (if it's a table)
ALTER TABLE public.affiliate_app_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can view affiliate app links" 
ON public.affiliate_app_links 
FOR SELECT 
USING (true);

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(company_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base code from company name (first 6 chars, uppercase, alphanumeric only)
  base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  -- If base_code is empty or too short, use random string
  IF LENGTH(base_code) < 3 THEN
    base_code := 'AFF' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  
  final_code := base_code;
  
  -- Check if code exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    final_code := base_code || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_affiliate_handle(company_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 1;
BEGIN
  -- Create base handle from company name (lowercase, replace spaces/special chars with hyphens)
  base_handle := lower(trim(company_name));
  base_handle := regexp_replace(base_handle, '[^a-z0-9]+', '-', 'g');
  base_handle := regexp_replace(base_handle, '^-+|-+$', '', 'g');
  base_handle := substring(base_handle from 1 for 20);
  
  -- If base_handle is empty or too short, use random string
  IF length(base_handle) < 3 THEN
    base_handle := 'affiliate-' || floor(random() * 1000)::text;
  END IF;
  
  final_handle := base_handle;
  
  -- Check if handle exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE custom_handle = final_handle) LOOP
    final_handle := base_handle || '-' || counter::text;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_handle;
END;
$function$;