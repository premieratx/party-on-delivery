-- Add session_token to customers table to link orders via session ID
ALTER TABLE public.customers 
ADD COLUMN session_tokens TEXT[] DEFAULT '{}';

-- Create index for faster session token lookups
CREATE INDEX idx_customers_session_tokens ON public.customers USING GIN(session_tokens);

-- Function to link customer to session ID
CREATE OR REPLACE FUNCTION public.link_customer_session(
  customer_email TEXT,
  session_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;