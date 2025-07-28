-- Enable pg_cron extension for scheduled tasks
SELECT cron.schedule(
  'performance-optimization-automation',
  '*/5 * * * *', -- Run every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/optimization-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
        body:='{"action": "run_next_task"}'::jsonb
    ) as request_id;
  $$
);