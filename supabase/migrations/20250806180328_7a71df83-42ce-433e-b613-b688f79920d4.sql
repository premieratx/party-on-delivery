-- Fix remaining database functions with missing search_path
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_email text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash text;
  admin_id text;
BEGIN
  -- Log the authentication attempt
  SELECT id, password_hash INTO admin_id, stored_hash 
  FROM admin_users 
  WHERE email = input_email;
  
  -- Log security event
  PERFORM log_security_event(
    'admin_login_attempt',
    input_email,
    jsonb_build_object('success', stored_hash IS NOT NULL)
  );
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify password
  IF stored_hash = crypt(input_password, stored_hash) THEN
    -- Log successful login
    PERFORM log_security_event(
      'admin_login_success',
      input_email,
      jsonb_build_object('admin_id', admin_id)
    );
    RETURN true;
  ELSE
    -- Log failed login
    PERFORM log_security_event(
      'admin_login_failed',
      input_email,
      jsonb_build_object('reason', 'invalid_password')
    );
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_customer_session(customer_email text, session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Add session token to customer's session_tokens array if not already present
  UPDATE public.customers
  SET session_tokens = array_append(session_tokens, session_token)
  WHERE email = customer_email 
    AND NOT (session_token = ANY(session_tokens));
    
  -- Also update any customer_orders that have this session_id but no customer_id
  UPDATE public.customer_orders
  SET customer_id = (
    SELECT id FROM public.customers WHERE email = customer_email
  )
  WHERE session_id = session_token AND customer_id IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_automation_template(template_name_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  template_record RECORD;
  result JSONB;
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM automation_templates 
  WHERE template_name = template_name_param 
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template not found: ' || template_name_param
    );
  END IF;
  
  -- Log template execution
  INSERT INTO optimization_logs (
    task_id,
    log_level,
    message,
    details
  ) VALUES (
    'template-execution',
    'info',
    'Executing automation template: ' || template_name_param,
    jsonb_build_object(
      'template_id', template_record.id,
      'config', template_record.automation_config
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'template_id', template_record.id,
    'message', 'Template loaded successfully',
    'config', template_record.automation_config,
    'tasks', template_record.tasks_config,
    'settings', template_record.execution_settings
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_daily_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_views INTEGER;
  unique_count INTEGER;
  new_visitors INTEGER;
  returning_visitors INTEGER;
BEGIN
  -- Get today's statistics
  SELECT COUNT(*) INTO total_views 
  FROM page_views 
  WHERE DATE(timestamp) = today_date;
  
  SELECT COUNT(DISTINCT session_id) INTO unique_count 
  FROM page_views 
  WHERE DATE(timestamp) = today_date;
  
  SELECT COUNT(*) INTO new_visitors 
  FROM unique_visitors 
  WHERE DATE(first_visit) = today_date;
  
  SELECT COUNT(*) INTO returning_visitors 
  FROM unique_visitors 
  WHERE DATE(last_visit) = today_date AND DATE(first_visit) < today_date;
  
  -- Update or insert daily analytics
  INSERT INTO daily_analytics (date, total_page_views, unique_visitors, new_visitors, returning_visitors)
  VALUES (today_date, total_views, unique_count, new_visitors, returning_visitors)
  ON CONFLICT (date) 
  DO UPDATE SET 
    total_page_views = EXCLUDED.total_page_views,
    unique_visitors = EXCLUDED.unique_visitors,
    new_visitors = EXCLUDED.new_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    updated_at = now();
END;
$function$;