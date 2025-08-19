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