-- Save affiliate program configuration as reusable templates
INSERT INTO configuration_templates (
  template_name,
  template_type,
  description,
  version,
  configuration
) VALUES (
  'Affiliate Program Complete',
  'affiliate_system',
  'Complete affiliate program with Google OAuth, dashboard, referral tracking, and commission management',
  '1.0',
  jsonb_build_object(
    'tables', jsonb_build_array(
      'affiliates',
      'affiliate_referrals', 
      'commission_payouts',
      'admin_users',
      'admin_notifications',
      'abandoned_orders'
    ),
    'pages', jsonb_build_array(
      '/affiliate',
      '/affiliate/dashboard', 
      '/affiliate/admin-login',
      '/affiliate/admin/dashboard',
      '/affiliate/intro',
      '/affiliate/landing',
      '/affiliate/complete-signup'
    ),
    'auth_providers', jsonb_build_array('google'),
    'features', jsonb_build_object(
      'google_oauth', true,
      'referral_tracking', true,
      'commission_calculation', true,
      'admin_dashboard', true,
      'payout_management', true,
      'abandoned_cart_tracking', true
    )
  )
);

-- Create customer management system tables
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  google_id text UNIQUE,
  first_name text,
  last_name text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login_at timestamp with time zone,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0.00,
  referred_by_affiliate_id uuid REFERENCES affiliates(id),
  referred_by_code text
);

CREATE TABLE public.customer_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES customers(id),
  order_number text NOT NULL,
  shopify_order_id text,
  session_id text,
  status text DEFAULT 'pending',
  subtotal numeric NOT NULL,
  delivery_fee numeric DEFAULT 0.00,
  total_amount numeric NOT NULL,
  delivery_date date,
  delivery_time text,
  delivery_address jsonb NOT NULL,
  special_instructions text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  affiliate_code text,
  affiliate_id uuid REFERENCES affiliates(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  delivered_at timestamp with time zone
);

CREATE TABLE public.customer_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customer RLS policies
CREATE POLICY "Customers can view their own profile" 
ON public.customers 
FOR SELECT 
USING (email = auth.email());

CREATE POLICY "Customers can update their own profile" 
ON public.customers 
FOR UPDATE 
USING (email = auth.email());

CREATE POLICY "Anyone can create customer profiles" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

-- Customer orders RLS policies
CREATE POLICY "Customers can view their own orders" 
ON public.customer_orders 
FOR SELECT 
USING (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

CREATE POLICY "System can create orders" 
ON public.customer_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Customers can update their own orders" 
ON public.customer_orders 
FOR UPDATE 
USING (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

-- Customer addresses RLS policies  
CREATE POLICY "Customers can manage their own addresses" 
ON public.customer_addresses 
FOR ALL 
USING (customer_id IN (SELECT id FROM customers WHERE email = auth.email()));

-- Admin access to customer data
CREATE POLICY "Admin users can view all customers" 
ON public.customers 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Admin users can view all customer orders" 
ON public.customer_orders 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_orders_updated_at
BEFORE UPDATE ON public.customer_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();