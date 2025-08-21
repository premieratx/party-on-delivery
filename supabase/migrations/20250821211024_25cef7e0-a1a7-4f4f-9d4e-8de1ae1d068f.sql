-- Create warmup log table to track system warmup operations
CREATE TABLE public.warmup_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  products_count INTEGER DEFAULT 0,
  collections_count INTEGER DEFAULT 0,
  sync_triggered BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_warmup_log_created_at ON public.warmup_log(created_at DESC);
CREATE INDEX idx_warmup_log_type ON public.warmup_log(type);

-- Enable RLS
ALTER TABLE public.warmup_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to read/write (for edge functions)
CREATE POLICY "Service role can manage warmup logs" ON public.warmup_log
FOR ALL USING (true);

-- Policy: Admins can view warmup logs
CREATE POLICY "Admins can view warmup logs" ON public.warmup_log
FOR SELECT USING (true);