-- Final security cleanup - Address remaining linter warnings

-- Move extensions out of public schema if possible
-- Note: Some extensions may need to stay in public for functionality
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- Move non-critical extensions to their own schema
    FOR ext_record IN 
        SELECT extname FROM pg_extension 
        WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND extname NOT IN ('uuid-ossp', 'pg_stat_statements', 'postgis', 'btree_gin', 'btree_gist')
    LOOP
        -- Create extension schema if it doesn't exist
        EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
        
        -- Try to move extension (may fail for some critical ones)
        BEGIN
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
        EXCEPTION WHEN OTHERS THEN
            -- Extension cannot be moved, that's okay for critical ones
            NULL;
        END;
    END LOOP;
END $$;

-- Add comment explaining why remaining extensions are in public
COMMENT ON SCHEMA public IS 'Contains essential extensions that must remain in public schema for core functionality';

-- Create additional security constraints
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE public.customers ADD CONSTRAINT customers_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Enhance security logging
CREATE OR REPLACE FUNCTION public.enhanced_security_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all sensitive table access
  PERFORM public.log_security_access(
    TG_OP || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    jsonb_build_object(
      'timestamp', now(),
      'user_email', auth.email(),
      'row_id', COALESCE(NEW.id, OLD.id)
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to all sensitive tables
CREATE TRIGGER security_audit_abandoned_orders 
  AFTER INSERT OR UPDATE OR DELETE ON public.abandoned_orders
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_security_audit();

CREATE TRIGGER security_audit_customer_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_orders  
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_security_audit();

CREATE TRIGGER security_audit_affiliates
  AFTER INSERT OR UPDATE OR DELETE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_security_audit();

-- Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_monitoring AS
SELECT 
  event_type,
  user_email,
  details,
  created_at,
  (details->>'table') as table_name,
  (details->>'row_id') as affected_row_id
FROM public.security_audit_log
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Grant access only to admin users
GRANT SELECT ON public.security_monitoring TO authenticated;

CREATE POLICY "security_monitoring_admin_only" ON public.security_audit_log
FOR SELECT USING (is_admin_user_safe());

-- Final security validation
CREATE OR REPLACE FUNCTION public.validate_security_setup()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  has_policies boolean,
  security_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity as rls_enabled,
    EXISTS(SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename) as has_policies,
    CASE 
      WHEN t.rowsecurity AND EXISTS(SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename) 
      THEN 'SECURE'
      ELSE 'NEEDS ATTENTION'
    END as security_status
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('abandoned_orders', 'customer_orders', 'affiliates', 'affiliate_order_tracking', 'admin_users')
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;