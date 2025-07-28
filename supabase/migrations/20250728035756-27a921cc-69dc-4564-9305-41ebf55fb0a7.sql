-- Expand optimization_tasks to include ALL implementation phases

-- Add new comprehensive tasks covering all phases
INSERT INTO public.optimization_tasks (task_id, title, description, category, priority, estimated_time, automation_capable, automation_function, prerequisites) VALUES
-- Phase 1: Setup & Configuration
('telegram-webhook-setup', 'Configure Telegram Webhook', 'Set up Telegram bot infrastructure and webhook endpoints', 'database', 'high', '1-2 hours', true, 'setup_telegram_webhook', ARRAY[]::TEXT[]),
('monitoring-system-init', 'Initialize Monitoring Systems', 'Set up comprehensive system monitoring and health checks', 'database', 'high', '2-3 hours', true, 'initialize_monitoring', ARRAY[]::TEXT[]),
('database-connections-test', 'Test Database Connections', 'Verify all database connections and performance', 'database', 'high', '1 hour', true, 'test_database_connections', ARRAY[]::TEXT[]),

-- Phase 2: Automated Testing
('homepage-functionality-test', 'Homepage Functionality Testing', 'Comprehensive automated testing of homepage features', 'components', 'high', '2-3 hours', true, 'test_homepage_functionality', ARRAY[]::TEXT[]),
('delivery-widget-testing', 'Delivery Widget Testing', 'End-to-end testing of delivery widget flows', 'components', 'high', '3-4 hours', true, 'test_delivery_widget', ARRAY[]::TEXT[]),
('party-planner-testing', 'Party Planner Flow Testing', 'Complete testing of party planning workflows', 'components', 'high', '2-3 hours', true, 'test_party_planner', ARRAY[]::TEXT[]),
('checkout-process-validation', 'Checkout Process Validation', 'Thorough testing of checkout and payment flows', 'components', 'high', '3-4 hours', true, 'validate_checkout_process', ARRAY[]::TEXT[]),
('admin-dashboard-verification', 'Admin Dashboard Verification', 'Complete testing of admin dashboard functionality', 'components', 'medium', '2-3 hours', true, 'verify_admin_dashboard', ARRAY[]::TEXT[]),

-- Enhanced Performance & UX (expanding current tasks)
('image-compression-optimization', 'Product Image Compression', 'Compress and resize product images for faster loading', 'images', 'high', '1-2 hours', true, 'optimize_product_images', ARRAY[]::TEXT[]),
('progressive-web-app-setup', 'Progressive Web App Setup', 'Convert app to PWA with offline capabilities', 'caching', 'medium', '3-4 hours', true, 'setup_progressive_web_app', ARRAY['service-worker-caching']),
('font-optimization', 'Font Loading Optimization', 'Optimize web font loading and rendering', 'bundle', 'medium', '1-2 hours', true, 'optimize_font_loading', ARRAY[]::TEXT[]),
('critical-css-extraction', 'Critical CSS Extraction', 'Extract and inline critical CSS for faster rendering', 'bundle', 'medium', '2-3 hours', true, 'extract_critical_css', ARRAY[]::TEXT[]),
('third-party-script-optimization', 'Third-party Script Optimization', 'Optimize loading of third-party scripts and analytics', 'bundle', 'medium', '1-2 hours', true, 'optimize_third_party_scripts', ARRAY[]::TEXT[]),

-- Phase 4: Production Deployment
('production-environment-setup', 'Production Environment Setup', 'Configure production deployment environment', 'caching', 'high', '4-6 hours', true, 'setup_production_environment', ARRAY['service-worker-caching']),
('ssl-certificate-config', 'SSL Certificate Configuration', 'Set up SSL certificates and security headers', 'caching', 'high', '1-2 hours', true, 'configure_ssl_certificates', ARRAY[]::TEXT[]),
('cdn-optimization-setup', 'CDN Optimization Setup', 'Configure CDN for global content delivery', 'caching', 'medium', '2-3 hours', true, 'setup_cdn_optimization', ARRAY['production-environment-setup']),
('production-monitoring-activation', 'Production Monitoring Activation', 'Activate comprehensive production monitoring', 'database', 'high', '2-3 hours', true, 'activate_production_monitoring', ARRAY['monitoring-system-init']),

