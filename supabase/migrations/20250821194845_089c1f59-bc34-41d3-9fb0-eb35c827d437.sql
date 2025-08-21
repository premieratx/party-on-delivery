-- Enable extensions needed for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the scheduled job to keep functions warm every 5 minutes
SELECT cron.schedule(
  'keep-functions-alive',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/keep-alive-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
        body:='{"trigger": "cron_job"}'::jsonb
    ) as request_id;
  $$
);

-- Create immediate trigger to start the warming process
SELECT
  net.http_post(
      url:='https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/keep-alive-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
      body:='{"trigger": "immediate_start"}'::jsonb
  ) as initial_warming;

-- Log the setup
INSERT INTO public.optimization_logs (task_id, log_level, message, details)
VALUES ('automated-warming-active', 'info', 'AUTOMATED CACHE WARMING NOW ACTIVE', 
        jsonb_build_object(
          'status', 'LIVE AND ACTIVE',
          'schedule', 'Every 5 minutes via pg_cron',
          'functions_kept_warm', '["cache-warmer", "get-unified-products", "ultra-fast-search", "fetch-shopify-products"]',
          'no_more_cold_starts', true,
          'setup_completed', NOW()
        ));