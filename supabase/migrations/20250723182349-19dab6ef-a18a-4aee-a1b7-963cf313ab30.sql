-- Create cache table for 30-day data persistence
CREATE TABLE IF NOT EXISTS public.cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient key lookups
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(key);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);

-- Enable Row Level Security (but allow public access for caching)
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;

-- Create policies for cache access
CREATE POLICY "Allow public read access" ON public.cache FOR SELECT USING (true);
CREATE POLICY "Allow service role insert/update" ON public.cache FOR ALL USING (true);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
END;
$$;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_cache_updated_at
  BEFORE UPDATE ON public.cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();