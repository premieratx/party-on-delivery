-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to send progress updates every 2 hours to chat
SELECT cron.schedule(
  'automation-progress-updates',
  '0 */2 * * *', -- every 2 hours at the top of the hour
  $$
  SELECT
    net.http_post(
        url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/ai-coordinator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
        body:=('{"action": "send_progress_update", "timestamp": "' || now() || '"}')::jsonb
    ) as request_id;
  $$
);

-- Create cron job to automatically retry failed tasks every 30 minutes
SELECT cron.schedule(
  'auto-retry-failed-tasks',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/optimization-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
        body:='{"action": "auto_retry_failed_tasks"}'::jsonb
    ) as request_id;
  $$
);

-- Create cron job to ensure automation keeps running every 15 minutes
SELECT cron.schedule(
  'automation-health-check',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/optimization-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
        body:='{"action": "health_check_and_resume"}'::jsonb
    ) as request_id;
  $$
);