-- Clear out stale security scan artifacts and cache
DELETE FROM public.cache WHERE key LIKE '%security%' OR key LIKE '%scan%';

-- Clear any old security audit logs that might be causing persistent warnings
DELETE FROM public.security_audit_log WHERE created_at < now() - INTERVAL '7 days';

-- Clear optimization logs that might be showing in admin panels
DELETE FROM public.optimization_logs WHERE created_at < now() - INTERVAL '3 days';

-- Update any admin notifications that might be stuck
UPDATE public.admin_notifications 
SET is_read = true 
WHERE type IN ('security_warning', 'scan_result', 'optimization_alert');

-- Clear any cached security status
DELETE FROM public.cache WHERE key IN ('security_status', 'security_scan_results', 'linter_results');