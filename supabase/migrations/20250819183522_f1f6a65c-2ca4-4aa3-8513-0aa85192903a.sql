-- Create function to sanitize order data after processing
CREATE OR REPLACE FUNCTION public.sanitize_order_payment_data(payment_intent_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Remove sensitive payment data from order after successful processing
  UPDATE public.orders 
  SET stripe_payment_intent_id = NULL
  WHERE stripe_payment_intent_id = payment_intent_id_param
    AND payment_status = 'completed';
    
  -- Remove stripe session IDs from order drafts that are completed
  UPDATE public.order_drafts
  SET stripe_session_id = NULL
  WHERE stripe_session_id IS NOT NULL
    AND expires_at < now();
    
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
      'payment_intent_id', payment_intent_id_param,
      'action', 'payment_data_removed_after_processing',
      'timestamp', now()
    ),
    now()
  );
END;
$function$