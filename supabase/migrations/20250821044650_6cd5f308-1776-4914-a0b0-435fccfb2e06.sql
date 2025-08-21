-- Create comprehensive system audit log table
CREATE TABLE IF NOT EXISTS public.system_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_email TEXT,
  session_id TEXT,
  request_data JSONB DEFAULT '{}'::jsonb,
  response_data JSONB DEFAULT '{}'::jsonb,
  error_details JSONB DEFAULT NULL,
  execution_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical'))
);

-- Enable RLS
ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "system_audit_admin_only" ON public.system_audit_log
FOR ALL USING (is_admin_user_safe());

CREATE POLICY "system_audit_service_access" ON public.system_audit_log
FOR ALL USING (auth.role() = 'service_role');

-- Create index for performance
CREATE INDEX idx_system_audit_created_at ON public.system_audit_log(created_at DESC);
CREATE INDEX idx_system_audit_event_type ON public.system_audit_log(event_type);
CREATE INDEX idx_system_audit_service ON public.system_audit_log(service_name);
CREATE INDEX idx_system_audit_severity ON public.system_audit_log(severity);

-- Create function to log system events
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_event_type TEXT,
  p_service_name TEXT, 
  p_operation TEXT,
  p_user_email TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_request_data JSONB DEFAULT '{}'::jsonb,
  p_response_data JSONB DEFAULT '{}'::jsonb,
  p_error_details JSONB DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.system_audit_log (
    event_type,
    service_name,
    operation,
    user_email,
    session_id,
    request_data,
    response_data,
    error_details,
    execution_time_ms,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    p_event_type,
    p_service_name,
    p_operation,
    p_user_email,
    p_session_id,
    p_request_data,
    p_response_data,
    p_error_details,
    p_execution_time_ms,
    p_ip_address,
    p_user_agent,
    p_severity
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

-- Create data integrity monitoring table
CREATE TABLE IF NOT EXISTS public.data_integrity_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL,
  table_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed')),
  expected_result JSONB,
  actual_result JSONB,
  discrepancy_details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.data_integrity_checks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "data_integrity_admin_only" ON public.data_integrity_checks
FOR ALL USING (is_admin_user_safe());

CREATE POLICY "data_integrity_service_access" ON public.data_integrity_checks
FOR ALL USING (auth.role() = 'service_role');

-- Create backup metadata table
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL,
  backup_name TEXT NOT NULL,
  tables_included TEXT[] NOT NULL DEFAULT '{}',
  backup_size_bytes BIGINT,
  checksum TEXT,
  backup_location TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "system_backups_admin_only" ON public.system_backups
FOR ALL USING (is_admin_user_safe());

CREATE POLICY "system_backups_service_access" ON public.system_backups
FOR ALL USING (auth.role() = 'service_role');