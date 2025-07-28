-- Create automation templates table
CREATE TABLE public.automation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'full_automation',
  description TEXT,
  configuration JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Automation templates are publicly readable"
ON public.automation_templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "System can manage automation templates"
ON public.automation_templates
FOR ALL
USING (true);

-- Insert the Complete App Launch Automation template
INSERT INTO public.automation_templates (
  template_name,
  template_type,
  description,
  configuration
) VALUES (
  'Complete App Launch Automation',
  'full_automation',
  'Fully autonomous app optimization with self-healing capabilities, no user interaction required',
  '{
    "autonomous_mode": true,
    "parallel_execution": true,
    "auto_retry_failed": true,
    "health_check_interval": 15,
    "retry_interval": 30,
    "phases": [
      {
        "name": "Setup & Configuration",
        "tasks": [
          {"id": "setup-1", "title": "Auto-Started Complete App Launch Automation", "autonomous": true},
          {"id": "setup-2", "title": "Configure Development Environment", "autonomous": true},
          {"id": "setup-3", "title": "Setup Git Repository and Version Control", "autonomous": true},
          {"id": "setup-4", "title": "Initialize Project Documentation", "autonomous": true}
        ]
      },
      {
        "name": "Automated Testing",
        "tasks": [
          {"id": "test-1", "title": "Setup Automated Testing Framework", "autonomous": true},
          {"id": "test-2", "title": "Create Unit Tests for Core Components", "autonomous": true},
          {"id": "test-3", "title": "Implement Integration Tests", "autonomous": true},
          {"id": "test-4", "title": "Setup End-to-End Testing", "autonomous": true},
          {"id": "test-5", "title": "Configure Continuous Integration", "autonomous": true}
        ]
      },
      {
        "name": "Performance & UX Optimization",
        "tasks": [
          {"id": "perf-1", "title": "Optimize Bundle Size and Loading Times", "autonomous": true},
          {"id": "perf-2", "title": "Implement Code Splitting and Lazy Loading", "autonomous": true},
          {"id": "perf-3", "title": "Add Progressive Web App Features", "autonomous": true},
          {"id": "perf-4", "title": "Optimize Images and Assets", "autonomous": true},
          {"id": "perf-5", "title": "Implement Caching Strategies", "autonomous": true},
          {"id": "perf-6", "title": "Add Loading States and Error Boundaries", "autonomous": true},
          {"id": "perf-7", "title": "Optimize Database Queries", "autonomous": true},
          {"id": "perf-8", "title": "Implement Search and Filtering", "autonomous": true}
        ]
      },
      {
        "name": "Production Deployment",
        "tasks": [
          {"id": "deploy-1", "title": "Configure Production Environment", "autonomous": true},
          {"id": "deploy-2", "title": "Setup SSL and Security Headers", "autonomous": true},
          {"id": "deploy-3", "title": "Configure CDN and Global Distribution", "autonomous": true},
          {"id": "deploy-4", "title": "Setup Monitoring and Analytics", "autonomous": true},
          {"id": "deploy-5", "title": "Configure Backup and Recovery", "autonomous": true}
        ]
      },
      {
        "name": "Live Monitoring & Support",
        "tasks": [
          {"id": "monitor-1", "title": "Setup Real-time Error Monitoring", "autonomous": true},
          {"id": "monitor-2", "title": "Configure Performance Monitoring", "autonomous": true},
          {"id": "monitor-3", "title": "Setup User Analytics and Tracking", "autonomous": true},
          {"id": "monitor-4", "title": "Implement Health Checks and Alerts", "autonomous": true},
          {"id": "monitor-5", "title": "Setup Customer Support Integration", "autonomous": true}
        ]
      },
      {
        "name": "Mobile & App Store",
        "tasks": [
          {"id": "mobile-1", "title": "Optimize for Mobile Devices", "autonomous": true},
          {"id": "mobile-2", "title": "Configure Push Notifications", "autonomous": true},
          {"id": "mobile-3", "title": "Setup App Store Deployment", "autonomous": true},
          {"id": "mobile-4", "title": "Implement Offline Support", "autonomous": true},
          {"id": "mobile-5", "title": "Configure Deep Linking", "autonomous": true},
          {"id": "mobile-6", "title": "Setup App Analytics", "autonomous": true}
        ]
      }
    ]
  }'::jsonb
);

-- Create function to execute automation templates
CREATE OR REPLACE FUNCTION public.execute_automation_template(template_name_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  template_config JSONB;
  master_session_id UUID;
  phase_config JSONB;
  phase_name TEXT;
  total_tasks INTEGER := 0;
  total_phases INTEGER := 0;
BEGIN
  -- Get template configuration
  SELECT configuration INTO template_config
  FROM public.automation_templates
  WHERE template_name = template_name_input AND is_active = true
  LIMIT 1;
  
  IF template_config IS NULL THEN
    RETURN jsonb_build_object('error', 'Template not found');
  END IF;
  
  -- Count total tasks and phases
  FOR phase_config IN SELECT jsonb_array_elements(template_config->'phases')
  LOOP
    total_phases := total_phases + 1;
    total_tasks := total_tasks + jsonb_array_length(phase_config->'tasks');
  END LOOP;
  
  -- Create master automation session
  INSERT INTO public.master_automation_sessions (
    session_name,
    total_phases,
    autonomous_mode,
    parallel_execution_enabled,
    phases_included
  ) VALUES (
    template_name_input,
    total_phases,
    (template_config->>'autonomous_mode')::boolean,
    (template_config->>'parallel_execution')::boolean,
    ARRAY(SELECT jsonb_array_elements_text(jsonb_path_query_array(template_config, '$.phases[*].name')))
  ) RETURNING id INTO master_session_id;
  
  -- Create individual automation sessions for each phase
  FOR phase_config IN SELECT jsonb_array_elements(template_config->'phases')
  LOOP
    phase_name := phase_config->>'name';
    
    INSERT INTO public.automation_sessions (
      session_name,
      total_tasks,
      status
    ) VALUES (
      phase_name || ' - ' || template_name_input,
      jsonb_array_length(phase_config->'tasks'),
      'pending'
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'master_session_id', master_session_id,
    'total_phases', total_phases,
    'total_tasks', total_tasks,
    'autonomous_mode', template_config->>'autonomous_mode'
  );
END;
$$;