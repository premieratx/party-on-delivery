-- Fix 1: Add missing theme column to cover_pages table
ALTER TABLE public.cover_pages 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'default';

-- Fix 2: Update customer RLS policies to allow proper access
DROP POLICY IF EXISTS "customers_admin_access" ON public.customers;
DROP POLICY IF EXISTS "customers_self_strict" ON public.customers;

CREATE POLICY "customers_service_and_admin_access" ON public.customers
FOR ALL USING (
  auth.role() = 'service_role' OR 
  is_admin_user_safe() OR 
  email = auth.email() OR
  email = (auth.jwt() ->> 'email')
) WITH CHECK (
  auth.role() = 'service_role' OR 
  is_admin_user_safe() OR 
  email = auth.email() OR
  email = (auth.jwt() ->> 'email')
);

-- Fix 3: Update customer_orders RLS policies
DROP POLICY IF EXISTS "customer_orders_admin_access" ON public.customer_orders;
DROP POLICY IF EXISTS "customer_orders_self_strict" ON public.customer_orders;

CREATE POLICY "customer_orders_enhanced_access" ON public.customer_orders
FOR ALL USING (
  auth.role() = 'service_role' OR 
  is_admin_user_safe() OR 
  (delivery_address ->> 'email') = auth.email() OR
  (delivery_address ->> 'email') = (auth.jwt() ->> 'email') OR
  session_id = (auth.jwt() ->> 'session_id')
) WITH CHECK (
  auth.role() = 'service_role' OR 
  is_admin_user_safe() OR 
  (delivery_address ->> 'email') = auth.email() OR
  (delivery_address ->> 'email') = (auth.jwt() ->> 'email')
);

-- Fix 4: Ensure cover_pages table has all needed columns and proper RLS
ALTER TABLE public.cover_pages 
ADD COLUMN IF NOT EXISTS created_by text,
ADD COLUMN IF NOT EXISTS flow_description text,
ADD COLUMN IF NOT EXISTS affiliate_slug text,
ADD COLUMN IF NOT EXISTS affiliate_assigned_slug text,
ADD COLUMN IF NOT EXISTS flow_name text;

-- Fix 5: Create function to handle customer session linking
CREATE OR REPLACE FUNCTION public.link_customer_session_enhanced(
  customer_email text, 
  session_token text,
  order_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  customer_id bigint;
  result jsonb;
BEGIN
  -- Upsert customer record
  INSERT INTO public.customers (email, name, phone, updated_at)
  VALUES (
    customer_email,
    COALESCE(order_data->>'customer_name', ''),
    COALESCE(order_data->>'customer_phone', ''),
    now()
  )
  ON CONFLICT (email) 
  DO UPDATE SET 
    name = COALESCE(EXCLUDED.name, customers.name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    updated_at = now()
  RETURNING id INTO customer_id;
  
  -- Link any orders with this session to customer
  UPDATE public.customer_orders 
  SET customer_id = customer_id
  WHERE session_id = session_token AND customer_id IS NULL;
  
  -- Return success with customer info
  SELECT jsonb_build_object(
    'success', true,
    'customer_id', customer_id,
    'linked_orders', (
      SELECT COUNT(*) FROM public.customer_orders 
      WHERE customer_id = customer_id OR session_id = session_token
    )
  ) INTO result;
  
  RETURN result;
END;
$$;