-- Simple fix for delivery_app_variations access
-- Grant basic read access for everyone

GRANT SELECT ON public.delivery_app_variations TO anon;
GRANT SELECT ON public.delivery_app_variations TO authenticated;

-- Drop problematic policies and create a simple one
DO $$ 
BEGIN
    -- Drop existing policies safely
    DROP POLICY IF EXISTS "basic_read_active_apps" ON public.delivery_app_variations;
    DROP POLICY IF EXISTS "public_read_delivery_apps" ON public.delivery_app_variations;
    
    -- Create simple public read policy
    CREATE POLICY "allow_read_delivery_apps" 
    ON public.delivery_app_variations 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN OTHERS THEN
    -- Continue if policies don't exist
    NULL;
END $$;