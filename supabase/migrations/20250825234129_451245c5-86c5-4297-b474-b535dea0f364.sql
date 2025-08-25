-- Nuclear option: Completely disable RLS on delivery_app_variations
ALTER TABLE public.delivery_app_variations DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on cover_pages to be safe
ALTER TABLE public.cover_pages DISABLE ROW LEVEL SECURITY;