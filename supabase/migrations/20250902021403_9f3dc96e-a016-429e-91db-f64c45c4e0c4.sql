-- Enable real-time for customer_orders table
ALTER TABLE public.customer_orders REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.customer_orders;

-- Enable real-time for abandoned_orders table  
ALTER TABLE public.abandoned_orders REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.abandoned_orders;

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly sync for abandoned orders (every hour at minute 0)
SELECT cron.schedule(
  'sync-abandoned-orders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/auto-sync-abandoned-orders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
    body := '{"action": "sync_abandoned"}'::jsonb
  );
  $$
);

-- Create function to trigger real-time completed order sync
CREATE OR REPLACE FUNCTION trigger_completed_order_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for completed/confirmed orders
  IF NEW.status IN ('completed', 'confirmed', 'delivered') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'confirmed', 'delivered')) THEN
    
    PERFORM net.http_post(
      url := 'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/auto-sync-completed-orders',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"}'::jsonb,
      body := json_build_object('orderId', NEW.id, 'action', 'sync_completed')::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;