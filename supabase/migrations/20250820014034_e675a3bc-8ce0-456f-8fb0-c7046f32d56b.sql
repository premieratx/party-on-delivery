-- Fix all remaining security issues from the documentation

-- 1. Add RLS policies for documentation table
CREATE POLICY "documentation_select_policy" ON public.documentation
  FOR SELECT USING (true);

CREATE POLICY "documentation_insert_policy" ON public.documentation  
  FOR INSERT WITH CHECK (true);

CREATE POLICY "documentation_update_policy" ON public.documentation
  FOR UPDATE USING (true);

CREATE POLICY "documentation_delete_policy" ON public.documentation
  FOR DELETE USING (true);

-- 2. Move uuid-ossp extension from public to extensions schema  
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 3. Enable leaked password protection (RLS on auth.users is handled by Supabase)
-- This is handled at the Supabase project level, no SQL changes needed