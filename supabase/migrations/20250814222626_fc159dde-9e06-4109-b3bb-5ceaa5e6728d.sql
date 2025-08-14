-- Remove party-planner testing task from database to prevent preloading
DELETE FROM public.optimization_tasks WHERE task_id = 'party-planner-testing';

-- Clean up any automation logs that mention party planner  
UPDATE public.optimization_logs 
SET message = 'Party planner task removed to prevent preloading'
WHERE message LIKE '%party%planner%' OR message LIKE '%test_party_planner%';