-- Phase 5: Live Monitoring & Support
('automated-monitoring-247', '24/7 Automated Monitoring', 'Set up continuous automated monitoring systems', 'database', 'high', '3-4 hours', true, 'setup_247_monitoring', ARRAY['production-monitoring-activation']),
('real-time-issue-detection', 'Real-time Issue Detection', 'Implement proactive issue detection and alerting', 'database', 'medium', '2-3 hours', true, 'setup_issue_detection', ARRAY['automated-monitoring-247']),
('proactive-maintenance-system', 'Proactive Maintenance System', 'Automated maintenance and optimization routines', 'database', 'medium', '3-4 hours', true, 'setup_proactive_maintenance', ARRAY['real-time-issue-detection']),
('user-feedback-integration', 'User Feedback Integration', 'Implement user feedback collection and analysis', 'components', 'low', '2-3 hours', true, 'integrate_user_feedback', ARRAY[]::TEXT[]),

-- Additional Mobile Optimization
('capacitor-native-optimization', 'Capacitor Native Optimization', 'Optimize app for native deployment with Capacitor', 'mobile', 'high', '4-6 hours', true, 'optimize_capacitor_native', ARRAY['mobile-responsive-optimization']),
('app-store-preparation', 'App Store Preparation', 'Prepare app for iOS and Android app store deployment', 'mobile', 'medium', '3-4 hours', true, 'prepare_app_stores', ARRAY['capacitor-native-optimization']),

-- Advanced Performance
('memory-leak-detection', 'Memory Leak Detection & Prevention', 'Detect and prevent memory leaks in React components', 'components', 'medium', '2-3 hours', true, 'detect_memory_leaks', ARRAY['component-memoization']),
('web-vitals-optimization', 'Core Web Vitals Optimization', 'Optimize for Google Core Web Vitals metrics', 'bundle', 'high', '3-4 hours', true, 'optimize_web_vitals', ARRAY['bundle-code-splitting', 'image-lazy-loading']);

-- Add phase tracking columns to optimization_tasks
ALTER TABLE public.optimization_tasks ADD COLUMN IF NOT EXISTS phase_name TEXT DEFAULT 'Performance & UX Optimization';
ALTER TABLE public.optimization_tasks ADD COLUMN IF NOT EXISTS parallel_execution BOOLEAN DEFAULT false;
ALTER TABLE public.optimization_tasks ADD COLUMN IF NOT EXISTS autonomous_capable BOOLEAN DEFAULT true;

-- Update phase assignments
UPDATE public.optimization_tasks SET phase_name = 'Setup & Configuration' 
WHERE task_id IN ('telegram-webhook-setup', 'monitoring-system-init', 'database-connections-test');

UPDATE public.optimization_tasks SET phase_name = 'Automated Testing' 
WHERE task_id IN ('homepage-functionality-test', 'delivery-widget-testing', 'party-planner-testing', 'checkout-process-validation', 'admin-dashboard-verification');

UPDATE public.optimization_tasks SET phase_name = 'Performance & UX Optimization' 
WHERE task_id IN ('bundle-code-splitting', 'image-lazy-loading', 'component-memoization', 'mobile-touch-optimization', 'service-worker-caching', 'database-query-optimization', 'skeleton-loading-states', 'bundle-analysis-optimization', 'mobile-responsive-optimization', 'performance-monitoring-setup', 'image-compression-optimization', 'progressive-web-app-setup', 'font-optimization', 'critical-css-extraction', 'third-party-script-optimization', 'memory-leak-detection', 'web-vitals-optimization');

UPDATE public.optimization_tasks SET phase_name = 'Production Deployment' 
WHERE task_id IN ('production-environment-setup', 'ssl-certificate-config', 'cdn-optimization-setup', 'production-monitoring-activation');

UPDATE public.optimization_tasks SET phase_name = 'Live Monitoring & Support' 
WHERE task_id IN ('automated-monitoring-247', 'real-time-issue-detection', 'proactive-maintenance-system', 'user-feedback-integration');

UPDATE public.optimization_tasks SET phase_name = 'Mobile & App Store' 
WHERE task_id IN ('capacitor-native-optimization', 'app-store-preparation');

-- Mark tasks that can run in parallel
UPDATE public.optimization_tasks SET parallel_execution = true 
WHERE task_id IN ('image-lazy-loading', 'component-memoization', 'mobile-touch-optimization', 'skeleton-loading-states', 'font-optimization', 'third-party-script-optimization', 'homepage-functionality-test', 'user-feedback-integration');

-- Create master automation session table
CREATE TABLE IF NOT EXISTS public.master_automation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  phases_included TEXT[] NOT NULL,
  total_phases INTEGER NOT NULL,
  completed_phases INTEGER NOT NULL DEFAULT 0,
  current_phase TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  parallel_execution_enabled BOOLEAN NOT NULL DEFAULT true,
  autonomous_mode BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_automation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Master automation sessions are publicly accessible" ON public.master_automation_sessions
  FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_master_automation_sessions_updated_at
  BEFORE UPDATE ON public.master_automation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();