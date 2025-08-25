-- NUCLEAR OPTION: Grant ALL permissions to EVERYONE on EVERYTHING
-- Grant all permissions on delivery_app_variations to public role
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO public;
GRANT ALL PRIVILEGES ON public.cover_pages TO public;

-- Grant all permissions on the entire public schema to all roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO public;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant all sequence permissions
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO public;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant all function permissions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO public;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Also ensure the table definitely exists and can be accessed
ALTER TABLE public.delivery_app_variations OWNER TO postgres;
ALTER TABLE public.cover_pages OWNER TO postgres;

-- Make sure there are no hidden restrictions
REVOKE ALL ON public.delivery_app_variations FROM public;
GRANT ALL ON public.delivery_app_variations TO public WITH GRANT OPTION;

REVOKE ALL ON public.cover_pages FROM public;
GRANT ALL ON public.cover_pages TO public WITH GRANT OPTION;