-- Create a table to store reusable automation templates
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  automation_config JSONB NOT NULL DEFAULT '{}',
  tasks_config JSONB NOT NULL DEFAULT '[]',
  execution_settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  version TEXT DEFAULT '1.0'
);

-- Enable RLS
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Automation templates are publicly readable" 
ON automation_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "System can manage automation templates" 
ON automation_templates 
FOR ALL 
USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_automation_templates_active ON automation_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_templates_name ON automation_templates(template_name);

-- Insert the complete autonomous optimization template
INSERT INTO automation_templates (
  template_name,
  description,
  automation_config,
  tasks_config,
  execution_settings,
  created_by
) VALUES (
  'Complete App Launch Automation',
  'Fully autonomous app optimization and launch automation with self-healing capabilities',
  '{
    "autonomous_mode": true,
    "self_healing": true,
    "parallel_execution": true,
    "user_interaction_required": false,
    "auto_retry_failed_tasks": true,
    "health_check_interval": 900,
    "retry_interval": 1800,
    "max_retry_attempts": 3,
    "phases": [
      "Setup & Configuration",
      "Automated Testing", 
      "Performance & UX Optimization",
      "Production Deployment",
      "Live Monitoring & Support",
      "Mobile & App Store"
    ],
    "monitoring": {
      "progress_updates_interval": 7200,
      "health_checks": true,
      "automatic_restarts": true,
      "error_recovery": true
    }
  }',
  '[
    {
      "task_id": "web-vitals-optimization",
      "automation_function": "optimize_web_vitals",
      "autonomous": true,
      "retry_on_failure": true
    },
    {
      "task_id": "checkout-process-validation", 
      "automation_function": "validate_checkout_process",
      "autonomous": true,
      "retry_on_failure": true
    },
    {
      "task_id": "party-planner-testing",
      "automation_function": "test_party_planner", 
      "autonomous": true,
      "retry_on_failure": true
    },
    {
      "task_id": "database-connections-test",
      "automation_function": "test_database_connections",
      "autonomous": true, 
      "retry_on_failure": true
    },
    {
      "task_id": "third-party-script-optimization",
      "automation_function": "optimize_third_party_scripts",
      "autonomous": true,
      "retry_on_failure": true
    },
    {
      "task_id": "user-feedback-integration",
      "automation_function": "integrate_user_feedback", 
      "autonomous": true,
      "retry_on_failure": true
    }
  ]',
  '{
    "execution_mode": "fully_autonomous",
    "require_user_approval": false,
    "continue_on_errors": true,
    "parallel_task_limit": 3,
    "task_timeout_minutes": 30,
    "session_timeout_hours": 24,
    "enable_background_execution": true,
    "priority_handling": "high_first",
    "error_handling": "auto_fix_and_continue"
  }',
  'system'
);

-- Create function to load and execute automation template
CREATE OR REPLACE FUNCTION execute_automation_template(template_name_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_record RECORD;
  result JSONB;
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM automation_templates 
  WHERE template_name = template_name_param 
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template not found: ' || template_name_param
    );
  END IF;
  
  -- Log template execution
  INSERT INTO optimization_logs (
    task_id,
    log_level,
    message,
    details
  ) VALUES (
    'template-execution',
    'info',
    'Executing automation template: ' || template_name_param,
    jsonb_build_object(
      'template_id', template_record.id,
      'config', template_record.automation_config
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'template_id', template_record.id,
    'message', 'Template loaded successfully',
    'config', template_record.automation_config,
    'tasks', template_record.tasks_config,
    'settings', template_record.execution_settings
  );
END;
$$;