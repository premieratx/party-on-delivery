-- Force refresh Shopify collections and products immediately
SELECT content::jsonb FROM http((
  'POST', 
  'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/unified-shopify-sync',
  ARRAY[http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzNDE1NCwiZXhwIjoyMDY4NTEwMTU0fQ.ZyOHdJQpSQmF5f_-nGgJ9M3yCUOw8FgEjfTwePE1AcI'), http_header('Content-Type', 'application/json')],
  '{"forceRefresh": true}'
));