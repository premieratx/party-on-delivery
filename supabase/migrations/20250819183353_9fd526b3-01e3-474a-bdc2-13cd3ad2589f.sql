-- Create function to clean up sensitive payment data
CREATE OR REPLACE FUNCTION public.cleanup_sensitive_payment_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Clean up expired order drafts with payment info
  DELETE FROM public.order_drafts 
  WHERE expires_at < now() 
    AND stripe_session_id IS NOT NULL;
  
  -- Remove Stripe payment intent IDs from completed orders older than 24 hours
  UPDATE public.orders 
  SET stripe_payment_intent_id = NULL
  WHERE created_at < now() - INTERVAL '24 hours'
    AND payment_status = 'completed'
    AND stripe_payment_intent_id IS NOT NULL;
  
  -- Clean up old session data that might contain payment info
  DELETE FROM public.cart_sessions
  WHERE expires_at < now();
  
  -- Log cleanup activity
  INSERT INTO public.security_audit_log (
    event_type,
    user_email,
    details,
    created_at
  ) VALUES (
    'payment_data_cleanup',
    'system',
    jsonb_build_object(
      'action', 'sensitive_payment_data_cleanup',
      'timestamp', now()
    ),
    now()
  );
END;
$function$

-- Create function to sanitize order data after processing
CREATE OR REPLACE FUNCTION public.sanitize_order_payment_data(order_id_param bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Remove sensitive payment data from order after successful processing
  UPDATE public.orders 
  SET stripe_payment_intent_id = NULL
  WHERE id = order_id_param
    AND payment_status = 'completed';
    
  -- Log sanitization
  INSERT INTO public.security_audit_log (
    event_type,
    user_email,
    details,
    created_at
  ) VALUES (
    'order_payment_sanitization',
    'system',
    jsonb_build_object(
      'order_id', order_id_param,
      'action', 'payment_data_removed_after_processing',
      'timestamp', now()
    ),
    now()
  );
END;
$function$

-- Create scheduled cleanup job that runs every hour
SELECT cron.schedule(
  'cleanup-payment-data',
  '0 * * * *', -- Every hour
  'SELECT public.cleanup_sensitive_payment_data();'
);