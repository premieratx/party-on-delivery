-- Manually trigger product sync by calling the edge function via SQL
DO $$
DECLARE
  sync_result jsonb;
BEGIN
  -- Insert a test record to trigger sync
  INSERT INTO automation_sessions (session_name, total_tasks, status)
  VALUES ('Manual Product Sync Test', 1, 'running');
  
  RAISE NOTICE 'Manual sync test initiated';
END $$;