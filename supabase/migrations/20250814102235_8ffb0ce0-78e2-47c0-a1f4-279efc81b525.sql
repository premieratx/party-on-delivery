-- Fix security issues: Add missing search path settings to functions

-- 1. Fix search path for functions that need it
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.cache WHERE expires_at < EXTRACT(EPOCH FROM now()) * 1000;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.recent_orders WHERE expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clean up expired session progress
  DELETE FROM public.user_session_progress WHERE expires_at < now();
  
  -- Clean up expired saved carts
  DELETE FROM public.saved_carts WHERE expires_at < now();
  
  -- Clean up expired order drafts
  DELETE FROM public.order_drafts WHERE expires_at < now();
  
  -- Log cleanup
  INSERT INTO public.optimization_logs (task_id, log_level, message, details)
  VALUES ('cleanup-progress', 'info', 'Cleaned up expired progress data', jsonb_build_object('timestamp', now()));
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update affiliate stats when new referral is added
  UPDATE public.affiliates 
  SET 
    total_sales = COALESCE((
      SELECT SUM(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    total_commission = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_unpaid = COALESCE((
      SELECT SUM(commission_amount) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id AND paid_out = false
    ), 0),
    orders_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    largest_order = COALESCE((
      SELECT MAX(subtotal) 
      FROM public.affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ), 0),
    commission_rate = CASE 
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 20000 THEN 10.00
      WHEN COALESCE((
        SELECT SUM(subtotal) 
        FROM public.affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ), 0) >= 10000 THEN 7.50
      ELSE 5.00
    END,
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_affiliate_code(company_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base code from company name (first 6 chars, uppercase, alphanumeric only)
  base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 6);
  
  -- If base_code is empty or too short, use random string
  IF LENGTH(base_code) < 3 THEN
    base_code := 'AFF' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END IF;
  
  final_code := base_code;
  
  -- Check if code exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = final_code) LOOP
    final_code := base_code || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$function$;

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