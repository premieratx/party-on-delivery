-- Fix remaining function search paths
ALTER FUNCTION log_security_event(text, text, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION verify_admin_password(text, text) SET search_path = public, pg_catalog;
ALTER FUNCTION is_admin_user() SET search_path = public, pg_catalog;
ALTER FUNCTION track_affiliate_order(text, text, jsonb) SET search_path = public, pg_catalog;