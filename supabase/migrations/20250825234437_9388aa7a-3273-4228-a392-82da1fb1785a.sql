-- Grant explicit permissions to PostgreSQL roles for delivery_app_variations
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO anon;
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO authenticated;
GRANT ALL PRIVILEGES ON public.delivery_app_variations TO service_role;

-- Also grant permissions on cover_pages
GRANT ALL PRIVILEGES ON public.cover_pages TO anon;
GRANT ALL PRIVILEGES ON public.cover_pages TO authenticated;
GRANT ALL PRIVILEGES ON public.cover_pages TO service_role;

-- Grant usage on any sequences if they exist
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;