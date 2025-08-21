-- Create comprehensive system logging and monitoring tables
CREATE TABLE IF NOT EXISTS public.ai_work_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL, -- 'file_created', 'file_edited', 'file_deleted', 'component_tested', 'error_fixed', 'optimization'
  file_path TEXT,
  component_name TEXT,
  description TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  success BOOLEAN DEFAULT true,
  error_details JSONB,
  user_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_work_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "System can manage work logs" 
ON public.ai_work_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create component health monitoring table
CREATE TABLE IF NOT EXISTS public.component_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'warning', 'error', 'deprecated'
  issues JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  is_legacy BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.component_health_checks ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "System can manage health checks" 
ON public.component_health_checks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create optimization tracking table
CREATE TABLE IF NOT EXISTS public.optimization_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimization_type TEXT NOT NULL, -- 'mobile_checkout', 'delivery_app_scroll', 'creator_performance', 'legacy_cleanup'
  target_component TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  priority INTEGER DEFAULT 5, -- 1-10, 10 being highest
  description TEXT NOT NULL,
  implementation_notes JSONB DEFAULT '{}'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.optimization_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "System can manage optimization tracking" 
ON public.optimization_tracking 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to log AI work
CREATE OR REPLACE FUNCTION public.log_ai_work(
  p_session_id TEXT,
  p_action_type TEXT,
  p_file_path TEXT DEFAULT NULL,
  p_component_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.ai_work_logs (
    session_id,
    action_type,
    file_path,
    component_name,
    description,
    before_state,
    after_state,
    success,
    error_details
  ) VALUES (
    p_session_id,
    p_action_type,
    p_file_path,
    p_component_name,
    p_description,
    p_before_state,
    p_after_state,
    p_success,
    p_error_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to update component health
CREATE OR REPLACE FUNCTION public.update_component_health(
  p_component_name TEXT,
  p_file_path TEXT,
  p_status TEXT DEFAULT 'healthy',
  p_issues JSONB DEFAULT '[]'::jsonb,
  p_dependencies JSONB DEFAULT '[]'::jsonb,
  p_is_legacy BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  health_id UUID;
BEGIN
  INSERT INTO public.component_health_checks (
    component_name,
    file_path,
    status,
    issues,
    dependencies,
    is_legacy,
    updated_at
  ) VALUES (
    p_component_name,
    p_file_path,
    p_status,
    p_issues,
    p_dependencies,
    p_is_legacy,
    now()
  )
  ON CONFLICT (component_name, file_path) 
  DO UPDATE SET
    status = EXCLUDED.status,
    issues = EXCLUDED.issues,
    dependencies = EXCLUDED.dependencies,
    is_legacy = EXCLUDED.is_legacy,
    updated_at = now()
  RETURNING id INTO health_id;
  
  RETURN health_id;
END;
$$;