-- Clean up redundant migration audit logs and optimize system
DELETE FROM system_audit_log 
WHERE event_type LIKE '%mobile_scroll%' 
   OR event_type LIKE '%pull_refresh%'
   OR (created_at < NOW() - INTERVAL '7 days' AND severity = 'info');

-- Remove any unused analytics tables or columns if they exist
DO $$ 
BEGIN
    -- Check if daily_analytics table exists and drop if empty/unused
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_analytics') THEN
        IF (SELECT COUNT(*) FROM daily_analytics) = 0 THEN
            DROP TABLE IF EXISTS daily_analytics CASCADE;
            INSERT INTO system_audit_log (event_type, service_name, operation, user_email, response_data, severity)
            VALUES ('cleanup_unused_analytics_table', 'database_optimization', 'drop_table', 'system@cleanup', 
                   jsonb_build_object('table_dropped', 'daily_analytics', 'reason', 'no_data_found'), 'info');
        END IF;
    END IF;
END $$;