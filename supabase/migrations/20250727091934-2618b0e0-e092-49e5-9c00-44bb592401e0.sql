-- Create tables for the enhanced Telegram bot AI coordinator

-- Table for storing Telegram users
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for AI coordinator interactions and learning
CREATE TABLE IF NOT EXISTS public.ai_coordinator_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent_detected TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for launch phases and progress tracking
CREATE TABLE IF NOT EXISTS public.launch_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  chat_id BIGINT,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for autonomous execution logs
CREATE TABLE IF NOT EXISTS public.autonomous_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  phase TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed', 'retrying')),
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for AI testing sessions (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.ai_testing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  test_type TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'running', 'completed', 'failed', 'paused')),
  app_url TEXT,
  chat_id BIGINT,
  flows_tested JSONB DEFAULT '[]'::jsonb,
  current_flow TEXT,
  tests_passed INTEGER DEFAULT 0,
  tests_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for AI testing issues (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.ai_testing_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.ai_testing_sessions(id),
  flow TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  test_url TEXT,
  screenshot_url TEXT,
  fix_suggested TEXT,
  fix_applied BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coordinator_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_testing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_testing_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an internal tool)
CREATE POLICY "Allow all operations on telegram_users" ON public.telegram_users FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_coordinator_logs" ON public.ai_coordinator_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on launch_phases" ON public.launch_phases FOR ALL USING (true);
CREATE POLICY "Allow all operations on autonomous_execution_logs" ON public.autonomous_execution_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_testing_sessions" ON public.ai_testing_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_testing_issues" ON public.ai_testing_issues FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON public.telegram_users(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_coordinator_logs_chat_id ON public.ai_coordinator_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_launch_phases_status ON public.launch_phases(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_execution_logs_chat_id ON public.autonomous_execution_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_testing_sessions_status ON public.ai_testing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_testing_issues_severity ON public.ai_testing_issues(severity);

-- Insert initial launch phases
INSERT INTO public.launch_phases (phase_name, description, tasks) VALUES
('Setup & Configuration', 'Initialize bot infrastructure, webhooks, and core integrations', '[
  "Configure Telegram webhook",
  "Set up database connections", 
  "Initialize monitoring systems",
  "Test core functionalities"
]'::jsonb),
('Automated Testing', 'Deploy comprehensive testing protocols across all app flows', '[
  "Homepage functionality tests",
  "Delivery widget testing",
  "Party planner flow testing", 
  "Checkout process validation",
  "Admin dashboard verification"
]'::jsonb),
('Performance & UX Optimization', 'Optimize app performance and user experience', '[
  "Page load speed optimization",
  "Mobile responsiveness testing",
  "User interaction flow improvements",
  "Performance monitoring setup"
]'::jsonb),
('Production Deployment', 'Deploy app to production environment with monitoring', '[
  "Production environment setup",
  "SSL certificate configuration",
  "CDN optimization",
  "Production monitoring activation"
]'::jsonb),
('Live Monitoring & Support', 'Continuous monitoring and proactive issue resolution', '[
  "24/7 automated monitoring",
  "Real-time issue detection",
  "Proactive maintenance",
  "User feedback integration"
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_telegram_users_updated_at
  BEFORE UPDATE ON public.telegram_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_launch_phases_updated_at
  BEFORE UPDATE ON public.launch_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autonomous_execution_logs_updated_at
  BEFORE UPDATE ON public.autonomous_execution_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_testing_sessions_updated_at
  BEFORE UPDATE ON public.ai_testing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_testing_issues_updated_at
  BEFORE UPDATE ON public.ai_testing_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();