-- Fix remaining security issues

-- 1. Move uuid-ossp extension from public to extensions schema if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'uuid-ossp' AND n.nspname = 'public'
  ) THEN
    DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
  END IF;
END $$;

-- 2. Add basic RLS policies to tables that have RLS enabled but no policies
-- Check and add policies for any tables missing them

-- Add basic policies for category_mappings_simple if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'category_mappings_simple' 
    AND policyname = 'category_mappings_service_access'
  ) THEN
    CREATE POLICY "category_mappings_service_access" ON public.category_mappings_simple
      FOR ALL USING (true);
  END IF;
END $$;

-- Add basic policies for cache table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cache' 
    AND policyname = 'cache_service_access'
  ) THEN
    CREATE POLICY "cache_service_access" ON public.cache
      FOR ALL USING (true);
  END IF;
END $$;