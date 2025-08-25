-- ABSOLUTE NUCLEAR OPTION: Maximum permissions without grant options
-- Grant all permissions on delivery_app_variations
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO public;
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO anon;
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO authenticated;
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO service_role;

-- Grant all permissions on cover_pages  
GRANT ALL PRIVILEGES ON public.cover_pages TO public;
GRANT ALL PRIVILEGES ON public.cover_pages TO anon;
GRANT ALL PRIVILEGES ON public.cover_pages TO authenticated;
GRANT ALL PRIVILEGES ON public.cover_pages TO service_role;

-- Grant permissions on entire public schema
GRANT USAGE ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Ensure table ownership is correct
ALTER TABLE public.delivery_app_variations OWNER TO postgres;
ALTER TABLE public.cover_pages OWNER TO postgres;

-- Make sure the authenticator role (which PostgREST uses) can switch to anon/authenticated
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;