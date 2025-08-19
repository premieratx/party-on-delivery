-- Create integration health monitoring table
CREATE TABLE IF NOT EXISTS public.integration_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'critical')),
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying of recent health checks
CREATE INDEX IF NOT EXISTS idx_integration_health_logs_checked_at 
ON public.integration_health_logs (checked_at DESC);

-- Enable RLS
ALTER TABLE public.integration_health_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view health logs
CREATE POLICY "Admins can view integration health logs" 
ON public.integration_health_logs 
FOR SELECT 
USING (is_admin_user_safe());

-- Allow system to insert health logs
CREATE POLICY "System can insert health logs" 
ON public.integration_health_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to cleanup old health logs (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_integration_health_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  DELETE FROM public.integration_health_logs 
  WHERE checked_at < now() - INTERVAL '30 days';
END;
$function$;