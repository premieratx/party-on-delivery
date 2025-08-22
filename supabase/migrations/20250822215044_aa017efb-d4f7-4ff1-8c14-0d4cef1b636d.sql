-- Fix function search path security issue by dropping trigger first
DROP TRIGGER IF EXISTS update_media_library_updated_at ON public.media_library;
DROP FUNCTION IF EXISTS public.update_media_library_updated_at();

-- Recreate function with proper search path
CREATE OR REPLACE FUNCTION public.update_media_library_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger  
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_library_updated_at();