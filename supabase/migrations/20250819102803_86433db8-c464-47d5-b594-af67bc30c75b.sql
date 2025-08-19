-- Fix only the missing RLS policies and critical security issues

-- Fix abandoned_orders - only if policy doesn't exist
DO $$ BEGIN
    -- Check if policy exists first
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'abandoned_orders' 
        AND policyname = 'Admin users can manage abandoned orders'
    ) THEN
        CREATE POLICY "Admin users can manage abandoned orders" ON public.abandoned_orders
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = auth.email()
            )
        );
    END IF;
END $$;

-- Fix customers table - add missing policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Customers can view own data'
    ) THEN
        CREATE POLICY "Customers can view own data" ON public.customers
        FOR SELECT USING (email = auth.email());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Customers can update own data'
    ) THEN
        CREATE POLICY "Customers can update own data" ON public.customers  
        FOR UPDATE USING (email = auth.email())
        WITH CHECK (email = auth.email());
    END IF;
END $$;

-- Fix admin_users table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_users' 
        AND policyname = 'Admins can view admin users'
    ) THEN
        CREATE POLICY "Admins can view admin users" ON public.admin_users
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.admin_users au 
                WHERE au.email = auth.email()
            )
        );
    END IF;
END $$;

-- Add password hash column for admin authentication
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Fix function security issues by updating search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.update_processed_products_updated_at() SET search_path = 'public', 'pg_catalog';
ALTER FUNCTION public.ensure_single_default_cover_page() SET search_path = 'public', 'pg_catalog';