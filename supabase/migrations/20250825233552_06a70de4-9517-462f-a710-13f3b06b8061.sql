-- Fix delivery app saving permissions completely
-- First, ensure RLS is enabled
ALTER TABLE public.delivery_app_variations ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'delivery_app_variations' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.delivery_app_variations';
    END LOOP;
END $$;

-- Create a single, comprehensive policy that allows everything
CREATE POLICY "delivery_apps_full_access" 
ON public.delivery_app_variations 
FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Also ensure cover_pages has the same unrestricted access
ALTER TABLE public.cover_pages ENABLE ROW LEVEL SECURITY;

-- Drop all cover_pages policies  
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'cover_pages' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.cover_pages';
    END LOOP;
END $$;

-- Create unrestricted policy for cover_pages
CREATE POLICY "cover_pages_full_access" 
ON public.cover_pages 
FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);