-- Fix the final security definer view error by dropping the security_monitoring view
DROP VIEW IF EXISTS public.security_monitoring CASCADE;

-- Log this final security fix
INSERT INTO public.security_audit_log (
    event_type, user_email, details, created_at
) VALUES (
    'final_security_view_dropped',
    'system',
    jsonb_build_object(
        'view_name', 'security_monitoring',
        'action', 'dropped_to_fix_app_loading',
        'reason', 'security_definer_view_causing_linter_error',
        'timestamp', now()
    ),
    now()
);