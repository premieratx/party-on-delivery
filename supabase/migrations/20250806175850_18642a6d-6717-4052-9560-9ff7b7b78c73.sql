-- CRITICAL SECURITY FIX: Enable RLS on unprotected tables and create appropriate policies

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on delivery_apps table  
ALTER TABLE public.delivery_apps ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers table
CREATE POLICY "Users can view their own customer data" 
ON public.customers 
FOR SELECT 
USING (email = auth.email());

CREATE POLICY "Users can insert their own customer data" 
ON public.customers 
FOR INSERT 
WITH CHECK (email = auth.email());

CREATE POLICY "Users can update their own customer data" 
ON public.customers 
FOR UPDATE 
USING (email = auth.email());

CREATE POLICY "Admin users can view all customers" 
ON public.customers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Create RLS policies for delivery_apps table
CREATE POLICY "Delivery apps are publicly viewable" 
ON public.delivery_apps 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admin users can manage delivery apps" 
ON public.delivery_apps 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

-- Create RLS policies for orders table
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (customer_email = auth.email());

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (customer_email = auth.email());

CREATE POLICY "Admin users can view all orders" 
ON public.orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.email = auth.email()
));

CREATE POLICY "System can manage orders" 
ON public.orders 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix database functions with missing search_path
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