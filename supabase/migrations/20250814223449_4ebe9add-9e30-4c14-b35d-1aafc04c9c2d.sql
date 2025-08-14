-- COMPLETE POSTHOG AND PARTY PLANNER ELIMINATION - Build: 2025_08_14_22_33
-- Remove all PostHog analytics, party planner tasks, and AI voice assistant

-- Delete all party-planner automation logs
DELETE FROM optimization_logs WHERE task_id LIKE '%party-planner%' OR task_id LIKE '%party_planner%';

-- Delete all PostHog analytics logs  
DELETE FROM optimization_logs WHERE message LIKE '%PostHog%' OR message LIKE '%analytics%' OR message LIKE '%tracking%';

-- Delete all AI voice party planner logs
DELETE FROM optimization_logs WHERE task_id LIKE '%ai-voice%' OR task_id LIKE '%voice-assistant%' OR message LIKE '%voice%';

-- Clean up automation templates that reference party planner
DELETE FROM automation_templates WHERE template_name LIKE '%party-planner%' OR automation_config::text LIKE '%party-planner%';

-- Clean up any automation sessions with party planner tasks
DELETE FROM automation_sessions WHERE session_name LIKE '%party-planner%';

-- Remove any AI testing issues related to party planner
DELETE FROM ai_testing_issues WHERE description LIKE '%party-planner%' OR flow LIKE '%party-planner%';

-- Remove AI testing sessions for party planner
DELETE FROM ai_testing_sessions WHERE app_url LIKE '%party-planner%' OR current_flow LIKE '%party-planner%';

-- Clean up abandoned orders with party planner data
DELETE FROM abandoned_orders WHERE session_id LIKE '%party-planner%';

-- Drop analytics tables if they exist
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS unique_visitors CASCADE;
DROP TABLE IF EXISTS session_analytics CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;

-- Insert cleanup log
INSERT INTO optimization_logs (task_id, log_level, message, details)
VALUES ('posthog-elimination', 'info', 'Complete PostHog and Party Planner elimination completed', 
        jsonb_build_object('timestamp', now(), 'build', '2025_08_14_22_33'));