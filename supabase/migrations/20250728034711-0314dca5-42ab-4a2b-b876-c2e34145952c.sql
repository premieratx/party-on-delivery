-- Create optimization tracking tables

-- Optimization tasks table
CREATE TABLE public.optimization_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bundle', 'images', 'components', 'mobile', 'caching', 'database')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'failed', 'blocked')),
  estimated_time TEXT NOT NULL,
  actual_time_minutes INTEGER,
  automation_capable BOOLEAN NOT NULL DEFAULT true,
  automation_function TEXT,
  prerequisites TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Optimization progress logs
CREATE TABLE public.optimization_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'success', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  file_path TEXT,
  line_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance metrics tracking
CREATE TABLE public.performance_metrics_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  measurement_context JSONB DEFAULT '{}',
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation session tracking
CREATE TABLE public.automation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_task_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.optimization_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (since this is performance optimization)
CREATE POLICY "Optimization data is publicly readable" ON public.optimization_tasks
  FOR SELECT USING (true);

CREATE POLICY "System can manage optimization tasks" ON public.optimization_tasks
  FOR ALL USING (true);

CREATE POLICY "Optimization logs are publicly readable" ON public.optimization_logs
  FOR SELECT USING (true);

CREATE POLICY "System can manage optimization logs" ON public.optimization_logs
  FOR ALL USING (true);

CREATE POLICY "Performance metrics are publicly readable" ON public.performance_metrics_history
  FOR SELECT USING (true);

CREATE POLICY "System can manage performance metrics" ON public.performance_metrics_history
  FOR ALL USING (true);

CREATE POLICY "Automation sessions are publicly readable" ON public.automation_sessions
  FOR SELECT USING (true);

CREATE POLICY "System can manage automation sessions" ON public.automation_sessions
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_optimization_tasks_status ON public.optimization_tasks(status);
CREATE INDEX idx_optimization_tasks_category ON public.optimization_tasks(category);
CREATE INDEX idx_optimization_logs_task_id ON public.optimization_logs(task_id);
CREATE INDEX idx_performance_metrics_name ON public.performance_metrics_history(metric_name);
CREATE INDEX idx_automation_sessions_status ON public.automation_sessions(status);

-- Create triggers for updated_at
CREATE TRIGGER update_optimization_tasks_updated_at
  BEFORE UPDATE ON public.optimization_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_sessions_updated_at
  BEFORE UPDATE ON public.automation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial optimization tasks
INSERT INTO public.optimization_tasks (task_id, title, description, category, priority, estimated_time, automation_capable, automation_function, prerequisites) VALUES
('bundle-code-splitting', 'Implement Code Splitting', 'Split routes and components to reduce initial bundle size using React.lazy and dynamic imports', 'bundle', 'high', '2-3 hours', true, 'optimize_code_splitting', ARRAY[]::TEXT[]),
('image-lazy-loading', 'Optimize Image Loading', 'Add lazy loading, WebP format conversion, and responsive images', 'images', 'high', '1-2 hours', true, 'optimize_images', ARRAY[]::TEXT[]),
('component-memoization', 'Add React.memo to Components', 'Implement React.memo, useMemo, and useCallback to prevent unnecessary re-renders', 'components', 'medium', '2-3 hours', true, 'optimize_components', ARRAY[]::TEXT[]),
('mobile-touch-optimization', 'Optimize Touch Interactions', 'Improve button sizes, touch targets, and mobile interactions', 'mobile', 'medium', '1-2 hours', true, 'optimize_mobile_interactions', ARRAY[]::TEXT[]),
('service-worker-caching', 'Implement Service Worker', 'Add caching strategy and offline functionality using service workers', 'caching', 'medium', '3-4 hours', true, 'implement_service_worker', ARRAY['bundle-code-splitting']),
('database-query-optimization', 'Database Query Optimization', 'Optimize Supabase queries, add indexes, and implement query caching', 'database', 'high', '2-3 hours', true, 'optimize_database_queries', ARRAY[]::TEXT[]),
('skeleton-loading-states', 'Add Skeleton Loading States', 'Implement skeleton components for better perceived performance', 'components', 'medium', '1-2 hours', true, 'add_skeleton_loaders', ARRAY[]::TEXT[]),
('bundle-analysis-optimization', 'Bundle Size Analysis & Tree Shaking', 'Analyze bundle composition and remove unused dependencies', 'bundle', 'high', '2-3 hours', true, 'analyze_and_optimize_bundle', ARRAY[]::TEXT[]),
('mobile-responsive-optimization', 'Mobile Responsive Design Optimization', 'Ensure all components work seamlessly across device sizes', 'mobile', 'medium', '2-3 hours', true, 'optimize_responsive_design', ARRAY['mobile-touch-optimization']),
('performance-monitoring-setup', 'Performance Monitoring Setup', 'Implement real-time performance monitoring and alerting', 'caching', 'low', '1-2 hours', true, 'setup_performance_monitoring', ARRAY['service-worker-caching']);