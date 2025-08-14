-- Remove party-planner testing task from database to prevent preloading
DELETE FROM public.optimization_tasks WHERE task_id = 'party-planner-testing';

-- Remove any automation template references to party planner
UPDATE public.automation_templates 
SET tasks_config = jsonb_path_delete(tasks_config, '$[*] ? (@.task_id == "party-planner-testing")')
WHERE tasks_config::text LIKE '%party-planner-testing%';

-- Clean up any automation logs that mention party planner
UPDATE public.optimization_logs 
SET message = 'Party planner task removed to prevent preloading'
WHERE message LIKE '%party%planner%' OR message LIKE '%test_party_planner%';