-- Add is_default_homepage column to cover_pages table
ALTER TABLE public.cover_pages 
ADD COLUMN is_default_homepage boolean DEFAULT false;

-- Add constraint to ensure only one cover page can be the default homepage
CREATE UNIQUE INDEX CONCURRENTLY cover_pages_unique_default_homepage 
ON public.cover_pages (is_default_homepage) 
WHERE is_default_homepage = true;