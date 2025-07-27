-- Create tables for AI Testing Agent system

-- Testing sessions table
CREATE TABLE IF NOT EXISTS public.testing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
  current_flow TEXT,
  app_url TEXT,
  chat_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Testing issues table
CREATE TABLE IF NOT EXISTS public.testing_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.testing_sessions(id) ON DELETE CASCADE,
  flow TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ui', 'functionality', 'performance', 'accessibility')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT NOT NULL,
  location TEXT,
  suggested_fix TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'ignored')),
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI fix requests table
CREATE TABLE IF NOT EXISTS public.ai_fix_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow TEXT NOT NULL,
  issues TEXT NOT NULL, -- JSON string
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  generated_fix TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Telegram users table
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System health metrics table
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  active_sessions INTEGER DEFAULT 0,
  issues_24h INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  average_load_time DECIMAL,
  error_rate DECIMAL,
  active_users INTEGER,
  api_response_time DECIMAL
);

-- Enable Row Level Security
ALTER TABLE public.testing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_fix_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for testing sessions (allow all for now since this is for AI agent)
CREATE POLICY "Allow all access to testing_sessions" ON public.testing_sessions FOR ALL USING (true);
CREATE POLICY "Allow all access to testing_issues" ON public.testing_issues FOR ALL USING (true);
CREATE POLICY "Allow all access to ai_fix_requests" ON public.ai_fix_requests FOR ALL USING (true);
CREATE POLICY "Allow all access to telegram_users" ON public.telegram_users FOR ALL USING (true);
CREATE POLICY "Allow all access to system_health" ON public.system_health FOR ALL USING (true);
CREATE POLICY "Allow all access to performance_metrics" ON public.performance_metrics FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_testing_sessions_status ON public.testing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_testing_issues_session_id ON public.testing_issues(session_id);
CREATE INDEX IF NOT EXISTS idx_testing_issues_severity ON public.testing_issues(severity);
CREATE INDEX IF NOT EXISTS idx_testing_issues_created_at ON public.testing_issues(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_fix_requests_status ON public.ai_fix_requests(status);
CREATE INDEX IF NOT EXISTS idx_ai_fix_requests_priority ON public.ai_fix_requests(priority);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON public.telegram_users(chat_id);
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON public.system_health(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for testing_sessions
CREATE TRIGGER update_testing_sessions_updated_at
  BEFORE UPDATE ON public.testing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();