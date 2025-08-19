-- Disable frequent automation cron jobs that are causing excessive Shopify syncing
SELECT cron.unschedule('performance-optimization-automation');
SELECT cron.unschedule('auto-retry-failed-tasks'); 
SELECT cron.unschedule('automation-health-check');

-- Create a much less frequent health check (once per hour instead of every 5-15 minutes)
SELECT cron.schedule(
  'automation-health-check-hourly',
  '0 * * * *', -- every hour at the top of the hour
  $$
  SELECT
    net.http_post(
        url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/optimization-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
        body:='{"action": "health_check_and_resume"}'::jsonb
    ) as request_id;
  $$
);

-- Log the change
INSERT INTO optimization_logs (task_id, log_level, message, details) VALUES 
('cron-optimization', 'info', 'Reduced automation frequency to prevent excessive Shopify API calls', 
 jsonb_build_object('change', 'Disabled frequent cron jobs, added hourly health check', 'timestamp', now()));