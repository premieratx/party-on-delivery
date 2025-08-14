-- Create table for link validation logs
CREATE TABLE IF NOT EXISTS public.link_validation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  validation_run_id UUID NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_tested INTEGER NOT NULL DEFAULT 0,
  total_valid INTEGER NOT NULL DEFAULT 0,
  total_invalid INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.link_validation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view validation logs" 
ON public.link_validation_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "System can insert validation logs" 
ON public.link_validation_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_link_validation_logs_created_at 
ON public.link_validation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_link_validation_logs_run_id 
ON public.link_validation_logs(validation_run_id);